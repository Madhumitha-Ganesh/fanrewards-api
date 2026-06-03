// Implement the User entity
// Fields: id (uuid), email (unique), password hash, total points, display name, timestamps
// Relations: a user has many challenge completions and reward redemptions
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';

import { ChallengeCompletion } from './ChallengeCompletion';
import { RewardRedemption } from './RewardRedemption';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        unique: true,
    })
    email!: string;

    @Column()
    passwordHash!: string;

    @Column({
        default: 0,
    })
    totalPoints!: number;

    @Column()
    displayName!: string;

    @OneToMany(
        () => ChallengeCompletion,
        (completion: ChallengeCompletion) => completion.user
    )
    challengeCompletions!: ChallengeCompletion[];

    @OneToMany(
        () => RewardRedemption,
        (redemption: RewardRedemption) => redemption.user
    )
    rewardRedemptions!: RewardRedemption[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}