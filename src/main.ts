import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

const port = process.env.PORT ?? 3333;
const prefix = `/api/v1`;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ✅ Enable cookie parsing for incoming requests
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix(prefix);

  // Get CORS origins from environment variables
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) =>
    origin.trim(),
  ) || ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  await app.listen(port, () => {
    console.log(`✅ CORS origins: ${corsOrigins?.join(', ')}`);
    console.log(`✅ Server running on: http://localhost:${port}${prefix}`);
  });
}
void bootstrap();
