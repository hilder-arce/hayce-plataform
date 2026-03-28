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
  createTareo(@Args('input') input: CreateTareoDto, @CurrentUser() user: { sub: string }) {
    return this.tareoService.create(input, user.sub);
  }

  @Query(() => [Tareo])
  @RequirePermission('listar_tareos')
  tareos() {
    return this.tareoService.findAll();
  }

  @Query(() => Tareo)
  @RequirePermission('listar_tareos')
  tareo(@Args('id') id: string) {
    return this.tareoService.findOne(id);
  }

  @Mutation(() => Tareo)
  @RequirePermission('actualizar_tareo')
  updateTareo(@Args('id') id: string, @Args('input') input: UpdateTareoDto) {
    return this.tareoService.update(id, input);
  }

  @Mutation(() => Tareo)
  @RequirePermission('eliminar_tareo')
  removeTareo(@Args('id') id: string) {
    return this.tareoService.remove(id);
  }

  @Mutation(() => Tareo)
  @RequirePermission('eliminar_tareo')
  restoreTareo(@Args('id') id: string) {
    return this.tareoService.restore(id);
  }
}
