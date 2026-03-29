import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ModulesModule } from './modules/modules.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { StationsModule } from './stations/stations.module';
import { ActivitiesModule } from './activities/activities.module';
import { WorkersModule } from './workers/workers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GraphqlSupportModule } from './common/graphql/graphql-support.module';

import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { TareoModule } from './tareo/tareo.module';

@Module({
  imports: [
    // ==========================================
    // CONFIGURACIÓN GLOBAL Y VARIABLES DE ENTORNO
    // ==========================================
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ==========================================
    // INFRAESTRUCTURA DE PERSISTENCIA (MONGODB)
    // ==========================================
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      }),
      inject: [ConfigService],
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      path: '/graphql',
      context: ({ req, res }) => ({ req, res }),
      formatError: (error) => ({
        message: error.message,
        path: error.path,
        code: error.extensions?.code,
        details: error.extensions?.originalError ?? null,
      }),
    }),

    GraphqlSupportModule,

    // ==========================================
    // MÓDULOS DE NEGOCIO DEL SISTEMA
    // ==========================================
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ModulesModule,
    OrganizationsModule,
    StationsModule,
    ActivitiesModule,
    WorkersModule,
    TareoModule,
    NotificationsModule
    ],
  controllers: [],
  providers: [
    // ==========================================
    // GUARDS GLOBALES DE SEGURIDAD
    // ==========================================
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
