// src/main.ts
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { connectToDatabase } from './database/connection';
import { json } from 'express';

dotenv.config();

async function bootstrap() {
  await connectToDatabase();
  const app = await NestFactory.create(AppModule);

  // Apply global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => {
      return new BadRequestException(errors);
    },
  }));

  app.enableCors({allowedHeaders: '*'});
  app.setGlobalPrefix('api');
  app.use(json({ limit: '50mb' }));  
  await app.listen(4000);
}
bootstrap();
