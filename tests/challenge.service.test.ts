import { ChallengeService } from '../src/services/ChallengeService';
import { testDataSource, setupTestDB, teardownTestDB, clearDB } from './setup';
import { Challenge } from '../src/entities/Challenge';
import { User } from '../src/entities/User';

describe('ChallengeService', () => {
  let challengeService: ChallengeService;
  let testUser: User;
  let testChallenge: Challenge;

  beforeAll(async () => {
    await setupTestDB();
  }, 30000);

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDB();
    challengeService = new ChallengeService(testDataSource);

    testUser = await testDataSource.getRepository(User).save(
      testDataSource.getRepository(User).create({
        email: 'test@example.com',
        passwordHash: 'hash',
        displayName: 'Test User',
        totalPoints: 0,
      })
    );

    testChallenge = await testDataSource.getRepository(Challenge).save(
      testDataSource.getRepository(Challenge).create({
        title: 'Test Challenge',
        artist: 'Test Artist',
        description: 'Test description',
        points: 100,
        durationSeconds: 180,
        difficulty: 'easy',
        active: true,
      })
    );
  });

  describe('list', () => {
    it('should return paginated challenges', async () => {
      const result = await challengeService.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by difficulty', async () => {
      await testDataSource.getRepository(Challenge).save(
        testDataSource.getRepository(Challenge).create({
          title: 'Hard', artist: 'Artist', description: 'Desc',
          points: 200, durationSeconds: 300, difficulty: 'hard', active: true,
        })
      );

      const result = await challengeService.list({ page: 1, limit: 10, difficulty: 'hard' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].difficulty).toBe('hard');
    });

    it('should filter by active status', async () => {
      await testDataSource.getRepository(Challenge).save(
        testDataSource.getRepository(Challenge).create({
          title: 'Inactive', artist: 'Artist', description: 'Desc',
          points: 50, durationSeconds: 120, difficulty: 'easy', active: false,
        })
      );

      const result = await challengeService.list({ page: 1, limit: 10, active: false });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].active).toBe(false);
    });
  });

  describe('getById', () => {
    it('should return challenge by id', async () => {
      const challenge = await challengeService.getById(testChallenge.id);
      expect(challenge.id).toBe(testChallenge.id);
    });

    it('should throw if not found', async () => {
      await expect(
        challengeService.getById('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('CHALLENGE_NOT_FOUND');
    });
  });

  describe('complete', () => {
    it('should award full points at 80% listen', async () => {
      const result = await challengeService.complete(testUser.id, testChallenge.id, 80);
      expect(result.pointsEarned).toBe(100);
      expect(result.totalPoints).toBe(100);
    });

    it('should award full points above 80%', async () => {
      const result = await challengeService.complete(testUser.id, testChallenge.id, 95);
      expect(result.pointsEarned).toBe(100);
    });

    it('should award proportional points below 80%', async () => {
      const result = await challengeService.complete(testUser.id, testChallenge.id, 50);
      expect(result.pointsEarned).toBe(50);
    });

    it('should allow multiple completions', async () => {
      await challengeService.complete(testUser.id, testChallenge.id, 100);
      const result = await challengeService.complete(testUser.id, testChallenge.id, 100);
      expect(result.totalPoints).toBe(200);
    });

    it('should throw on inactive challenge', async () => {
      await testDataSource.getRepository(Challenge).update(testChallenge.id, { active: false });

      await expect(
        challengeService.complete(testUser.id, testChallenge.id, 100)
      ).rejects.toThrow('CHALLENGE_INACTIVE');
    });
  });
});
