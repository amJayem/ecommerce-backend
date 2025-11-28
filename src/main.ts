import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const port = process.env.PORT ?? 3456;
const prefix = `/api/v1`;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Swagger setup (gated by env). Enable when SWAGGER_ENABLED=true or not production.
  const enableSwagger =
    String(process.env.SWAGGER_ENABLED).toLowerCase() === 'true' ||
    process.env.NODE_ENV !== 'production';

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Ecommerce API')
      .setDescription('API documentation for the Ecommerce backend')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT token, e.g., Bearer <token>',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const documentFactory = () =>
      SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('docs', app, documentFactory, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'none',
      },
      customSiteTitle: 'Ecommerce API Docs',
      customCss:
        ':root { --primary-color: #0e7490 } .topbar-wrapper img { content:url("https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/nestjs.svg"); width:32px; height:32px; } .swagger-ui .topbar { background-color: #0e7490; }',
      customfavIcon:
        'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/nestjs.svg',
    });
  }
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
  );

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  await app.listen(port, () => {
    console.log(`✅ CORS origins: ${corsOrigins?.join(', ')}`);
    console.log(
      `✅ Cookie settings: SameSite=${
        process.env.ALLOW_CROSS_DOMAIN_COOKIES === 'true'
          ? 'none'
          : process.env.NODE_ENV === 'production'
            ? 'strict'
            : 'lax'
      }, 
        Secure=${
          process.env.NODE_ENV === 'production' ||
          process.env.ALLOW_CROSS_DOMAIN_COOKIES === 'true'
        }`,
    );
    console.log(`✅ Server running on: http://localhost:${port}${prefix}`);
    if (enableSwagger) {
      console.log(`✅ Swagger docs: http://localhost:${port}/docs`);
    }
  });
}
void bootstrap();
