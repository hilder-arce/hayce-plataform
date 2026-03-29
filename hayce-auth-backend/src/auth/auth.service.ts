import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';

import { AccessActor, AccessControlService } from './authorization/access-control.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Session } from './entities/session.entity';
import { User } from 'src/users/entities/user.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(PasswordReset.name)
    private readonly passwordResetModel: Model<PasswordReset>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async login(loginDto: LoginDto, req: Request, res: Response) {
    const user = await this.findOneByEmail(loginDto.email.trim().toLowerCase());
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Credenciales de acceso inválidas: Contraseña incorrecta',
      );
    }

    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const device = loginDto.dispositivo ?? req.headers['user-agent'] ?? 'Desconocido';
    const location = loginDto.ubicacion ?? 'Desconocida';

    const session = await this.sessionModel.create({
      usuario: user._id,
      refreshToken: 'pending',
      dispositivo: device,
      ip: req.ip,
      expiraEn: expirationDate,
    });

    const accessToken = this.generarAccessToken(user, session._id.toString());
    const refreshToken = this.generarRefreshToken(session._id.toString());

    session.refreshToken = await bcrypt.hash(refreshToken, 10);
    await session.save();

    this.setCookie(req, res, accessToken, refreshToken);

    await this.notificationsService.notificarLogin(
      user._id.toString(),
      user.nombre,
      user.email,
      device,
      req.ip ?? 'Desconocida',
      location,
    );

    return {
      status: 'success',
      message: 'Autenticación completada con éxito',
      data: {
        usuario: this.formatearUsuario(user),
      },
    };
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      try {
        const payload = this.jwtService.verify(refreshToken, {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        });
        await this.sessionModel.findByIdAndUpdate(payload.sub, { estado: false });
      } catch {
        // El token puede estar expirado y no afecta el cierre local.
      }

      this.clearCookies(req, res);
      return { message: 'Sesión finalizada correctamente' };
    }

    return { message: 'No existe una sesión activa para cerrar' };
  }

  async refreshFromGuard(
    refreshToken: string,
    req: Request,
    res: Response,
  ): Promise<any> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const sessionId = payload.sub;
    const lockTtlMs = 5000;

    const lockedSession = await this.sessionModel.findOne({
      _id: sessionId,
      estado: true,
      bloqueado: true,
      bloqueadoEn: { $gt: new Date(Date.now() - lockTtlMs) },
    });

    if (lockedSession) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedSession = await this.sessionModel.findById(sessionId);
      if (!updatedSession?.estado) {
        throw new UnauthorizedException('Sesión invalidada durante el proceso');
      }
      return payload;
    }

    const session = await this.sessionModel.findOneAndUpdate(
      { _id: sessionId, estado: true, bloqueado: false },
      { bloqueado: true, bloqueadoEn: new Date() },
      { returnDocument: 'after' },
    );

    if (!session) {
      throw new UnauthorizedException(
        'Sesión no disponible o bloqueada por seguridad',
      );
    }

    try {
      const isTokenValid = await bcrypt.compare(refreshToken, session.refreshToken);
      if (!isTokenValid) {
        await this.sessionModel.findByIdAndUpdate(sessionId, { estado: false });
        this.clearCookies(req, res);
        throw new UnauthorizedException(
          'Fallo crítico de seguridad: Refresh token comprometido',
        );
      }

      if (session.expiraEn < new Date()) {
        await this.sessionModel.findByIdAndUpdate(sessionId, { estado: false });
        this.clearCookies(req, res);
        throw new UnauthorizedException(
          'La sesión ha expirado por tiempo de inactividad',
        );
      }

      const user = await this.getUserWithPermisos(session.usuario.toString());
      if (!user) {
        throw new UnauthorizedException(
          'Acceso denegado: Usuario inactivo o inexistente',
        );
      }

      const accessToken = this.generarAccessToken(user, sessionId);
      const nuevoRefreshToken = this.generarRefreshToken(sessionId);
      const nuevoHash = await bcrypt.hash(nuevoRefreshToken, 10);

      await this.sessionModel.findByIdAndUpdate(sessionId, {
        refreshToken: nuevoHash,
        expiraEn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        bloqueado: false,
        bloqueadoEn: null,
      });

      this.setCookie(req, res, accessToken, nuevoRefreshToken);
      return this.jwtService.decode(accessToken);
    } catch (error) {
      await this.sessionModel.findByIdAndUpdate(sessionId, {
        bloqueado: false,
        bloqueadoEn: null,
      });
      throw error;
    }
  }

  async logoutAll(usuarioId: string, req: Request, res: Response) {
    const activeSessions = await this.sessionModel
      .find({
        usuario: new Types.ObjectId(usuarioId),
        estado: true,
      })
      .select('_id')
      .lean();

    const sessionIds = activeSessions.map((session) => session._id.toString());

    await this.sessionModel.updateMany(
      { usuario: new Types.ObjectId(usuarioId), estado: true },
      { estado: false },
    );

    this.notificationsService.emitirCierreGlobalSesiones(usuarioId, sessionIds);

    this.clearCookies(req, res);
    return {
      message: 'Todas las sesiones activas han sido revocadas exitosamente',
    };
  }

  async me(usuarioId: string) {
    const user = await this.getUserWithPermisos(usuarioId);
    if (!user) throw new NotFoundException('Perfil de usuario no localizado');

    return {
      status: 'success',
      data: {
        usuario: this.formatearUsuario(user),
      },
    };
  }

  async mySessions(usuarioId: string): Promise<Session[]> {
    return this.sessionModel
      .find({
        usuario: new Types.ObjectId(usuarioId),
        estado: true,
      })
      .select('-refreshToken -__v')
      .sort({ createdAt: -1 })
      .exec();
  }

  async allSessions(actorContext: AccessActor): Promise<Session[]> {
    const actor = await this.getUserWithPermisos(actorContext.sub);
    const userIds = await this.getVisibleUserIds(actor);

    return this.sessionModel
      .find({
        estado: true,
        usuario: { $in: userIds },
      })
      .select('-refreshToken -__v')
      .populate({
        path: 'usuario',
        select: 'nombre email rol organization ownerAdmin esSuperAdmin -password',
        populate: [
          { path: 'rol', select: 'nombre -_id' },
          { path: 'organization', select: 'nombre slug -_id' },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async revokeSession(
    sessionId: string,
    actorContext: AccessActor,
    req: Request,
    res: Response,
  ): Promise<{ message: string }> {
    const actor = await this.getUserWithPermisos(actorContext.sub);
    const session = await this.sessionModel.findById(sessionId);
    if (!session || !session.estado) {
      throw new NotFoundException(
        'La sesión solicitada no existe o ya está inactiva',
      );
    }

    if (session.usuario.toString() !== actor._id.toString()) {
      const targetUser = await this.getUserWithPermisos(session.usuario.toString());
      if (!actor.esSuperAdmin) {
        this.accessControlService.ensureSameOrganization(actor, targetUser.organization);
        if (!this.accessControlService.canManageDescendant(actor, targetUser)) {
          throw new ForbiddenException(
            'Acceso denegado: No posees privilegios para revocar esta sesión',
          );
        }
      }
    }

    await this.sessionModel.findByIdAndUpdate(sessionId, { estado: false });

    const currentRefreshToken = req.cookies?.refresh_token;
    if (currentRefreshToken) {
      try {
        const payload = this.jwtService.verify(currentRefreshToken, {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        });
        if (payload.sub === sessionId) this.clearCookies(req, res);
      } catch {
        // La cookie actual puede estar caducada; no bloquea la revocación.
      }
    }

    const user = await this.userModel.findById(session.usuario).select('email nombre');
    if (user) {
      await this.notificationsService.notificarSesionRevocada(
        session.usuario.toString(),
        user.nombre,
        session.dispositivo ?? 'Desconocido',
        sessionId,
      );
    }

    return { message: 'La sesión ha sido revocada y notificada correctamente' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.trim().toLowerCase(), estado: true })
      .exec();

    if (!user) {
      return {
        message:
          'Si el correo existe, recibirá un código de verificación en breve',
      };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 5 * 60 * 1000);

    await this.passwordResetModel.create({
      usuario: user._id,
      codigo: code,
      expiraEn: expiration,
    });

    await this.notificationsService.enviarCodigoVerificacion(
      user._id.toString(),
      user.nombre,
      code,
    );

    return { message: 'Código de verificación enviado satisfactoriamente' };
  }

  async verifyCode(dto: VerifyCodeDto) {
    const user = await this.userModel.findOne({ email: dto.email.trim().toLowerCase() });
    if (!user) {
      throw new UnauthorizedException(
        'Error de validación: Datos de recuperación incorrectos',
      );
    }

    const reset = await this.passwordResetModel.findOne({
      usuario: user._id,
      codigo: dto.codigo,
      usado: false,
    });

    if (!reset) {
      throw new UnauthorizedException(
        'El código ingresado es inválido o ya fue utilizado',
      );
    }
    if (reset.expiraEn < new Date()) {
      throw new UnauthorizedException('El código de verificación ha expirado');
    }

    return { message: 'Verificación exitosa: Código validado correctamente' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.trim().toLowerCase(), estado: true })
      .exec();
    if (!user) {
      throw new UnauthorizedException(
        'Operación no permitida: Usuario inválido',
      );
    }

    const reset = await this.passwordResetModel.findOne({
      usuario: user._id,
      codigo: dto.codigo,
      usado: false,
    });

    if (!reset || reset.expiraEn < new Date()) {
      throw new UnauthorizedException(
        'Error de seguridad: El código es inválido o ha expirado',
      );
    }

    user.password = await bcrypt.hash(dto.password, 10);
    await user.save();

    reset.usado = true;
    await reset.save();

    await this.sessionModel.updateMany(
      { usuario: user._id, estado: true },
      { estado: false },
    );

    await this.notificationsService.notificarCambioPassword(
      user._id.toString(),
      user.nombre,
    );

    return {
      message:
        'La contraseña ha sido restablecida y las sesiones han sido cerradas por seguridad',
    };
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.sessionModel.findById(sessionId);
    return !!(session && session.estado);
  }

  async buildRequestUserContext(usuarioId: string, sessionId: string) {
    const user = await this.getUserWithPermisos(usuarioId);
    if (!user) {
      throw new UnauthorizedException(
        'Acceso denegado: Usuario inactivo o inexistente',
      );
    }

    const permisosRol =
      (user.rol as any)?.permisos?.map((p: any) => p.nombre) ?? [];
    const userFormateado = this.formatearUsuario(user);

    return {
      sub: user._id.toString(),
      sessionId,
      nombre: user.nombre,
      email: user.email,
      rol: (user.rol as any)?.nombre,
      permisos: permisosRol,
      permisosFront: userFormateado.permisos,
      organizationId: user.organization?._id?.toString?.() ?? user.organization?.toString?.() ?? null,
      ownerAdminId: user.ownerAdmin?._id?.toString?.() ?? user.ownerAdmin?.toString?.() ?? null,
      esSuperAdmin: !!user.esSuperAdmin,
    };
  }

  private async getUserWithPermisos(userId: string): Promise<User> {
    return (await this.userModel
      .findOne({ _id: userId, estado: true })
      .select('+password')
      .populate([
        {
          path: 'rol',
          populate: {
            path: 'permisos',
            match: { estado: true },
            populate: { path: 'modulo', select: 'nombre' },
          },
        },
        {
          path: 'organization',
          select: 'nombre slug estado _id',
        },
        {
          path: 'ownerAdmin',
          select: 'nombre email _id',
        },
      ])
      .exec()) as User;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .populate([
        {
          path: 'rol',
          select: 'nombre',
          populate: {
            path: 'permisos',
            select: 'nombre',
            populate: { path: 'modulo', select: 'nombre' },
          },
        },
        {
          path: 'organization',
          select: 'nombre slug estado _id',
        },
        {
          path: 'ownerAdmin',
          select: 'nombre email _id',
        },
      ])
      .exec();

    if (!user) {
      throw new UnauthorizedException(
        'Acceso denegado: El correo electrónico no está registrado',
      );
    }
    if (!user.estado) {
      throw new UnauthorizedException(
        'Acceso denegado: La cuenta de usuario se encuentra inactiva',
      );
    }

    return user;
  }

  private generarAccessToken(user: User, sessionId: string): string {
    const permisosRol =
      (user.rol as any)?.permisos?.map((p: any) => p.nombre) ?? [];
    const userFormateado = this.formatearUsuario(user);

    return this.jwtService.sign(
      {
        sub: user._id,
        sessionId,
        nombre: user.nombre,
        email: user.email,
        rol: (user.rol as any)?.nombre,
        permisos: permisosRol,
        permisosFront: userFormateado.permisos,
        organizationId:
          user.organization?._id?.toString?.() ??
          user.organization?.toString?.() ??
          null,
        ownerAdminId:
          user.ownerAdmin?._id?.toString?.() ??
          user.ownerAdmin?.toString?.() ??
          null,
        esSuperAdmin: !!user.esSuperAdmin,
      },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  private generarRefreshToken(sessionId: string): string {
    return this.jwtService.sign(
      { sub: sessionId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  private setCookie(
    req: Request,
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isCrossSiteRequest = this.isCrossSiteRequest(req);
    const cookieOptions = {
      httpOnly: true,
      secure: isCrossSiteRequest,
      sameSite: (isCrossSiteRequest ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    };

    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearCookies(req: Request, res: Response) {
    const isCrossSiteRequest = this.isCrossSiteRequest(req);
    const clearOptions = {
      httpOnly: true,
      secure: isCrossSiteRequest,
      sameSite: (isCrossSiteRequest ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    };

    res.clearCookie('access_token', clearOptions);
    res.clearCookie('refresh_token', clearOptions);
  }

  private isCrossSiteRequest(req: Request): boolean {
    const origin = req.headers.origin ?? req.headers.referer ?? '';
    const normalizedOrigin = String(origin).toLowerCase();

    return !(
      normalizedOrigin.includes('localhost') ||
      normalizedOrigin.includes('127.0.0.1')
    );
  }

  private formatearUsuario(user: any) {
    const agruparPermisos = (permisos: any[]): Record<string, string[]> =>
      permisos.reduce((acc: any, p: any) => {
        const modulo = p.modulo?.nombre ?? 'Sin módulo';
        if (!acc[modulo]) acc[modulo] = [];
        acc[modulo].push(p.nombre);
        return acc;
      }, {});

    return {
      id: user._id.toString(),
      nombre: user.nombre,
      email: user.email,
      rol: user.rol?.nombre,
      permisos: agruparPermisos(user.rol?.permisos ?? []),
      estado: user.estado,
      createdAt: user.createdAt,
      organization: user.organization ?? null,
      ownerAdmin: user.ownerAdmin ?? null,
      esSuperAdmin: !!user.esSuperAdmin,
    };
  }

  private async getVisibleUserIds(actor: User): Promise<Types.ObjectId[]> {
    if (actor.esSuperAdmin) {
      const users = await this.userModel.find({ estado: true }).select('_id').exec();
      return users.map((user) => new Types.ObjectId(user._id));
    }

    const query: Record<string, any> = {
      estado: true,
      organization: actor.organization,
    };

    if (!this.accessControlService.canManageWholeOrganization(actor)) {
      query.$or = [
        { _id: actor._id },
        { createdBy: actor._id },
        { ancestryPath: actor._id },
      ];
    }

    const users = await this.userModel.find(query).select('_id').exec();
    return users.map((user) => new Types.ObjectId(user._id));
  }
}
