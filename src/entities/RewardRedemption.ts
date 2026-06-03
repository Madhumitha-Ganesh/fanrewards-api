import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';

import { User } from './User';
import { Reward } from './Reward';

export type RedemptionStatus =
    | 'pending'
    | 'fulfilled'
    | 'cancelled';

@Entity('reward_redemptions')
export class RewardRedemption {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.rewardRedemptions)
    user!: User;

    @ManyToOne(() => Reward, (reward) => reward.redemptions)
    reward!: Reward;

    @Column()
    pointsSpent!: number;

    @Column({
        type: 'enum',
        enum: ['pending', 'fulfilled', 'cancelled'],
        default: 'pending',
    })
    status!: RedemptionStatus;

    @CreateDateColumn()
    createdAt!: Date;
}