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
    @CurrentUser() user: { nombre?: string },
  ) {
    return this.rolesService.create(input, user?.nombre ?? 'Sistema');
  }

  @Query(() => [Role])
  @RequirePermission('listar_roles')
  roles() {
    return this.rolesService.findAll();
  }

  @Query(() => [Role])
  @RequirePermission('listar_roles')
  inactiveRoles() {
    return this.rolesService.findAllInactive();
  }

  @Query(() => Role)
  @RequirePermission('listar_roles')
  role(@Args('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Query(() => Role)
  @RequirePermission('listar_roles')
  inactiveRole(@Args('id') id: string) {
    return this.rolesService.findOneInactive(id);
  }

  @Mutation(() => Role)
  @RequirePermission('actualizar_rol')
  updateRole(
    @Args('id') id: string,
    @Args('input') input: UpdateRoleDto,
    @CurrentUser() user: { nombre?: string },
  ) {
    return this.rolesService.update(id, input, user?.nombre ?? 'Sistema');
  }

  @Mutation(() => Role)
  @RequirePermission('eliminar_rol')
  removeRole(@Args('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Mutation(() => Role)
  @RequirePermission('eliminar_rol')
  restoreRole(@Args('id') id: string) {
    return this.rolesService.restore(id);
  }
}
