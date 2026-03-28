import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
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
  createModule(@Args('input') input: CreateModuleDto) {
    return this.modulesService.create(input);
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
  updateModule(@Args('id') id: string, @Args('input') input: UpdateModuleDto) {
    return this.modulesService.update(id, input);
  }

  @Mutation(() => Module)
  @RequirePermission('eliminar_modulo')
  removeModule(@Args('id') id: string) {
    return this.modulesService.remove(id);
  }

  @Mutation(() => Module)
  @RequirePermission('eliminar_modulo')
  restoreModule(@Args('id') id: string) {
    return this.modulesService.restore(id);
  }
}
