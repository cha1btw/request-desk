import { validateEnv } from './env.validation';

const validEnv = {
  DATABASE_HOST: 'localhost',
  DATABASE_USER: 'user',
  DATABASE_PASSWORD: 'password',
  DATABASE_NAME: 'db',
  JWT_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults for optional values', () => {
    const env = validateEnv(validEnv);
    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_PORT).toBe(5432);
    expect(env.JWT_EXPIRES_IN_SECONDS).toBe(8 * 60 * 60);
  });

  it('passes SEED_PASSWORD through when it is set', () => {
    expect(validateEnv(validEnv).SEED_PASSWORD).toBeUndefined();
    expect(validateEnv({ ...validEnv, SEED_PASSWORD: 'demo-pass' }).SEED_PASSWORD).toBe('demo-pass');
  });

  it('lists every missing required variable', () => {
    expect(() => validateEnv({})).toThrow(
      'Missing required environment variables: DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME, JWT_SECRET',
    );
  });

  it('rejects a JWT secret shorter than 32 characters', () => {
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: 'too-short' })).toThrow(
      'JWT_SECRET must be at least 32 characters long',
    );
  });

  it('rejects non-numeric ports', () => {
    expect(() => validateEnv({ ...validEnv, PORT: 'abc' })).toThrow('must be integers');
  });
});
