import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
import { RequirePermission } from 'src/decorators/require-permission.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';

@Resolver(() => Role)
export class RolesResolver {
  constructor(private readonly rolesService: RolesService) {}

  @Mutation(() => Role)
  @RequirePermission('crear_rol')
  createRole(
    @Args('input') input: CreateRoleDto,
    @CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean },
  ) {
    return this.rolesService.create(input, user);
  }

  @Query(() => [Role])
  @RequirePermission('listar_roles')
  roles(@CurrentUser() user: { sub: string; esSuperAdmin?: boolean }) {
    return this.rolesService.findAll(user);
  }

  @Query(() => [Role])
  @RequirePermission('listar_roles')
  inactiveRoles(@CurrentUser() user: { sub: string; esSuperAdmin?: boolean }) {
    return this.rolesService.findAllInactive(user);
  }

  @Query(() => Role)
  @RequirePermission('listar_roles')
  role(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.rolesService.findOne(id, user);
  }

  @Query(() => Role)
  @RequirePermission('listar_roles')
  inactiveRole(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.rolesService.findOneInactive(id, user);
  }

  @Mutation(() => Role)
  @RequirePermission('actualizar_rol')
  updateRole(
    @Args('id') id: string,
    @Args('input') input: UpdateRoleDto,
    @CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean },
  ) {
    return this.rolesService.update(id, input, user);
  }

  @Mutation(() => Role)
  @RequirePermission('eliminar_rol')
  removeRole(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.rolesService.remove(id, user);
  }

  @Mutation(() => Role)
  @RequirePermission('eliminar_rol')
  restoreRole(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.rolesService.restore(id, user);
  }
}
