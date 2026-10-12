import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';

// Shared config module. `isGlobal` means every other module can inject
// ConfigService without importing this module again.
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      // Locally the app runs from api/ and reads the .env in the repo root.
      // In Docker there is no file: Compose passes the variables directly.
      envFilePath: ['.env', '../.env'],
      validate: validateEnv,
    }),
  ],
})
export class ConfigModule {}
