import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
import { MessageResponse } from 'src/common/graphql/types/message-response.type';
import { Public } from 'src/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { Session } from './entities/session.entity';
import { AuthResponse, AuthUserProfile } from './graphql/auth-response.type';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse)
  async login(
    @Args('input') input: LoginDto,
    @Context('req') req: Request,
    @Context('res') res: Response,
  ): Promise<AuthResponse> {
    const response = await this.authService.login(input, req, res);
    return {
      ...response,
      data: {
        usuario: this.mapAuthUser(response.data.usuario),
      },
    };
  }

  @Mutation(() => MessageResponse)
  async logout(@Context('req') req: Request, @Context('res') res: Response) {
    return this.authService.logout(req, res);
  }

  @Mutation(() => MessageResponse)
  async logoutAll(
    @CurrentUser() user: { sub: string },
    @Context('req') req: Request,
    @Context('res') res: Response,
  ) {
    return this.authService.logoutAll(user.sub, req, res);
  }

  @Query(() => AuthUserProfile)
  async me(@CurrentUser() user: { sub: string }) {
    const response = await this.authService.me(user.sub);
    return this.mapAuthUser(response.data.usuario);
  }

  @Query(() => [Session])
  async mySessions(@CurrentUser() user: { sub: string }) {
    return this.authService.mySessions(user.sub);
  }

  @Query(() => [Session])
  async allSessions(@CurrentUser() user: { sub: string; esSuperAdmin?: boolean }) {
    return this.authService.allSessions(user);
  }

  @Mutation(() => MessageResponse)
  async revokeSession(
    @Args('id') id: string,
    @CurrentUser() user: { sub: string; esSuperAdmin?: boolean },
    @Context('req') req: Request,
    @Context('res') res: Response,
  ) {
    return this.authService.revokeSession(id, user, req, res);
  }

  @Public()
  @Mutation(() => MessageResponse)
  async forgotPassword(@Args('input') input: ForgotPasswordDto) {
    return this.authService.forgotPassword(input);
  }

  @Public()
  @Mutation(() => MessageResponse)
  async verifyCode(@Args('input') input: VerifyCodeDto) {
    return this.authService.verifyCode(input);
  }

  @Public()
  @Mutation(() => MessageResponse)
  async resetPassword(@Args('input') input: ResetPasswordDto) {
    return this.authService.resetPassword(input);
  }

  private mapAuthUser(user: {
    id: string;
    nombre: string;
    email: string;
    rol?: string;
    organization?: any;
    ownerAdmin?: any;
    esSuperAdmin: boolean;
    permisos?: Record<string, string[]>;
    estado: boolean;
    createdAt: Date;
  }): AuthUserProfile {
    return {
      ...user,
      permisos: Object.entries(user.permisos ?? {}).map(
        ([modulo, permisos]) => ({
          modulo,
          permisos,
        }),
      ),
    };
  }
}
