import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { Env } from '../config/env.validation';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    UsersModule,
    // Allows 10 requests per minute from one IP address. Only the login route
    // uses it (see AuthController); the numbers live here.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 10 }],
      errorMessage: 'Too many login attempts. Try again in a minute.',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN_SECONDS') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // APP_GUARD makes a guard global. They run in this order:
    // first "who are you?" (AuthGuard), then "are you allowed?" (RolesGuard).
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
