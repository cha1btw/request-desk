// Validates process.env once at startup. If something required is missing,
// the app refuses to start instead of failing later with a confusing error.

export interface Env {
  PORT: number;
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
}

const REQUIRED_STRINGS = [
  'DATABASE_HOST',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
] as const;

export function validateEnv(raw: Record<string, unknown>): Env {
  const missing = REQUIRED_STRINGS.filter((key) => !raw[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const port = Number(raw.PORT ?? 3000);
  const databasePort = Number(raw.DATABASE_PORT ?? 5432);
  if (!Number.isInteger(port) || !Number.isInteger(databasePort)) {
    throw new Error('PORT and DATABASE_PORT must be integers');
  }

  return {
    PORT: port,
    DATABASE_HOST: String(raw.DATABASE_HOST),
    DATABASE_PORT: databasePort,
    DATABASE_USER: String(raw.DATABASE_USER),
    DATABASE_PASSWORD: String(raw.DATABASE_PASSWORD),
    DATABASE_NAME: String(raw.DATABASE_NAME),
  };
}
