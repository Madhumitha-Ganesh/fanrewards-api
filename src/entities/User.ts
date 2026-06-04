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

    @Column({ unique: true })
    email!: string;

    @Column()
    passwordHash!: string;

    @Column({ default: 0 })
    totalPoints!: number;

    @Column()
    displayName!: string;

    @Column({ nullable: true, type: 'text' })
    refreshToken!: string | null;

    @Column({ default: 0 })
    failedLoginAttempts!: number;

    @Column({ nullable: true, type: 'timestamptz' })
    lockedUntil!: Date | null;

    @OneToMany(() => ChallengeCompletion, (c) => c.user)
    challengeCompletions!: ChallengeCompletion[];

    @OneToMany(() => RewardRedemption, (r) => r.user)
    rewardRedemptions!: RewardRedemption[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}