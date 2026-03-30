import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
import { RequirePermission } from 'src/decorators/require-permission.decorator';
import { CreateTareoDto } from './dto/create-tareo.dto';
import { UpdateTareoDto } from './dto/update-tareo.dto';
import { Tareo } from './entities/tareo.entity';
import { TareoService } from './tareo.service';

@Resolver(() => Tareo)
export class TareoResolver {
  constructor(private readonly tareoService: TareoService) {}

  @Mutation(() => Tareo)
  @RequirePermission('crear_tareo')
  createTareo(
    @Args('input') input: CreateTareoDto,
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.tareoService.create(input, user);
  }

  @Query(() => [Tareo])
  @RequirePermission('listar_tareos')
  tareos(
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.tareoService.findAll(user);
  }

  @Query(() => Tareo)
  @RequirePermission('listar_tareos')
  tareo(
    @Args('id') id: string,
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.tareoService.findOne(id, user);
  }

  @Mutation(() => Tareo)
  @RequirePermission('actualizar_tareo')
  updateTareo(
    @Args('id') id: string,
    @Args('input') input: UpdateTareoDto,
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.tareoService.update(id, input, user);
  }

  @Mutation(() => Tareo)
  @RequirePermission('eliminar_tareo')
  removeTareo(
    @Args('id') id: string,
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }  ) {
    return this.tareoService.remove(id, user);
  }

  @Mutation(() => Tareo)
  @RequirePermission('eliminar_tareo')
  restoreTareo(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }
  ) {
    return this.tareoService.restore(id, user);
  }
}
