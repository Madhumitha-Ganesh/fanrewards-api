import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config';
import dbPlugin from './plugins/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import challengeRoutes from './routes/challenges';
import rewardRoutes from './routes/rewards';
import leaderboardRoutes from './routes/leaderboard';

const buildApp = async () => {
  const app = Fastify({ logger: { level: config.logLevel } });

  await app.register(cors, { origin: true });
  await app.register(helmet);
  await app.register(dbPlugin);

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(challengeRoutes, { prefix: '/api/challenges' });
  await app.register(rewardRoutes, { prefix: '/api/rewards' });
  await app.register(leaderboardRoutes, { prefix: '/api/leaderboard' });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
};

const start = async () => {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

export { buildApp };
