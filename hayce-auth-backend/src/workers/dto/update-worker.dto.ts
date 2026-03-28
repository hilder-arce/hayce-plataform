import { InputType, PartialType } from '@nestjs/graphql';
import { CreateWorkerDto } from './create-worker.dto';

@InputType()
export class UpdateWorkerDto extends PartialType(CreateWorkerDto) {}
