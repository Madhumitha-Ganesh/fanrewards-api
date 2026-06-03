import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';
import { config } from '../config';

import { User } from '../entities/User';
import { Challenge } from '../entities/Challenge';
import { ChallengeCompletion } from '../entities/ChallengeCompletion';
import { Reward } from '../entities/Reward';
import { RewardRedemption } from '../entities/RewardRedemption';

const dataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,

  entities: [
    User,
    Challenge,
    ChallengeCompletion,
    Reward,
    RewardRedemption,
  ],

  migrations: ['src/migrations/*.ts'],

  synchronize: false,
  logging: false,
});

export { dataSource };

const dbPlugin = fp(async (app: FastifyInstance) => {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      app.log.info('Database connected successfully');
    }

    app.decorate('db', dataSource);

    app.addHook('onClose', async () => {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    });
  } catch (error) {
    app.log.error(error);
    throw error;
  }
});

export default dbPlugin;