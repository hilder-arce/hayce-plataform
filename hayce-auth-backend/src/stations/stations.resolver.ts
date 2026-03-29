import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
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
  createStation(
    @Args('input') input: CreateStationDto,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.stationsService.create(input, user);
  }

  @Query(() => [Station])
  @RequirePermission('listar_estaciones')
  stations(
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.stationsService.findAll(user);
  }

  @Query(() => [Station])
  @RequirePermission('listar_estaciones')
  inactiveStations(
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.stationsService.findAllInactive(user);
  }

  @Query(() => Station)
  @RequirePermission('listar_estaciones')
  station(
    @Args('id') id: string,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.stationsService.findOne(id, user);
  }

  @Query(() => Station)
  @RequirePermission('listar_estaciones')
  inactiveStation(
    @Args('id') id: string,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.stationsService.findOneInactive(id, user);
  }

  @Mutation(() => Station)
  @RequirePermission('actualizar_estacion')
  updateStation(
    @Args('id') id: string,
    @Args('input') input: UpdateStationDto,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.stationsService.update(id, input, user);
  }

  @Mutation(() => Station)
  @RequirePermission('eliminar_estacion')
  removeStation(
    @Args('id') id: string,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.stationsService.remove(id, user);
  }

  @Mutation(() => Station)
  @RequirePermission('eliminar_estacion')
  restoreStation(
    @Args('id') id: string,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.stationsService.restore(id, user);
  }
}
