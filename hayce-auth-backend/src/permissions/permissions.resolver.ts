import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
import { RequirePermission } from 'src/decorators/require-permission.decorator';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';
import { PermissionsService } from './permissions.service';

@Resolver(() => Permission)
export class PermissionsResolver {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Mutation(() => Permission)
  @RequirePermission('crear_permiso')
  createPermission(
    @Args('input') input: CreatePermissionDto,
    @CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean },
  ) {
    return this.permissionsService.create(input, user);
  }

  @Query(() => [Permission])
  @RequirePermission('listar_permisos')
  permissions() {
    return this.permissionsService.findAll();
  }

  @Query(() => [Permission])
  @RequirePermission('listar_permisos')
  inactivePermissions() {
    return this.permissionsService.findAllInactive();
  }

  @Query(() => Permission)
  @RequirePermission('listar_permisos')
  permission(@Args('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Query(() => Permission)
  @RequirePermission('listar_permisos')
  inactivePermission(@Args('id') id: string) {
    return this.permissionsService.findOneInactive(id);
  }

  @Mutation(() => Permission)
  @RequirePermission('actualizar_permisos')
  updatePermission(
    @Args('id') id: string,
    @Args('input') input: UpdatePermissionDto,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.permissionsService.update(id, input, user);
  }

  @Mutation(() => Permission)
  @RequirePermission('eliminar_permiso')
  removePermission(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.permissionsService.removeWithActor(id, user);
  }

  @Mutation(() => Permission)
  @RequirePermission('eliminar_permiso')
  restorePermission(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.permissionsService.restoreWithActor(id, user);
  }
}
