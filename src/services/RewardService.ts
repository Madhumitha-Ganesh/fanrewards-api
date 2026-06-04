import { DataSource } from 'typeorm';
import { dataSource } from '../plugins/db';
import { Reward } from '../entities/Reward';
import { RewardRedemption } from '../entities/RewardRedemption';
import { User } from '../entities/User';

export class RewardService {
  private ds: DataSource;

  constructor(ds?: DataSource) {
    this.ds = ds || dataSource;
  }

  private get rewardRepo() { return this.ds.getRepository(Reward); }
  private get redemptionRepo() { return this.ds.getRepository(RewardRedemption); }

  async list() {
    return this.rewardRepo.find({ where: { available: true } });
  }

  async redeem(userId: string, rewardId: string) {
    return this.ds.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: userId })
        .getOne();

      if (!user) throw new Error('USER_NOT_FOUND');

      const reward = await manager.getRepository(Reward).findOne({ where: { id: rewardId } });
      if (!reward) throw new Error('REWARD_NOT_FOUND');
      if (!reward.available) throw new Error('REWARD_UNAVAILABLE');

      if (user.totalPoints < reward.pointsCost) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      user.totalPoints -= reward.pointsCost;
      await manager.save(user);

      const redemption = manager.create(RewardRedemption, {
        user: { id: userId },
        reward: { id: rewardId },
        pointsSpent: reward.pointsCost,
        status: 'pending',
      });

      return manager.save(redemption);
    });
  }

  async getHistory(userId: string) {
    return this.redemptionRepo.find({
      where: { user: { id: userId } },
      relations: ['reward'],
      order: { createdAt: 'DESC' },
    });
  }
}
