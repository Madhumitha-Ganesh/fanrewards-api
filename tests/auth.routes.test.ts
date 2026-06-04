import supertest from 'supertest';
import { buildApp } from '../src/app';
import { setupTestDB, teardownTestDB, clearDB } from './setup';
import { FastifyInstance } from 'fastify';

describe('Auth Routes', () => {
  let app: FastifyInstance;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    await setupTestDB();
    app = await buildApp();
    await app.ready();
    request = supertest(app.server);
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User',
        })
        .expect(201);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should return 409 on duplicate email', async () => {
      await request.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      const res = await request
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password456',
          displayName: 'Another User',
        })
        .expect(409);

      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should return 400 on invalid data', async () => {
      await request
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
          displayName: '',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 on invalid credentials', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 423 after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request.post('/api/auth/login').send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      }

      const res = await request
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(423);

      expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should issue new tokens on valid refresh token', async () => {
      const registerRes = await request.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      const { refreshToken } = registerRes.body.data;

      const res = await request
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should return 401 on invalid refresh token', async () => {
      await request
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should invalidate refresh token', async () => {
      const registerRes = await request.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      const { refreshToken } = registerRes.body.data;

      await request
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      await request
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
