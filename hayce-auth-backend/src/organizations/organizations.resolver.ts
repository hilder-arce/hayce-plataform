import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';

@Resolver(() => Organization)
export class OrganizationsResolver {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Mutation(() => Organization)
  createOrganization(
    @Args('input') input: CreateOrganizationDto,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.organizationsService.create(input, user);
  }

  @Query(() => [Organization])
  organizations(@CurrentUser() user: { sub: string; esSuperAdmin?: boolean }) {
    return this.organizationsService.findAll(user);
  }

  @Query(() => [Organization])
  inactiveOrganizations(
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.organizationsService.findAllInactive(user);
  }

  @Query(() => Organization)
  organization(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.organizationsService.findOne(id, user);
  }

  @Mutation(() => Organization)
  updateOrganization(
    @Args('id') id: string,
    @Args('input') input: UpdateOrganizationDto,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.organizationsService.update(id, input, user);
  }

  @Mutation(() => Organization)
  removeOrganization(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.organizationsService.remove(id, user);
  }

  @Mutation(() => Organization)
  restoreOrganization(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
  ) {
    return this.organizationsService.restore(id, user);
  }
}
