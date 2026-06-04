import { RewardService } from '../src/services/RewardService';
import { testDataSource, setupTestDB, teardownTestDB, clearDB } from './setup';
import { Reward } from '../src/entities/Reward';
import { User } from '../src/entities/User';

describe('RewardService', () => {
  let rewardService: RewardService;
  let testUser: User;
  let testReward: Reward;

  beforeAll(async () => {
    await setupTestDB();
  }, 30000);

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDB();
    rewardService = new RewardService(testDataSource);

    testUser = await testDataSource.getRepository(User).save(
      testDataSource.getRepository(User).create({
        email: 'test@example.com',
        passwordHash: 'hash',
        displayName: 'Test User',
        totalPoints: 500,
      })
    );

    testReward = await testDataSource.getRepository(Reward).save(
      testDataSource.getRepository(Reward).create({
        name: 'Test Reward',
        description: 'Test description',
        pointsCost: 100,
        available: true,
      })
    );
  });

  describe('list', () => {
    it('should return only available rewards', async () => {
      await testDataSource.getRepository(Reward).save(
        testDataSource.getRepository(Reward).create({
          name: 'Unavailable', description: 'Desc', pointsCost: 200, available: false,
        })
      );

      const rewards = await rewardService.list();

      expect(rewards).toHaveLength(1);
      expect(rewards[0].name).toBe('Test Reward');
    });
  });

  describe('redeem', () => {
    it('should deduct points and create redemption', async () => {
      const redemption = await rewardService.redeem(testUser.id, testReward.id);

      expect(redemption.pointsSpent).toBe(100);
      expect(redemption.status).toBe('pending');

      const user = await testDataSource.getRepository(User).findOne({ where: { id: testUser.id } });
      expect(user?.totalPoints).toBe(400);
    });

    it('should throw on insufficient points', async () => {
      await testDataSource.getRepository(User).update(testUser.id, { totalPoints: 50 });

      await expect(rewardService.redeem(testUser.id, testReward.id)).rejects.toThrow('INSUFFICIENT_POINTS');
    });

    it('should throw on unavailable reward', async () => {
      await testDataSource.getRepository(Reward).update(testReward.id, { available: false });

      await expect(rewardService.redeem(testUser.id, testReward.id)).rejects.toThrow('REWARD_UNAVAILABLE');
    });

    it('should handle concurrent redemption safely', async () => {
      await testDataSource.getRepository(User).update(testUser.id, { totalPoints: 150 });

      const results = await Promise.allSettled([
        rewardService.redeem(testUser.id, testReward.id),
        rewardService.redeem(testUser.id, testReward.id),
      ]);

      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);

      const user = await testDataSource.getRepository(User).findOne({ where: { id: testUser.id } });
      expect(user?.totalPoints).toBe(50);
    });
  });

  describe('getHistory', () => {
    it('should return user redemption history', async () => {
      await rewardService.redeem(testUser.id, testReward.id);
      const history = await rewardService.getHistory(testUser.id);

      expect(history).toHaveLength(1);
      expect(history[0].pointsSpent).toBe(100);
    });

    it('should return empty array if no redemptions', async () => {
      const history = await rewardService.getHistory(testUser.id);
      expect(history).toHaveLength(0);
    });
  });
});
