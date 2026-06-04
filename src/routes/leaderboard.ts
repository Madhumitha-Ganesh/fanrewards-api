import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { LeaderboardService } from '../services/LeaderboardService';

const svc = new LeaderboardService();

export default async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', {
    schema: {
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const { page, limit } = request.query as { page: number; limit: number };
    const result = await svc.getTopFans(page, limit);
    return reply.send(result);
  });

  fastify.get('/me', { schema: { security: [{ bearerAuth: [] }] } }, async (request, reply) => {
    try {
      const result = await svc.getUserRank(request.user!.userId);
      return reply.send({ data: result });
    } catch (e: any) {
      return reply.status(404).send({ error: { code: e.message, message: e.message } });
    }
  });
}
