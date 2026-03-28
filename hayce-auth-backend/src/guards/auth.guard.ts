import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

import { AuthService } from 'src/auth/auth.service';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { getRequestResponse } from 'src/common/graphql/graphql-context.util';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // VERIFICAR SI LA RUTA ES PUBLICA
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const { req, res } = getRequestResponse(context);

    const accessToken = req.cookies?.access_token;
    const refreshToken = req.cookies?.refresh_token;

    // SI NO HAY NINGUN TOKEN
    if (!accessToken && !refreshToken) {
      throw new UnauthorizedException(
        'Activar cookies de terceros para iniciar sesion',
      );
    }

    // INTENTAR VERIFICAR EL ACCESS TOKEN
    if (accessToken) {
      try {
        const payload = this.jwtService.verify(accessToken, {
          secret: this.configService.get('JWT_SECRET'),
        });

        // VERIFICAR SI LA SESION SIGUE ACTIVA EN LA BD
        if (payload.sessionId) {
          const sessionValida = await this.authService.validateSession(
            payload.sessionId,
          );
          if (!sessionValida) {
            throw new UnauthorizedException('Sesion revocada');
          }
        }

        req['user'] = payload.sessionId
          ? await this.authService.buildRequestUserContext(
              payload.sub,
              payload.sessionId,
            )
          : payload;

        return true;
      } catch (error) {
        // ACCESS TOKEN VENCIDO, INTENTAR RENOVAR CON EL REFRESH TOKEN
        if (error.name === 'TokenExpiredError' && refreshToken) {
          return await this.renovarToken(refreshToken, res, req);
        }

        throw new UnauthorizedException('Token invalido');
      }
    }

    // SI NO HAY ACCESS TOKEN PERO HAY REFRESH TOKEN
    if (refreshToken) {
      return await this.renovarToken(refreshToken, res, req);
    }

    throw new UnauthorizedException(
      'Activar cookies de terceros para iniciar sesion',
    );
  }

  // RENOVAR TOKEN AUTOMATICAMENTE
  private async renovarToken(
    refreshToken: string,
    res: Response,
    req: Request,
  ): Promise<boolean> {
    try {
      const nuevoPayload = await this.authService.refreshFromGuard(
        refreshToken,
        req,
        res,
      );

      req['user'] = nuevoPayload?.sessionId
        ? await this.authService.buildRequestUserContext(
            nuevoPayload.sub,
            nuevoPayload.sessionId,
          )
        : nuevoPayload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Sesion expirada, inicia sesion nuevamente',
      );
    }
  }
}
