import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Worker, WorkerSchema } from './entities/worker.entity';
import { WorkersService } from './workers.service';
import { WorkersResolver } from './workers.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Worker.name, schema: WorkerSchema }]),
  ],
  providers: [WorkersService, WorkersResolver],
  exports: [WorkersService],
})
export class WorkersModule {}
