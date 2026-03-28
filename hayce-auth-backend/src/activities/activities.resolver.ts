import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
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
  createActivity(@Args('input') input: CreateActivityDto) {
    return this.activitiesService.create(input);
  }

  @Query(() => [Activity])
  @RequirePermission('listar_actividades')
  activities() {
    return this.activitiesService.findAll();
  }

  @Query(() => [Activity])
  @RequirePermission('listar_actividades')
  activitiesByStation(@Args('stationId') stationId: string) {
    return this.activitiesService.findByStation(stationId);
  }

  @Query(() => [Activity])
  @RequirePermission('listar_actividades')
  inactiveActivities() {
    return this.activitiesService.findAllInactive();
  }

  @Query(() => Activity)
  @RequirePermission('listar_actividades')
  activity(@Args('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Query(() => Activity)
  @RequirePermission('listar_actividades')
  inactiveActivity(@Args('id') id: string) {
    return this.activitiesService.findOneInactive(id);
  }

  @Mutation(() => Activity)
  @RequirePermission('actualizar_actividad')
  updateActivity(@Args('id') id: string, @Args('input') input: UpdateActivityDto) {
    return this.activitiesService.update(id, input);
  }

  @Mutation(() => Activity)
  @RequirePermission('eliminar_actividad')
  removeActivity(@Args('id') id: string) {
    return this.activitiesService.remove(id);
  }

  @Mutation(() => Activity)
  @RequirePermission('eliminar_actividad')
  restoreActivity(@Args('id') id: string) {
    return this.activitiesService.restore(id);
  }
}
