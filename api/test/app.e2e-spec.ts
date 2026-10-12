import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Role } from '../src/users/role.enum';
import { UsersService } from '../src/users/users.service';

// Needs a running Postgres (docker compose up -d postgres).
// global-setup.ts points the app at a separate test database.
describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;

  const password = 'e2e-password-1';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());

    // Start every run from empty tables, then create the users we log in with.
    await app
      .get(DataSource)
      .query('TRUNCATE comments, requests, clients, users RESTART IDENTITY CASCADE');
    const users = app.get(UsersService);
    await users.create({ email: 'admin@e2e.test', name: 'E2E Admin', password, role: Role.Admin });
    await users.create({ email: 'manager@e2e.test', name: 'E2E Manager', password, role: Role.Manager });
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(email: string): Promise<string> {
    const res = await http.post('/api/auth/login').send({ email, password }).expect(200);
    return res.body.accessToken;
  }

  it('GET /api/health works without a token', async () => {
    const res = await http.get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', db: 'up' });
  });

  it('rejects a wrong password and requests without a token', async () => {
    await http.post('/api/auth/login').send({ email: 'admin@e2e.test', password: 'wrong-password' }).expect(401);
    await http.get('/api/requests').expect(401);
  });

  it('lets a manager log in and create a request for a client', async () => {
    const token = await login('manager@e2e.test');
    const auth = { Authorization: `Bearer ${token}` };

    const client = await http
      .post('/api/clients')
      .set(auth)
      .send({ name: 'Anna Petrenko', email: 'anna@example.com', phone: '+380 44 123 45 67' })
      .expect(201);

    const created = await http
      .post('/api/requests')
      .set(auth)
      .send({ title: 'Fix the door', description: 'It does not close', clientId: client.body.id })
      .expect(201);
    expect(created.body).toMatchObject({ title: 'Fix the door', status: 'new', client: { name: 'Anna Petrenko' } });

    // It shows up in the list, and the filters work.
    const all = await http.get('/api/requests').set(auth).expect(200);
    expect(all.body).toHaveLength(1);
    const byName = await http.get('/api/requests?clientName=anna&status=new').set(auth).expect(200);
    expect(byName.body).toHaveLength(1);
    const done = await http.get('/api/requests?status=done').set(auth).expect(200);
    expect(done.body).toHaveLength(0);

    // CSV export uses the same filters as the list.
    const csv = await http.get('/api/requests/export?status=new').set(auth).expect(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.headers['content-disposition']).toContain('attachment');
    expect(csv.text).toContain('Fix the door');
    const emptyCsv = await http.get('/api/requests/export?status=done').set(auth).expect(200);
    expect(emptyCsv.text).not.toContain('Fix the door');
    await http.get('/api/requests/export').expect(401);

    // Change the status and add a comment.
    await http.patch(`/api/requests/${created.body.id}`).set(auth).send({ status: 'in_progress' }).expect(200);
    await http.post(`/api/requests/${created.body.id}/comments`).set(auth).send({ text: 'Called the client' }).expect(201);

    const detail = await http.get(`/api/requests/${created.body.id}`).set(auth).expect(200);
    expect(detail.body.status).toBe('in_progress');
    expect(detail.body.comments).toHaveLength(1);
    expect(detail.body.comments[0]).toMatchObject({ text: 'Called the client', author: { name: 'E2E Manager' } });
  });

  it('allows only admins to create users', async () => {
    const newUser = { email: 'new@e2e.test', name: 'New User', password, role: 'manager' };

    const managerToken = await login('manager@e2e.test');
    await http.post('/api/users').set('Authorization', `Bearer ${managerToken}`).send(newUser).expect(403);

    const adminToken = await login('admin@e2e.test');
    const res = await http.post('/api/users').set('Authorization', `Bearer ${adminToken}`).send(newUser).expect(201);
    expect(res.body).not.toHaveProperty('passwordHash');
  });
});
