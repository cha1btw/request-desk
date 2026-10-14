import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

// Has its own app (and so its own request counter), separate from app.e2e-spec.ts.
describe('Login rate limit (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 429 after 10 login attempts in a minute', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@e2e.test', password: 'wrong-password' });

    for (let i = 0; i < 10; i++) {
      await attempt().expect(401);
    }

    const blocked = await attempt().expect(429);
    expect(blocked.body.message).toBe('Too many login attempts. Try again in a minute.');
  });

  it('does not limit other routes', async () => {
    for (let i = 0; i < 15; i++) {
      await request(app.getHttpServer()).get('/api/health').expect(200);
    }
  });
});
