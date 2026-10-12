import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from './clients/clients.module';
import { ConfigModule } from './config/config.module';
import { Env } from './config/env.validation';
import { migrations } from './database/migrations';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { RequestsModule } from './requests/requests.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: config.get('DATABASE_PORT'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        autoLoadEntities: true, // every module registers its own entities
        synchronize: false, // never let TypeORM change the schema on its own
        migrations,
        migrationsRun: true, // apply pending migrations when the app starts
      }),
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    ClientsModule,
    RequestsModule,
  ],
})
export class AppModule {}
