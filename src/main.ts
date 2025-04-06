// src/main.ts
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { connectToDatabase } from './database/connection';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

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
  
  app.enableCors();
  
  await app.listen(4000);
}
bootstrap();
