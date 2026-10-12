import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Env } from '../config/env.validation';
import { Role } from '../users/role.enum';
import { UsersService } from '../users/users.service';

// Demo data for local development. Safe to run many times: users that
// already exist are skipped.
const DEMO_USERS = [
  { email: 'admin@example.com', name: 'Admin', role: Role.Admin },
  { email: 'olena@example.com', name: 'Olena Shevchenko', role: Role.Manager },
  { email: 'max@example.com', name: 'Max Bondar', role: Role.Manager },
];

async function seed() {
  // An "application context" is the Nest app without the HTTP server.
  // Creating it also loads .env and runs pending migrations.
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const password = app.get(ConfigService<Env, true>).get('SEED_PASSWORD');
    if (!password || password.length < 8) {
      throw new Error('Set SEED_PASSWORD (at least 8 characters) in your .env file');
    }

    const usersService = app.get(UsersService);
    for (const demoUser of DEMO_USERS) {
      if (await usersService.findByEmail(demoUser.email)) {
        console.log(`skip   ${demoUser.email} (already exists)`);
        continue;
      }
      await usersService.create({ ...demoUser, password });
      console.log(`create ${demoUser.email} (${demoUser.role})`);
    }
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
