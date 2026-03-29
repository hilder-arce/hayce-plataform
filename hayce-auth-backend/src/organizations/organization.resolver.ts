import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GraphqlLoadersService } from 'src/common/graphql/graphql-loaders.service';
import {
  extractEntityId,
  isPopulatedReference,
} from 'src/common/graphql/utils/mongoose-ref.util';
import { Role } from 'src/roles/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { Organization } from './entities/organization.entity';

@Resolver(() => Organization)
export class OrganizationResolver {
  constructor(
    private readonly loaders: GraphqlLoadersService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
  ) {}

  @ResolveField(() => User, { nullable: true })
  async createdBy(@Parent() organization: Organization) {
    if (isPopulatedReference<User>(organization.createdBy, 'nombre')) {
      return organization.createdBy;
    }

    const userId = extractEntityId(organization.createdBy);
    return userId ? this.loaders.userById.load(userId) : null;
  }

  @ResolveField(() => Number)
  async userCount(@Parent() organization: Organization) {
    return this.userModel.countDocuments({
      organization: new Types.ObjectId(organization._id),
      estado: true,
    });
  }

  @ResolveField(() => Number)
  async roleCount(@Parent() organization: Organization) {
    return this.roleModel.countDocuments({
      organization: new Types.ObjectId(organization._id),
      estado: true,
    });
  }

  @ResolveField(() => User, { nullable: true })
  async principalAdmin(@Parent() organization: Organization) {
    return this.userModel
      .findOne({
        organization: new Types.ObjectId(organization._id),
        estado: true,
        $expr: { $eq: ['$_id', '$ownerAdmin'] },
      })
      .select('-password')
      .exec();
  }
}
