import { INestApplication, ValidationPipe } from '@nestjs/common';

// Shared by main.ts and the e2e tests, so tests run against the same
// setup as production.
export function configureApp(app: INestApplication): void {
  // The API runs behind nginx, so every request "comes from" nginx. Trusting
  // one proxy hop makes Express read the real client IP from X-Forwarded-For,
  // which the login rate limit needs.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that are not in the DTO
      forbidNonWhitelisted: true, // ...and reject the request instead of silently ignoring them
      transform: true, // turn plain JSON / query strings into DTO instances and numbers
    }),
  );
}
