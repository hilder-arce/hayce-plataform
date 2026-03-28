import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resend } from 'resend';

import { Notification } from './entities/notification.entity';
import { User } from 'src/users/entities/user.entity';
import { NotificationsGateway } from './notifications.gateway';
import { NotifyPayload } from './interfaces/notify.interface';

import { loginTemplate } from './templates/login.template';
import { newUserTemplate } from './templates/new-user.template';
import { revokeSessionTemplate } from './templates/revoke-session.template';
import { changePasswordTemplate } from './templates/change-password.template';
import { verifyCodeTemplate } from './templates/verify-code.template';

@Injectable()
export class NotificationsService {
  private readonly resend: Resend;
  private readonly from = 'HAYCE SYSTEMS <notificaciones@hilderarce.com>'; //DEBE SER CAMBIADO EN PRODUCCI�N POR UNA DIRECCI�N V�LIDA Y VERIFICADA EN RESEND

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly gateway: NotificationsGateway,
  ) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
  }

  // ======================================================
  // [ CORE ] - PROCESADOR CENTRAL DE NOTIFICACIONES
  // ======================================================
  private async notify(usuarioId: string, payload: NotifyPayload) {
    // 1. Terminación forzosa del socket de sesión
    const notification = await this.notificationModel.create({
      usuario: new Types.ObjectId(usuarioId),
      tipo: payload.tipo,
      titulo: payload.titulo,
      mensaje: payload.mensaje,
      data: payload.data ?? {},
    });

    // 2. Emisión en tiempo real vía WebSockets
    this.gateway.emitToUser(usuarioId, 'notification', {
      _id: notification._id,
      tipo: notification.tipo,
      titulo: notification.titulo,
      mensaje: notification.mensaje,
      data: notification.data,
      leida: notification.leida,
      createdAt: notification.createdAt,
    });

    // 3. Despacho de correo electrónico, si aplica
    if (payload.email) {
      const user = await this.userModel
        .findById(usuarioId)
        .select('email')
        .exec();
      if (user?.email) {
        await this.enviarEmail(
          user.email,
          payload.email.subject,
          payload.email.html,
        );
      }
    }

    return notification;
  }

  async createSystemNotification(usuarioId: string, payload: NotifyPayload) {
    return this.notify(usuarioId, payload);
  }

  // ======================================================
  // [ CORE ] - NOTIFICACIONES MASIVAS A GRUPOS
  // ======================================================
  private async notifyMany(usuarioIds: string[], payload: NotifyPayload) {
    await Promise.all(usuarioIds.map((id) => this.notify(id, payload)));
  }

  // ======================================================
  // [ HELPERS ] - UTILIDADES DE SEGURIDAD Y COMUNICACIÓN
  // ======================================================
  private async getAdminIds(excluir?: string): Promise<string[]> {
    const admins = await this.userModel
      .find({ estado: true })
      .populate({ path: 'rol', match: { nombre: 'Administrador' } })
      .select('_id')
      .exec();

    return admins
      .filter((u: any) => u.rol !== null && u._id.toString() !== excluir)
      .map((u: any) => u._id.toString());
  }

  private async getUserIdsByRole(roleId: string): Promise<string[]> {
    const users = await this.userModel
      .find({ estado: true })
      .select('_id rol nombre email estado')
      .exec();

    const relatedUsers = users.filter(
      (user: any) => user.rol?.toString() === roleId,
    );

    return relatedUsers.map((user: any) => user._id.toString());
  }

  private async enviarEmail(to: string, subject: string, html: string) {
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch {}
  }

  async findMyNotifications(
    usuarioId: string,
    page = 1,
    limit = 10,
    search = '',
  ) {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {
      usuario: new Types.ObjectId(usuarioId),
      estado: true,
    };

    if (search) {
      query.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { mensaje: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async countUnread(usuarioId: string) {
    const total = await this.notificationModel.countDocuments({
      usuario: new Types.ObjectId(usuarioId),
      leida: false,
      estado: true,
    });

    return { total };
  }

  async markAsRead(id: string) {
    await this.notificationModel.findByIdAndUpdate(id, { leida: true });
    return {
      message: 'La notificación ha sido marcada como leída satisfactoriamente',
    };
  }

  async markAllAsRead(usuarioId: string) {
    await this.notificationModel.updateMany(
      { usuario: new Types.ObjectId(usuarioId), leida: false },
      { leida: true },
    );

    return {
      message: 'Todas las notificaciones han sido actualizadas a estado leído',
    };
  }

  async removeNotification(id: string) {
    await this.notificationModel.findByIdAndUpdate(id, { estado: false });
    return { message: 'La notificación ha sido eliminada del sistema' };
  }

  // ======================================================
  // [ EVENTS ] - NOTIFICACIONES DE INICIO DE SESIÓN
  // ======================================================
  async notificarLogin(
    usuarioId: string,
    nombre: string,
    email: string,
    dispositivo: string,
    ip: string,
    ubicacion: string,
  ) {
    const fecha = new Date().toLocaleString('es-PE');
    const data = { nombre, dispositivo, ip, ubicacion, fecha };

    // ALERTA AL USUARIO AFECTADO
    await this.notify(usuarioId, {
      tipo: 'login',
      titulo: 'Nuevo inicio de sesión detectado',
      mensaje: `Acceso exitoso desde el dispositivo: ${dispositivo}`,
      data,
      email: {
        subject: 'Alerta de seguridad: nuevo inicio de sesión',
        html: loginTemplate({ nombre, dispositivo, ip, ubicacion, fecha }),
      },
    });

    this.gateway.emitToUser(usuarioId, 'update_sessions', { refresh: true });
  }

  // ======================================================
  // [ EVENTS ] - NOTIFICACIONES DE GESTIÓN DE USUARIOS
  // ======================================================
  async notificarNuevoUsuario(
    usuarioId: string,
    nombre: string,
    rol: string,
    creadoPor: string,
  ) {
    const fecha = new Date().toLocaleString('es-PE');
    const data = { nombre, rol, creadoPor, fecha };

    // BIENVENIDA AL USUARIO
    await this.notify(usuarioId, {
      tipo: 'nuevo_usuario',
      titulo: 'Bienvenido a HAYCE SYSTEMS',
      mensaje: `Su cuenta ha sido habilitada satisfactoriamente con el rol: ${rol}`,
      data,
      email: {
        subject: 'Bienvenido: cuenta de acceso creada',
        html: newUserTemplate({ nombre, rol, creadoPor, fecha }),
      },
    });

    // Aviso de auditoría para administradores
    const adminIds = await this.getAdminIds(usuarioId);
    await this.notifyMany(adminIds, {
      tipo: 'nuevo_usuario',
      titulo: 'Registro de usuario: alta en el sistema',
      mensaje: `Se ha registrado a ${nombre} con el perfil de ${rol}`,
      data,
      email: {
        subject: `Auditoría: alta de usuario ${nombre}`,
        html: newUserTemplate({ nombre, rol, creadoPor, fecha }),
      },
    });
  }

  // ======================================================
  // [ EVENTS ] - NOTIFICACIONES DE CONTROL DE ACCESO
  // ======================================================
  async notificarNuevoPermiso(nombrePermiso: string, creadoPor: string) {
    const fecha = new Date().toLocaleString('es-PE');
    const data = { nombrePermiso, creadoPor, fecha };
    const adminIds = await this.getAdminIds();

    await this.notifyMany(adminIds, {
      tipo: 'nuevo_permiso',
      titulo: 'Seguridad: nuevo permiso registrado',
      mensaje: `Se ha definido el permiso de seguridad "${nombrePermiso}"`,
      data,
    });
  }

  async notificarNuevoRol(nombreRol: string, creadoPor: string) {
    const fecha = new Date().toLocaleString('es-PE');
    const data = { nombreRol, creadoPor, fecha };
    const adminIds = await this.getAdminIds();

    await this.notifyMany(adminIds, {
      tipo: 'nuevo_rol',
      titulo: 'Seguridad: nuevo rol de acceso',
      mensaje: `Se ha configurado el rol de usuario "${nombreRol}"`,
      data,
    });
  }

  async notificarCambioRol(
    usuarioId: string,
    nombre: string,
    rolAnterior: string,
    rolNuevo: string,
    actualizadoPor: string,
  ) {
    const fecha = new Date().toLocaleString('es-PE');
    const data = { nombre, rolAnterior, rolNuevo, actualizadoPor, fecha };

    await this.notify(usuarioId, {
      tipo: 'cambio_rol',
      titulo: 'Rol actualizado',
      mensaje: `Tu cuenta ahora tiene el cargo de ${rolNuevo}`,
      data,
    });
  }

  async emitirActualizacionPermisosRol(
    roleId: string,
    roleName: string,
    permisosAgregados: string[],
    permisosEliminados: string[],
    actualizadoPor: string,
  ) {
    const usuarioIds = await this.getUserIdsByRole(roleId);
    if (usuarioIds.length === 0) {
      return;
    }

    const fecha = new Date().toLocaleString('es-PE');
    const data = {
      roleId,
      roleName,
      permisosAgregados,
      permisosEliminados,
      actualizadoPor,
      fecha,
    };

    usuarioIds.forEach((usuarioId) => {
      this.gateway.emitToUser(usuarioId, 'role_permissions_updated', data);
    });
  }

  // ======================================================
  // [ EVENTS ] - NOTIFICACIONES DE REVOCACIÓN DE ACCESO
  // ======================================================
  async notificarSesionRevocada(
    usuarioId: string,
    nombre: string,
    dispositivo: string,
    sessionId: string,
  ) {
    const fecha = new Date().toLocaleString('es-PE');
    const data = { nombre, dispositivo, fecha };

    // 1. TERMINACI�N FORZOSA DE SOCKET DE SESI�N
    this.gateway.emitToSession(sessionId, 'logout_session', {
      message:
        'Su sesión ha sido revocada por el administrador o por el sistema de seguridad',
    });

    // 2. ALERTA AL USUARIO AFECTADO
    await this.notify(usuarioId, {
      tipo: 'sesion_revocada',
      titulo: 'Seguridad: sesión cerrada remotamente',
      mensaje: `Su acceso desde el dispositivo ${dispositivo} ha sido revocado`,
      data,
      email: {
        subject: 'Alerta: revocación de acceso detectada',
        html: revokeSessionTemplate({ nombre, dispositivo, fecha }),
      },
    });

    this.gateway.emitToUser(usuarioId, 'update_sessions', { refresh: true });
  }

  emitirCierreGlobalSesiones(usuarioId: string, sessionIds: string[]) {
    sessionIds.forEach((sessionId) => {
      this.gateway.emitToSession(sessionId, 'logout_session', {
        message:
          'Todas tus sesiones activas fueron cerradas por una acción de seguridad',
      });
    });

    this.gateway.emitToUser(usuarioId, 'update_sessions', { refresh: true });
  }

  // ======================================================
  // [ EVENTS ] - NOTIFICACIONES DE CAMBIO DE CREDENCIALES
  // ======================================================
  async notificarCambioPassword(usuarioId: string, nombre: string) {
    const fecha = new Date().toLocaleString('es-PE');
    const data = { nombre, fecha };

    // ALERTA DE SEGURIDAD AL USUARIO
    await this.notify(usuarioId, {
      tipo: 'cambio_password',
      titulo: 'Seguridad: contraseña actualizada',
      mensaje: 'Sus credenciales de acceso han sido modificadas exitosamente',
      data,
      email: {
        subject: 'Confirmaci?n: actualización de contraseña',
        html: changePasswordTemplate({ nombre, fecha }),
      },
    });
  }

  // ======================================================
  // [ SECURITY ] - DESPACHO DE CÓDIGOS DE VERIFICACIÓN
  // ======================================================
  async enviarCodigoVerificacion(
    usuarioId: string,
    nombre: string,
    codigo: string,
  ) {
    await this.notify(usuarioId, {
      tipo: 'verificacion',
      titulo: 'Seguridad: código de verificación',
      mensaje: `Su c�digo de validaci�n de identidad es: ${codigo}`,
      data: { codigo },
      email: {
        subject: 'Código de seguridad: verificación de identidad',
        html: verifyCodeTemplate({ nombre, codigo }),
      },
    });
  }
}
