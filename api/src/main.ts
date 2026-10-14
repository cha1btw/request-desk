import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { Env } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  // `docker stop` sends SIGTERM. With shutdown hooks Nest stops accepting new
  // requests, lets running ones finish and closes the database connection.
  app.enableShutdownHooks();
  const config = app.get(ConfigService<Env, true>);
  await app.listen(config.get('PORT'));
}

void bootstrap();
