import supertest from 'supertest';
import { buildApp } from '../src/app';
import { setupTestDB, teardownTestDB, clearDB } from './setup';
import { FastifyInstance } from 'fastify';
import { dataSource } from '../src/plugins/db';
import { Challenge } from '../src/entities/Challenge';
import { Reward } from '../src/entities/Reward';

describe('Protected Routes', () => {
  let app: FastifyInstance;
  let request: ReturnType<typeof supertest>;
  let accessToken: string;
  let testChallenge: Challenge;
  let testReward: Reward;

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

    const registerRes = await request.post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });

    accessToken = registerRes.body.data.accessToken;

    const challengeRepo = dataSource.getRepository(Challenge);
    testChallenge = await challengeRepo.save(
      challengeRepo.create({
        title: 'Test Challenge',
        artist: 'Artist',
        description: 'Desc',
        points: 100,
        durationSeconds: 180,
        difficulty: 'easy',
        active: true,
      })
    );

    const rewardRepo = dataSource.getRepository(Reward);
    testReward = await rewardRepo.save(
      rewardRepo.create({
        name: 'Test Reward',
        description: 'Desc',
        pointsCost: 50,
        available: true,
      })
    );
  });

  describe('GET /api/users/me', () => {
    it('should return current user', async () => {
      const res = await request
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data.displayName).toBe('Test User');
    });

    it('should return 401 without token', async () => {
      await request.get('/api/users/me').expect(401);
    });
  });

  describe('GET /api/challenges', () => {
    it('should return paginated challenges', async () => {
      const res = await request
        .get('/api/challenges')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('POST /api/challenges/:id/complete', () => {
    it('should award points for completion', async () => {
      const res = await request
        .post(`/api/challenges/${testChallenge.id}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ listenPercentage: 100 })
        .expect(201);

      expect(res.body.data.pointsEarned).toBe(100);
      expect(res.body.data.totalPoints).toBe(100);
    });

    it('should return 404 on invalid challenge', async () => {
      await request
        .post('/api/challenges/00000000-0000-0000-0000-000000000000/complete')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ listenPercentage: 100 })
        .expect(404);
    });
  });

  describe('GET /api/rewards', () => {
    it('should return available rewards', async () => {
      const res = await request
        .get('/api/rewards')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Test Reward');
    });
  });

  describe('POST /api/rewards/:id/redeem', () => {
    beforeEach(async () => {
      await request
        .post(`/api/challenges/${testChallenge.id}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ listenPercentage: 100 });
    });

    it('should redeem reward and deduct points', async () => {
      const res = await request
        .post(`/api/rewards/${testReward.id}/redeem`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.data.pointsSpent).toBe(50);
    });

    it('should return 422 on insufficient points', async () => {
      const rewardRepo = dataSource.getRepository(Reward);
      const expensiveReward = await rewardRepo.save(
        rewardRepo.create({
          name: 'Expensive',
          description: 'Desc',
          pointsCost: 500,
          available: true,
        })
      );

      const res = await request
        .post(`/api/rewards/${expensiveReward.id}/redeem`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(422);

      expect(res.body.error.code).toBe('INSUFFICIENT_POINTS');
    });
  });

  describe('GET /api/leaderboard', () => {
    it('should return ranked users', async () => {
      const res = await request
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/leaderboard/me', () => {
    it('should return current user rank', async () => {
      const res = await request
        .get('/api/leaderboard/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.rank).toBeDefined();
      expect(res.body.data.totalPoints).toBeDefined();
    });
  });
});
