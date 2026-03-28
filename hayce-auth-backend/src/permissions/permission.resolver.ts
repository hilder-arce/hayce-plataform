import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphqlLoadersService } from 'src/common/graphql/graphql-loaders.service';
import {
  extractEntityId,
  isPopulatedReference,
} from 'src/common/graphql/utils/mongoose-ref.util';
import { Module } from 'src/modules/entities/module.entity';
import { Permission } from './entities/permission.entity';

@Resolver(() => Permission)
export class PermissionResolver {
  constructor(private readonly loaders: GraphqlLoadersService) {}

  @ResolveField(() => Module, { nullable: true })
  async modulo(@Parent() permission: Permission) {
    if (isPopulatedReference<Module>(permission.modulo, 'descripcion')) {
      return permission.modulo;
    }

    const moduleId = extractEntityId(permission.modulo);
    return moduleId ? this.loaders.moduleById.load(moduleId) : null;
  }
}
