import { DataSource } from 'typeorm';
import { dataSource } from '../plugins/db';
import { User } from '../entities/User';

export class LeaderboardService {
  private ds: DataSource;

  constructor(ds?: DataSource) {
    this.ds = ds || dataSource;
  }

  private get userRepo() { return this.ds.getRepository(User); }

  async getTopFans(page: number, limit: number) {
    const [users, total] = await this.userRepo.findAndCount({
      select: ['id', 'displayName', 'totalPoints'],
      order: { totalPoints: 'DESC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const offset = (page - 1) * limit;
    const data = users.map((u, i) => ({
      rank: offset + i + 1,
      userId: u.id,
      displayName: u.displayName,
      totalPoints: u.totalPoints,
    }));

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getUserRank(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'displayName', 'totalPoints', 'createdAt'],
    });

    if (!user) throw new Error('USER_NOT_FOUND');

    const rank = await this.userRepo
      .createQueryBuilder('u')
      .where('u.totalPoints > :points OR (u.totalPoints = :points AND u.createdAt < :createdAt)', {
        points: user.totalPoints,
        createdAt: (user as any).createdAt,
      })
      .getCount();

    return {
      rank: rank + 1,
      userId: user.id,
      displayName: user.displayName,
      totalPoints: user.totalPoints,
    };
  }
}
