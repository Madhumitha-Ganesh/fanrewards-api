import { DataSource } from 'typeorm';
import { User } from '../src/entities/User';
import { Challenge } from '../src/entities/Challenge';
import { ChallengeCompletion } from '../src/entities/ChallengeCompletion';
import { Reward } from '../src/entities/Reward';
import { RewardRedemption } from '../src/entities/RewardRedemption';

export const testDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'belong',
  password: 'belong_dev',
  database: 'fan_rewards',
  entities: [User, Challenge, ChallengeCompletion, Reward, RewardRedemption],
  synchronize: false,
  logging: false,
});

export const setupTestDB = async () => {
  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
  }
};

export const teardownTestDB = async () => {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
};

export const clearDB = async () => {
  const entities = testDataSource.entityMetadatas;
  for (const entity of entities) {
    await testDataSource.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
  }
};
