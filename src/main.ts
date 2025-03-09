// src/main.ts
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { connectToDatabase } from './database/connection';

async function bootstrap() {
  await connectToDatabase();
  const app = await NestFactory.create(AppModule);
  await app.listen(4000);
}
bootstrap();