import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { User } from 'src/users/entities/user.entity';

export type AccessActor = {
  sub: string;
  nombre?: string;
  organizationId?: string | null;
  ownerAdminId?: string | null;
  esSuperAdmin?: boolean;
  permisos?: string[];
};

@Injectable()
export class AccessControlService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
  ) {}

  async getActor(userId: string): Promise<User> {
    const actor = await this.userModel
      .findById(userId)
      .populate({
        path: 'rol',
        populate: {
          path: 'permisos',
          match: { estado: true },
        },
      })
      .exec();

    if (!actor || !actor.estado) {
      throw new NotFoundException('Usuario autenticado no encontrado');
    }

    return actor;
  }

  isSuperAdmin(actor: Pick<User, 'esSuperAdmin'> | AccessActor): boolean {
    return !!actor.esSuperAdmin;
  }

  assertSuperAdmin(actor: Pick<User, 'esSuperAdmin'> | AccessActor): void {
    if (!this.isSuperAdmin(actor)) {
      throw new ForbiddenException(
        'Solo el superadmin puede realizar esta acción',
      );
    }
  }

  canManageWholeOrganization(actor: User | AccessActor): boolean {
    const actorId =
      'sub' in actor ? actor.sub : actor._id?.toString?.() ?? '';
    const ownerAdminId =
      'ownerAdminId' in actor
        ? actor.ownerAdminId?.toString?.() ?? ''
        : (actor as User).ownerAdmin?.toString?.() ?? '';

    return this.isSuperAdmin(actor) || !!actorId && actorId === ownerAdminId;
  }

  ensureSameOrganization(
    actor: User | AccessActor,
    targetOrganization?: Types.ObjectId | string | null,
  ): void {
    if (this.isSuperAdmin(actor)) {
      return;
    }

    const actorOrganizationId =
      'organizationId' in actor
        ? actor.organizationId
        : (actor as User).organization?.toString?.();
    const targetOrganizationId = targetOrganization?.toString?.() ?? null;

    if (!actorOrganizationId || actorOrganizationId !== targetOrganizationId) {
      throw new ForbiddenException(
        'No puedes operar fuera de tu organización',
      );
    }
  }

  canManageDescendant(actor: User | AccessActor, target: User | Role): boolean {
    if (this.isSuperAdmin(actor)) {
      return true;
    }

    const actorId =
      'sub' in actor ? actor.sub : actor._id?.toString?.() ?? '';
    const actorOwnerAdminId =
      'ownerAdminId' in actor
        ? actor.ownerAdminId
        : (actor as User).ownerAdmin?.toString?.() ?? null;

    const targetOwnerAdminId = target.ownerAdmin?.toString?.() ?? null;
    if (actorOwnerAdminId && targetOwnerAdminId !== actorOwnerAdminId) {
      return false;
    }

    if (this.canManageWholeOrganization(actor)) {
      return true;
    }

    const ancestryPath = target.ancestryPath?.map((id) => id.toString()) ?? [];
    const createdById = target.createdBy?.toString?.() ?? null;

    return createdById === actorId || ancestryPath.includes(actorId);
  }

  extractPermissionNames(actor: User): string[] {
    const permissions = ((actor.rol as any)?.permisos ?? []) as Array<{
      nombre?: string;
    }>;

    return permissions
      .map((permission) => permission.nombre ?? '')
      .filter(Boolean);
  }

  async validateRoleAssignment(actor: User, roleId: string): Promise<Role> {
    const role = await this.roleModel
      .findById(roleId)
      .populate('permisos')
      .exec();

    if (!role || !role.estado) {
      throw new NotFoundException('Rol no encontrado');
    }

    this.ensureSameOrganization(actor, role.organization);

    if (!this.canManageDescendant(actor, role)) {
      throw new ForbiddenException(
        'No puedes asignar un rol fuera de tu alcance',
      );
    }

    if (this.isSuperAdmin(actor)) {
      return role;
    }

    const actorPermissionNames = new Set(this.extractPermissionNames(actor));
    const rolePermissionNames = ((role.permisos as any[]) ?? [])
      .map((permission) => permission.nombre ?? '')
      .filter(Boolean);

    const hasAllPermissions = rolePermissionNames.every((permission) =>
      actorPermissionNames.has(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'No puedes asignar un rol con permisos superiores a los tuyos',
      );
    }

    return role;
  }

  async validatePermissionSubset(
    actor: User,
    permissionIds: string[],
  ): Promise<void> {
    if (this.isSuperAdmin(actor)) {
      return;
    }

    const actorPermissions = new Set(this.extractPermissionNames(actor));
    const permissions = await this.permissionModel
      .find({ _id: { $in: permissionIds }, estado: true })
      .select('nombre')
      .exec();

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('Uno o más permisos no existen o están inactivos');
    }

    const invalidPermission = permissions.find(
      (permission) => !actorPermissions.has(permission.nombre),
    );

    if (invalidPermission) {
      throw new ForbiddenException(
        `No puedes asignar el permiso "${invalidPermission.nombre}" porque no forma parte de tus accesos`,
      );
    }
  }

  buildAncestryPath(actor: User): Types.ObjectId[] {
    return [
      ...(actor.ancestryPath ?? []),
      new Types.ObjectId(actor._id),
    ];
  }
}
