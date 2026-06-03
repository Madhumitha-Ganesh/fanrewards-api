import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { RewardService } from '../services/RewardService';

const svc = new RewardService();

export default async function rewardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', async (_request, reply) => {
    const rewards = await svc.list();
    return reply.send({ data: rewards });
  });

  fastify.get('/history', async (request, reply) => {
    const history = await svc.getHistory(request.user!.userId);
    return reply.send({ data: history });
  });

  fastify.post('/:id/redeem', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const redemption = await svc.redeem(request.user!.userId, id);
      return reply.status(201).send({ data: redemption });
    } catch (e: any) {
      const statusMap: Record<string, number> = {
        REWARD_NOT_FOUND: 404,
        REWARD_UNAVAILABLE: 422,
        INSUFFICIENT_POINTS: 422,
      };
      const status = statusMap[e.message] ?? 400;
      return reply.status(status).send({ error: { code: e.message, message: e.message } });
    }
  });
}
