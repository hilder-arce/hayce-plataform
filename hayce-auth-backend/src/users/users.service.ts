import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';

import { User } from './entities/user.entity';
import { RolesService } from 'src/roles/roles.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly rolesService: RolesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createUserDto: CreateUserDto, creadoPor: string): Promise<User> {
    if (createUserDto.email) {
      const existingUser = await this.userModel
        .findOne({ email: createUserDto.email })
        .exec();
      if (existingUser) {
        throw new ConflictException(
          `El correo "${createUserDto.email}" ya se encuentra registrado`,
        );
      }
    }

    const rolEncontrado = await this.rolesService.findOne(createUserDto.rol);
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    try {
      const newUser = new this.userModel({
        ...createUserDto,
        password: passwordHash,
      });

      const savedUser = await newUser.save();

      await this.notificationsService.notificarNuevoUsuario(
        savedUser._id.toString(),
        createUserDto.nombre,
        (rolEncontrado as any)?.nombre ?? 'Sin rol',
        creadoPor,
      );

      return savedUser;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'Conflicto de duplicidad: El correo ya existe en el sistema',
        );
      }
      throw error;
    }
  }

  async findAll(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ items: User[]; total: number }> {
    const query: any = { estado: true };

    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-__v -password')
        .populate({
          path: 'rol',
          select: 'nombre _id',
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ nombre: 1 })
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return { items, total };
  }

  async findAllInactive(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ items: User[]; total: number }> {
    const query: any = { estado: false };

    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-__v -password')
        .populate({
          path: 'rol',
          select: 'nombre _id',
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ nombre: 1 })
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return { items, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findOne({ _id: id, estado: true })
      .select('-__v -password')
      .populate({
        path: 'rol',
        select: 'nombre descripcion estado permisos _id',
        populate: {
          path: 'permisos',
          select: 'nombre descripcion estado modulo _id',
          populate: { path: 'modulo', select: 'nombre descripcion estado _id' },
        },
      })
      .exec();

    if (!user)
      throw new NotFoundException(
        `Usuario activo con ID "${id}" no encontrado`,
      );
    return user;
  }

  async findOneInactive(id: string): Promise<User> {
    const user = await this.userModel
      .findOne({ _id: id, estado: false })
      .select('-__v -password')
      .populate({
        path: 'rol',
        select: 'nombre descripcion estado permisos _id',
        populate: {
          path: 'permisos',
          select: 'nombre descripcion estado modulo _id',
          populate: { path: 'modulo', select: 'nombre descripcion estado _id' },
        },
      })
      .exec();

    if (!user)
      throw new NotFoundException(
        `Usuario inactivo con ID "${id}" no encontrado`,
      );
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actualizadoPor?: string,
  ): Promise<User> {
    const currentUser = await this.findOne(id);

    const { rol, ...otrosCampos } = updateUserDto;
    const updateData: any = { ...otrosCampos };
    let nuevoRolNombre: string | null = null;
    const rolAnteriorNombre = (currentUser.rol as any)?.nombre ?? 'Sin rol';

    if (rol) {
      const nuevoRol = await this.rolesService.findOne(rol);
      updateData.rol = rol;
      nuevoRolNombre = (nuevoRol as any)?.nombre ?? 'Sin rol';
    }

    const updatedUser = (await this.userModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .select('-__v -password')
      .exec()) as User;

    if (nuevoRolNombre && nuevoRolNombre !== rolAnteriorNombre) {
      await this.notificationsService.notificarCambioRol(
        id,
        currentUser.nombre,
        rolAnteriorNombre,
        nuevoRolNombre,
        actualizadoPor ?? 'Administrador',
      );
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    await this.findOne(id);
    return (await this.userModel
      .findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .select('-__v')
      .exec()) as User;
  }

  async reactivate(id: string): Promise<User> {
    await this.findOneInactive(id);
    return (await this.userModel
      .findByIdAndUpdate(id, { estado: true }, { returnDocument: 'after' })
      .select('-__v')
      .exec()) as User;
  }

  async changePassword(
    id: string,
    dto: ChangePasswordDto,
  ): Promise<{ mensaje: string }> {
    const user = await this.userModel
      .findOne({ _id: id, estado: true })
      .select('+password')
      .exec();

    if (!user)
      throw new NotFoundException(
        'Usuario no encontrado para actualización de seguridad',
      );

    const isMatch = await bcrypt.compare(dto.passwordActual, user.password);
    if (!isMatch)
      throw new BadRequestException(
        'La validación de identidad falló: Contraseña actual incorrecta',
      );

    user.password = await bcrypt.hash(dto.passwordNuevo, 10);
    await user.save();

    await this.notificationsService.notificarCambioPassword(id, user.nombre);

    return { mensaje: 'La contraseña ha sido actualizada exitosamente' };
  }

  async adminChangePassword(
    id: string,
    dto: AdminChangePasswordDto,
  ): Promise<{ mensaje: string }> {
    const user = await this.findOne(id);

    const passwordHash = await bcrypt.hash(dto.passwordNuevo, 10);
    await this.userModel
      .findByIdAndUpdate(id, { password: passwordHash })
      .exec();

    await this.notificationsService.notificarCambioPassword(id, user.nombre);

    return {
      mensaje: 'Reseteo de contraseña administrativa completado exitosamente',
    };
  }
  async updateOwnProfile(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const { rol, ...safeUpdateData } = updateUserDto;
    return await this.update(id, safeUpdateData);
  }
}
