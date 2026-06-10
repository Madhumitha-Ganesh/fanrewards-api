import { DataSource } from 'typeorm';
import { dataSource } from '../plugins/db';
import { Challenge } from '../entities/Challenge';
import { ChallengeCompletion } from '../entities/ChallengeCompletion';
import { User } from '../entities/User';
import { ChallengeListOptions, PaginatedResult } from '../types';

export class ChallengeService {
  private ds: DataSource;

  constructor(ds?: DataSource) {
    this.ds = ds || dataSource;
  }

  private get challengeRepo() { return this.ds.getRepository(Challenge); }
  private get userRepo() { return this.ds.getRepository(User); }

  async list(options: ChallengeListOptions): Promise<PaginatedResult<Challenge>> {
    const { page, limit, difficulty, active } = options;

    const qb = this.challengeRepo.createQueryBuilder('c');

    if (difficulty) qb.andWhere('c.difficulty = :difficulty', { difficulty });
    if (active !== undefined) qb.andWhere('c.active = :active', { active });

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('c.createdAt', 'DESC')
      .getManyAndCount();

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const challenge = await this.challengeRepo.findOne({ where: { id } });
    if (!challenge) throw new Error('CHALLENGE_NOT_FOUND');
    return challenge;
  }

  async complete(userId: string, challengeId: string, listenPercentage: number) {
    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
    if (!challenge) throw new Error('CHALLENGE_NOT_FOUND');
    if (!challenge.active) throw new Error('CHALLENGE_INACTIVE');

    const pointsEarned = listenPercentage >= 80
      ? challenge.points
      : Math.floor(challenge.points * (listenPercentage / 100));

    await this.ds.transaction(async (manager) => {
      const completion = manager.create(ChallengeCompletion, {
        user: { id: userId },
        challenge: { id: challengeId },
        listenPercentage,
        pointsEarned,
      });
      await manager.save(completion);
      await manager.increment(User, { id: userId }, 'totalPoints', pointsEarned);
    });

    const user = await this.userRepo.findOne({ where: { id: userId } });
    return { pointsEarned, totalPoints: user!.totalPoints };
  }
}
