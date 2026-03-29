import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
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
  createWorker(
    @Args('input') input: CreateWorkerDto,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.workersService.create(input, user);
  }

  @Query(() => [Worker])
  @RequirePermission('listar_trabajadores')
  workers(
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.workersService.findAll(user);
  }

  @Query(() => [Worker])
  @RequirePermission('listar_trabajadores')
  inactiveWorkers(
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.workersService.findAllInactive(user);
  }

  @Query(() => Worker)
  @RequirePermission('listar_trabajadores')
  worker(
    @Args('id') id: string,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.workersService.findOne(id, user);
  }

  @Query(() => Worker)
  @RequirePermission('listar_trabajadores')
  inactiveWorker(
    @Args('id') id: string,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.workersService.findOneInactive(id, user);
  }

  @Mutation(() => Worker)
  @RequirePermission('actualizar_trabajador')
  updateWorker(
    @Args('id') id: string,
    @Args('input') input: UpdateWorkerDto,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.workersService.update(id, input, user);
  }

  @Mutation(() => Worker)
  @RequirePermission('eliminar_trabajador')
  removeWorker(
    @Args('id') id: string,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.workersService.remove(id, user);
  }

  @Mutation(() => Worker)
  @RequirePermission('eliminar_trabajador')
  restoreWorker(
    @Args('id') id: string,
    @CurrentUser()
    user: { sub: string; organizationId?: string | null; esSuperAdmin?: boolean },
  ) {
    return this.workersService.restore(id, user);
  }
}
