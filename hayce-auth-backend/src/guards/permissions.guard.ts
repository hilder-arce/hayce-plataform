import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // OBTENER LOS PERMISOS REQUERIDOS POR LA RUTA
    const permisosRequeridos = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // SI LA RUTA NO REQUIERE PERMISOS ESPECIFICOS, DEJAR PASAR
    if (!permisosRequeridos || permisosRequeridos.length === 0) return true;

    const req =
      context.getType<'graphql' | 'http'>() === 'graphql'
        ? GqlExecutionContext.create(context).getContext().req
        : context.switchToHttp().getRequest();
    const user = req['user'];

    if (!user) throw new ForbiddenException('No autenticado');
    if (user.esSuperAdmin) return true;

    const permisosUsuario: string[] = user.permisos || [];

    // VERIFICAR QUE EL USUARIO TENGA AL MENOS UNO DE LOS PERMISOS REQUERIDOS
    const tienePermiso = permisosRequeridos.some((p) =>
      permisosUsuario.includes(p),
    );

    if (!tienePermiso)
      throw new ForbiddenException(
        `No tienes permiso para realizar esta acción`,
      );

    return true;
  }
}
