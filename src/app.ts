import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { randomUUID } from 'crypto';
import { config } from './config';
import dbPlugin from './plugins/db';
import { dataSource } from './plugins/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import challengeRoutes from './routes/challenges';
import rewardRoutes from './routes/rewards';
import leaderboardRoutes from './routes/leaderboard';

const buildApp = async () => {
  const app = Fastify({
    logger: { level: config.logLevel },
    genReqId: () => randomUUID(),
  });

  await app.register(cors, { origin: true });
  await app.register(helmet);
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'FanRewards API',
        description: 'Music fan rewards platform — earn points by completing listening challenges',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  await app.register(dbPlugin);

  app.addHook('onRequest', (request, _reply, done) => {
    request.log.info({ reqId: request.id, method: request.method, url: request.url }, 'incoming request');
    done();
  });

  app.addHook('onResponse', (request, reply, done) => {
    request.log.info({ reqId: request.id, statusCode: reply.statusCode }, 'request complete');
    done();
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(challengeRoutes, { prefix: '/api/challenges' });
  await app.register(rewardRoutes, { prefix: '/api/rewards' });
  await app.register(leaderboardRoutes, { prefix: '/api/leaderboard' });

  app.get('/health', async (_request, reply) => {
    try {
      await dataSource.query('SELECT 1');
      return reply.send({ status: 'ok', db: 'connected' });
    } catch {
      return reply.status(503).send({ status: 'error', db: 'disconnected' });
    }
  });

  return app;
};

const start = async () => {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

export { buildApp };
