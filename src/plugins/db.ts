import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';

import { User } from '../entities/User';
import { Challenge } from '../entities/Challenge';
import { ChallengeCompletion } from '../entities/ChallengeCompletion';
import { Reward } from '../entities/Reward';
import { RewardRedemption } from '../entities/RewardRedemption';

const createDataSource = () => new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'belong',
  password: process.env.DB_PASSWORD || 'belong_dev',
  database: process.env.DB_DATABASE || 'fan_rewards',
  entities: [User, Challenge, ChallengeCompletion, Reward, RewardRedemption],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});

let _dataSource: DataSource | null = null;

export const getDataSource = () => {
  if (!_dataSource) {
    _dataSource = createDataSource();
  }
  return _dataSource;
};

// keep named export for backwards compat — resolves lazily on first access
export const dataSource = new Proxy({} as DataSource, {
  get(_target, prop) {
    return (getDataSource() as any)[prop];
  },
});

const dbPlugin = fp(async (app: FastifyInstance) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) {
      await ds.initialize();
      app.log.info('Database connected successfully');
    }

    app.decorate('db', ds);

    app.addHook('onClose', async () => {
      if (ds.isInitialized) {
        await ds.destroy();
        _dataSource = null;
      }
    });
  } catch (error) {
    app.log.error(error);
    throw error;
  }
});

export default dbPlugin;
