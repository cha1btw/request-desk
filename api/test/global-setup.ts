import { resolve } from 'node:path';
import { Client } from 'pg';

// Runs once before the e2e tests. It makes sure a separate test database
// exists, so the tests never touch your development data.
export default async function globalSetup(): Promise<void> {
  try {
    // Local runs: read the .env from the repo root (existing variables win).
    process.loadEnvFile(resolve(__dirname, '../../.env'));
  } catch {
    // No .env file (for example in CI): the variables come from the environment.
  }

  const testDatabase = process.env.E2E_DATABASE_NAME ?? 'request_desk_test';
  if (!/^[a-z0-9_]+$/.test(testDatabase)) {
    throw new Error(`Invalid test database name: ${testDatabase}`);
  }
  // The app reads DATABASE_NAME, so point it at the test database.
  process.env.DATABASE_NAME = testDatabase;

  // Connect to the default "postgres" database to be able to create another one.
  const admin = new Client({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 5432),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'postgres',
  });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      testDatabase,
    ]);
    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE "${testDatabase}"`);
    }
  } finally {
    await admin.end();
  }
}
