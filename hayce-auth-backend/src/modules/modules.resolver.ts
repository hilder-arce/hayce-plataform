import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
import { RequirePermission } from 'src/decorators/require-permission.decorator';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { Module } from './entities/module.entity';
import { ModulesService } from './modules.service';

@Resolver(() => Module)
export class ModulesResolver {
  constructor(private readonly modulesService: ModulesService) {}

  @Mutation(() => Module)
  @RequirePermission('crear_modulo')
  createModule(
    @Args('input') input: CreateModuleDto,
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.modulesService.create(input, user);
  }

  @Query(() => [Module])
  @RequirePermission('listar_modulos')
  modules() {
    return this.modulesService.findAll();
  }

  @Query(() => [Module])
  @RequirePermission('listar_modulos')
  inactiveModules() {
    return this.modulesService.findAllInactive();
  }

  @Query(() => Module)
  @RequirePermission('listar_modulos')
  module(@Args('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Query(() => Module)
  @RequirePermission('listar_modulos')
  inactiveModule(@Args('id') id: string) {
    return this.modulesService.findOneInactive(id);
  }

  @Mutation(() => Module)
  @RequirePermission('actualizar_modulo')
  updateModule(
    @Args('id') id: string,
    @Args('input') input: UpdateModuleDto,
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.modulesService.update(id, input, user);
  }

  @Mutation(() => Module)
  @RequirePermission('eliminar_modulo')
  removeModule(
    @Args('id') id: string,
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.modulesService.remove(id, user);
  }

  @Mutation(() => Module)
  @RequirePermission('eliminar_modulo')
  restoreModule(
    @Args('id') id: string,
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.modulesService.restore(id, user);
  }
}
