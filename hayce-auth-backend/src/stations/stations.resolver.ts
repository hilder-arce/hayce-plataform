import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequirePermission } from 'src/decorators/require-permission.decorator';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { Station } from './entities/station.entity';
import { StationsService } from './stations.service';

@Resolver(() => Station)
export class StationsResolver {
  constructor(private readonly stationsService: StationsService) {}

  @Mutation(() => Station)
  @RequirePermission('crear_estacion')
  createStation(@Args('input') input: CreateStationDto) {
    return this.stationsService.create(input);
  }

  @Query(() => [Station])
  @RequirePermission('listar_estaciones')
  stations() {
    return this.stationsService.findAll();
  }

  @Query(() => [Station])
  @RequirePermission('listar_estaciones')
  inactiveStations() {
    return this.stationsService.findAllInactive();
  }

  @Query(() => Station)
  @RequirePermission('listar_estaciones')
  station(@Args('id') id: string) {
    return this.stationsService.findOne(id);
  }

  @Query(() => Station)
  @RequirePermission('listar_estaciones')
  inactiveStation(@Args('id') id: string) {
    return this.stationsService.findOneInactive(id);
  }

  @Mutation(() => Station)
  @RequirePermission('actualizar_estacion')
  updateStation(
    @Args('id') id: string,
    @Args('input') input: UpdateStationDto,
  ) {
    return this.stationsService.update(id, input);
  }

  @Mutation(() => Station)
  @RequirePermission('eliminar_estacion')
  removeStation(@Args('id') id: string) {
    return this.stationsService.remove(id);
  }

  @Mutation(() => Station)
  @RequirePermission('eliminar_estacion')
  restoreStation(@Args('id') id: string) {
    return this.stationsService.restore(id);
  }
}
