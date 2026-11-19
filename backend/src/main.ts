import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Increase payload size limits for JSON and URL-encoded bodies (avoid 413 Payload Too Large)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Trust proxy for accurate client IP detection behind Cloudflare/Nginx
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Set global prefix 'api' for all endpoints except root health check
  app.setGlobalPrefix('api', { exclude: ['/'] });

  // CORS configuration
  const allowedOrigins = (process.env.CORS_ORIGINS || 'https://leorank.site,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.leorank.site') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('LeoRank API (CayThueLOL)')
    .setDescription('NestJS Backend API for LeoRank Game Boosting Platform')
    .setVersion('1.0')
    .addTag('Riot Games', 'Tra cứu Rank người chơi & Lịch sử trận đấu trực tiếp từ Riot Games API')
    .addTag('Orders', 'Quản lý đơn hàng & chi tiết đơn cày thuê')
    .addTag('Boosters', 'Tuyển thủ & Sàn việc làm')
    .addTag('Authentication', 'Xác thực & phân quyền người dùng')
    .addTag('Public & Utilities', 'Cấu hình công khai & Tiện ích')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const swaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true, // Thêm thanh tìm kiếm filter trên Swagger UI
    },
  };
  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);
  SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 LeoRank Backend is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger API Docs available at: http://localhost:${port}/docs`);
}

bootstrap();

