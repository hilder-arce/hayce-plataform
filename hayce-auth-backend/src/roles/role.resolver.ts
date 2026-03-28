import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphqlLoadersService } from 'src/common/graphql/graphql-loaders.service';
import {
  extractEntityId,
  isPopulatedReference,
} from 'src/common/graphql/utils/mongoose-ref.util';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Role } from './entities/role.entity';

@Resolver(() => Role)
export class RoleResolver {
  constructor(private readonly loaders: GraphqlLoadersService) {}

  @ResolveField(() => [Permission], { defaultValue: [] })
  async permisos(@Parent() role: Role) {
    const refs = role.permisos ?? [];
    return Promise.all(
      refs.map((permission) => {
        if (isPopulatedReference<Permission>(permission, 'descripcion')) {
          return permission;
        }

        const permissionId = extractEntityId(permission);
        return permissionId
          ? this.loaders.permissionById.load(permissionId)
          : null;
      }),
    ).then((permissions) =>
      permissions.filter(
        (permission): permission is Permission => !!permission,
      ),
    );
  }
}
