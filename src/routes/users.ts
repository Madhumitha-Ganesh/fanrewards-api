import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { dataSource } from '../plugins/db';
import { User } from '../entities/User';
import { ChallengeCompletion } from '../entities/ChallengeCompletion';
import { RewardRedemption } from '../entities/RewardRedemption';

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/me', async (request, reply) => {
    const user = await dataSource.getRepository(User).findOne({
      where: { id: request.user!.userId },
      select: ['id', 'email', 'displayName', 'totalPoints', 'createdAt', 'updatedAt'],
    });

    if (!user) return reply.status(404).send({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });

    return reply.send({ data: user });
  });

  fastify.patch('/me', {
    schema: {
      body: {
        type: 'object',
        properties: {
          displayName: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { displayName } = request.body as { displayName?: string };
    const repo = dataSource.getRepository(User);

    await repo.update({ id: request.user!.userId }, { displayName });

    const user = await repo.findOne({
      where: { id: request.user!.userId },
      select: ['id', 'email', 'displayName', 'totalPoints', 'createdAt', 'updatedAt'],
    });

    return reply.send({ data: user });
  });

  fastify.get('/me/stats', async (request, reply) => {
    const userId = request.user!.userId;

    const user = await dataSource.getRepository(User).findOne({
      where: { id: userId },
      select: ['totalPoints'],
    });

    const completions = await dataSource.getRepository(ChallengeCompletion).count({
      where: { user: { id: userId } },
    });

    const redemptions = await dataSource.getRepository(RewardRedemption).count({
      where: { user: { id: userId } },
    });

    return reply.send({
      data: {
        totalPoints: user?.totalPoints ?? 0,
        totalCompletions: completions,
        totalRedemptions: redemptions,
      },
    });
  });
}
