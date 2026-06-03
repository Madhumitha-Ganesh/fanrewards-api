// Implement the Challenge entity
// Fields: id (uuid), title, artist, description, points, duration in seconds, difficulty, active status, timestamp
// Relations: a challenge has many completions
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';

import { ChallengeCompletion } from './ChallengeCompletion';

export type Difficulty = 'easy' | 'medium' | 'hard';

@Entity('challenges')
export class Challenge {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string;

    @Column()
    artist!: string;

    @Column('text')
    description!: string;

    @Column()
    points!: number;

    @Column()
    durationSeconds!: number;

    @Column({
        type: 'enum',
        enum: ['easy', 'medium', 'hard'],
    })
    difficulty!: Difficulty;

    @Column({
        default: true,
    })
    active!: boolean;

    @OneToMany(
        () => ChallengeCompletion,
        (completion: ChallengeCompletion) => completion.challenge
    )
    completions!: ChallengeCompletion[];

    @CreateDateColumn()
    createdAt!: Date;
}