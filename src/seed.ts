import 'reflect-metadata';
import { dataSource } from './plugins/db';
import { Challenge } from './entities/Challenge';
import { Reward } from './entities/Reward';

const SEED_CHALLENGES = [
  {
    title: 'All Night',
    artist: 'Camo & Krooked',
    description: 'Listen to this drum & bass classic to earn points',
    points: 150,
    durationSeconds: 219,
    difficulty: 'easy' as const,
  },
  {
    title: 'New Forms',
    artist: 'Roni Size',
    description: 'Complete this legendary track for bonus points',
    points: 300,
    durationSeconds: 464,
    difficulty: 'medium' as const,
  },
  {
    title: 'Extended Session',
    artist: 'Camo & Krooked',
    description: 'A longer listening challenge for dedicated fans',
    points: 500,
    durationSeconds: 600,
    difficulty: 'hard' as const,
  },
];

const SEED_REWARDS = [
  {
    name: 'Early Access Pass',
    description: 'Get early access to new features',
    pointsCost: 200,
  },
  {
    name: 'Exclusive Playlist',
    description: 'Unlock a curated artist playlist',
    pointsCost: 500,
  },
  {
    name: 'VIP Fan Badge',
    description: 'Show off your dedication with a VIP badge',
    pointsCost: 1000,
  },
  {
    name: 'Concert Ticket Raffle',
    description: 'Enter a raffle for concert tickets',
    pointsCost: 2500,
  },
];

async function seed() {
  await dataSource.initialize();

  const challengeRepo = dataSource.getRepository(Challenge);
  const rewardRepo = dataSource.getRepository(Reward);

  for (const c of SEED_CHALLENGES) {
    const exists = await challengeRepo.findOne({ where: { title: c.title, artist: c.artist } });
    if (!exists) await challengeRepo.save(challengeRepo.create(c));
  }

  for (const r of SEED_REWARDS) {
    const exists = await rewardRepo.findOne({ where: { name: r.name } });
    if (!exists) await rewardRepo.save(rewardRepo.create(r));
  }

  console.log('Seeding complete');
  await dataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
