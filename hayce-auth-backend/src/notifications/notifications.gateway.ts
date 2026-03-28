import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as cookie from 'cookie';

@WebSocketGateway({
  cors: {
    origin: (
      process.env.CORS_ORIGINS ??
      'http://localhost:4200,http://127.0.0.1:4200,https://hayce-auth-frontend.onrender.com'
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Intentar obtener token de cookies (HTTP-Only)
      const cookies = client.handshake.headers.cookie;
      let token = '';

      if (cookies) {
        const parsedCookies = cookie.parse(cookies);
        token = parsedCookies['access_token'] ?? '';
      }

      // Fallback a Authorization header o auth object (por si acaso)
      if (!token) {
        token =
          client.handshake.auth?.token ||
          client.handshake.headers?.authorization?.split(' ')[1];
      }

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Unir al cliente a una "sala" por ID de usuario
      // Esto permite múltiples dispositivos o pestañas por usuario
      client.join(`user_${payload.sub}`);

      // También se une a una sala específica de la sesión actual
      // para poder cerrar solo esa sesión si se revoca
      if (payload.sessionId) {
        client.join(`session_${payload.sessionId}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Socket.io maneja la salida de salas automáticamente al desconectar
  }

  emitToUser(usuarioId: string, event: string, data: any) {
    this.server.to(`user_${usuarioId}`).emit(event, data);
  }

  emitToSession(sessionId: string, event: string, data: any) {
    this.server.to(`session_${sessionId}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
