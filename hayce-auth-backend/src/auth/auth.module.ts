import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionSchema } from './entities/session.entity';
import { JwtModule } from '@nestjs/jwt';
import { AccessControlService } from './authorization/access-control.service';
import { Permission, PermissionSchema } from 'src/permissions/entities/permission.entity';
import { Role, RoleSchema } from 'src/roles/entities/role.entity';
import { UserSchema } from 'src/users/entities/user.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import {
  PasswordReset,
  PasswordResetSchema,
} from './entities/password-reset.entity';
import { AuthResolver } from './auth.resolver';
import { AuthBootstrapService } from './auth-bootstrap.service';
import { SessionResolver } from './session.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Session', schema: SessionSchema },
      { name: 'User', schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
    ]),
    JwtModule.register({}), // SIN COFIG GLOBAL CADA TOKEN  USA SU PROPIO SECRET
    NotificationsModule,
  ],
  controllers: [],
  providers: [
    AuthService,
    AuthResolver,
    SessionResolver,
    AccessControlService,
    AuthBootstrapService,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
