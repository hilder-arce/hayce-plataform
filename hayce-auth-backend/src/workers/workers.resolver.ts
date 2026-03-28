import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequirePermission } from 'src/decorators/require-permission.decorator';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { Worker } from './entities/worker.entity';
import { WorkersService } from './workers.service';

@Resolver(() => Worker)
export class WorkersResolver {
  constructor(private readonly workersService: WorkersService) {}

  @Mutation(() => Worker)
  @RequirePermission('crear_trabajador')
  createWorker(@Args('input') input: CreateWorkerDto) {
    return this.workersService.create(input);
  }

  @Query(() => [Worker])
  @RequirePermission('listar_trabajadores')
  workers() {
    return this.workersService.findAll();
  }

  @Query(() => [Worker])
  @RequirePermission('listar_trabajadores')
  inactiveWorkers() {
    return this.workersService.findAllInactive();
  }

  @Query(() => Worker)
  @RequirePermission('listar_trabajadores')
  worker(@Args('id') id: string) {
    return this.workersService.findOne(id);
  }

  @Query(() => Worker)
  @RequirePermission('listar_trabajadores')
  inactiveWorker(@Args('id') id: string) {
    return this.workersService.findOneInactive(id);
  }

  @Mutation(() => Worker)
  @RequirePermission('actualizar_trabajador')
  updateWorker(@Args('id') id: string, @Args('input') input: UpdateWorkerDto) {
    return this.workersService.update(id, input);
  }

  @Mutation(() => Worker)
  @RequirePermission('eliminar_trabajador')
  removeWorker(@Args('id') id: string) {
    return this.workersService.remove(id);
  }

  @Mutation(() => Worker)
  @RequirePermission('eliminar_trabajador')
  restoreWorker(@Args('id') id: string) {
    return this.workersService.restore(id);
  }
}
