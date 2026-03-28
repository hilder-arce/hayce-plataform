import { Module } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ModuleSchema } from './entities/module.entity';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { ModulesResolver } from './modules.resolver';

@Module({
  imports: [
    //REGISTRAMOS EL ESQUEMA DE MODULO EN MONGODB
    MongooseModule.forFeature([{ name: 'Module', schema: ModuleSchema }]),
    PermissionsModule,
  ],
  controllers: [],
  providers: [ModulesService, ModulesResolver],
  exports: [ModulesService], //EXPORTAMOS EL SERVICIO PARA USARLO EN OTROS MODULOS (EJ: AUTH)
})
export class ModulesModule {}
