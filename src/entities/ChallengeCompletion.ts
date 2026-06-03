import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';

import { User } from './User';
import { Challenge } from './Challenge';

@Entity('challenge_completions')
export class ChallengeCompletion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.challengeCompletions)
    user!: User;

    @ManyToOne(() => Challenge, (challenge) => challenge.completions)
    challenge!: Challenge;

    @Column()
    pointsEarned!: number;

    @Column('float')
    listenPercentage!: number;

    @CreateDateColumn()
    createdAt!: Date;
}