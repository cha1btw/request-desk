// Validates process.env once at startup. If something required is missing,
// the app refuses to start instead of failing later with a confusing error.

export interface Env {
  PORT: number;
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN_SECONDS: number;
  // Only needed by the seed script, so it is optional.
  SEED_PASSWORD?: string;
}

const REQUIRED_STRINGS = [
  'DATABASE_HOST',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
  'JWT_SECRET',
] as const;

const MIN_JWT_SECRET_LENGTH = 32;

export function validateEnv(raw: Record<string, unknown>): Env {
  const missing = REQUIRED_STRINGS.filter((key) => !raw[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const jwtSecret = String(raw.JWT_SECRET);
  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`);
  }

  const port = Number(raw.PORT ?? 3000);
  const databasePort = Number(raw.DATABASE_PORT ?? 5432);
  const jwtExpiresIn = Number(raw.JWT_EXPIRES_IN_SECONDS ?? 8 * 60 * 60);
  if (![port, databasePort, jwtExpiresIn].every(Number.isInteger)) {
    throw new Error('PORT, DATABASE_PORT and JWT_EXPIRES_IN_SECONDS must be integers');
  }

  return {
    PORT: port,
    DATABASE_HOST: String(raw.DATABASE_HOST),
    DATABASE_PORT: databasePort,
    DATABASE_USER: String(raw.DATABASE_USER),
    DATABASE_PASSWORD: String(raw.DATABASE_PASSWORD),
    DATABASE_NAME: String(raw.DATABASE_NAME),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN_SECONDS: jwtExpiresIn,
    SEED_PASSWORD: raw.SEED_PASSWORD ? String(raw.SEED_PASSWORD) : undefined,
  };
}
