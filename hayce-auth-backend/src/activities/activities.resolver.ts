import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
import { RequirePermission } from 'src/decorators/require-permission.decorator';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { Activity } from './entities/activity.entity';
import { ActivitiesService } from './activities.service';

@Resolver(() => Activity)
export class ActivitiesResolver {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Mutation(() => Activity)
  @RequirePermission('crear_actividad')
  createActivity(
    @Args('input') input: CreateActivityDto,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.activitiesService.create(input, user);
  }

  @Query(() => [Activity])
  @RequirePermission('listar_actividades')
  activities(
    @CurrentUser()
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.activitiesService.findAll(user);
  }

  @Query(() => [Activity])
  @RequirePermission('listar_actividades')
  activitiesByStation(
    @Args('stationId') stationId: string,
    @CurrentUser()
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.activitiesService.findByStation(stationId, user);
  }

  @Query(() => [Activity])
  @RequirePermission('listar_actividades')
  inactiveActivities(
    @CurrentUser()
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.activitiesService.findAllInactive(user);
  }

  @Query(() => Activity)
  @RequirePermission('listar_actividades')
  activity(
    @Args('id') id: string,
    @CurrentUser()
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.activitiesService.findOne(id, user);
  }

  @Query(() => Activity)
  @RequirePermission('listar_actividades')
  inactiveActivity(
    @Args('id') id: string,
    @CurrentUser()
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.activitiesService.findOneInactive(id, user);
  }

  @Mutation(() => Activity)
  @RequirePermission('actualizar_actividad')
  updateActivity(
    @Args('id') id: string,
    @Args('input') input: UpdateActivityDto,
    @CurrentUser()
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.activitiesService.update(id, input, user);
  }

  @Mutation(() => Activity)
  @RequirePermission('eliminar_actividad')
  removeActivity(
    @Args('id') id: string,
    @CurrentUser()
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.activitiesService.remove(id, user);
  }

  @Mutation(() => Activity)
  @RequirePermission('eliminar_actividad')
  restoreActivity(
    @Args('id') id: string,
    @CurrentUser()
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.activitiesService.restore(id, user);
  }
}
