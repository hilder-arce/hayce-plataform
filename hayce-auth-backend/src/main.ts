import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ==========================================
  // CONFIGURACIÓN DE PREFIJO GLOBAL DE LA API
  // ==========================================
  app.setGlobalPrefix('v1', {
    exclude: ['/socket.io/*path'],
  });

  // ==========================================
  // SEGURIDAD Y MIDDLEWARE (COOKIES & CORS)
  // ==========================================
  const allowedOrigins = (
    process.env.CORS_ORIGINS ??
    [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:4200',
      'http://127.0.0.1:4200',
      'https://studio.apollographql.com',
      'https://hayce-auth-frontend.onrender.com',
    ].join(',')
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cookieParser());

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // ==========================================
  // ADAPTADOR PARA COMUNICACIÓN EN TIEMPO REAL
  // ==========================================
  app.useWebSocketAdapter(new IoAdapter(app));

  // ==========================================
  // PIPES GLOBALES DE VALIDACIÓN Y DTOs
  // ==========================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ==========================================
  // INICIO DEL SERVIDOR WEB
  // ==========================================
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
