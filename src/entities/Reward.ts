import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from 'typeorm';

import { RewardRedemption } from './RewardRedemption';

@Entity('rewards')
export class Reward {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column('text')
    description!: string;

    @Column()
    pointsCost!: number;

    @Column({ default: true })
    available!: boolean;

    @OneToMany(
        () => RewardRedemption,
        (redemption) => redemption.reward
    )
    redemptions!: RewardRedemption[];
}