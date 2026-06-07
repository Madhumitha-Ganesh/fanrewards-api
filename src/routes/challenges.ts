import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { ChallengeService } from '../services/ChallengeService';
import { ChallengeListOptions } from '../types';

const svc = new ChallengeService();

export default async function challengeRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', {
    schema: {
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          active: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { page, limit, difficulty, active } = request.query as ChallengeListOptions;

    const result = await svc.list({ page, limit, difficulty, active });
    return reply.send(result);
  });

  fastify.get('/:id', { schema: { security: [{ bearerAuth: [] }] } }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const challenge = await svc.getById(id);
      return reply.send({ data: challenge });
    } catch (e: any) {
      return reply.status(404).send({ error: { code: e.message, message: 'Challenge not found' } });
    }
  });

  fastify.post('/:id/complete', {
    schema: {
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['listenPercentage'],
        properties: {
          listenPercentage: { type: 'number', minimum: 0, maximum: 100 },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { listenPercentage } = request.body as { listenPercentage: number };

      const result = await svc.complete(request.user!.userId, id, listenPercentage);
      return reply.status(201).send({ data: result });
    } catch (e: any) {
      const status = e.message === 'CHALLENGE_NOT_FOUND' ? 404 : 422;
      return reply.status(status).send({ error: { code: e.message, message: e.message } });
    }
  });
}
