// Implement AuthService
// - register: create user, return tokens
// - login: verify credentials, return tokens
// - refresh: validate refresh token, issue new token pair
// - logout: invalidate refresh token
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { dataSource } from '../plugins/db';
import { User } from '../entities/User';
import { config } from '../config';
import { DataSource } from 'typeorm';

export class AuthService {
    private dataSource: DataSource;

    constructor(ds?: DataSource) {
        this.dataSource = ds || dataSource;
    }

    private get userRepository() {
        return this.dataSource.getRepository(User);
    }

    async register(
        email: string,
        password: string,
        displayName: string
    ) {
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = this.userRepository.create({
            email,
            passwordHash,
            displayName,
            totalPoints: 0,
        });

        await this.userRepository.save(user);

        return this.generateTokens(user);
    }

    async login(email: string, password: string) {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new Error('INVALID_CREDENTIALS');
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
            // bonus: account lockout - return 423 in route
            throw new Error('ACCOUNT_LOCKED');
        }

        const validPassword = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!validPassword) {
            // bonus: track failed attempts, lock after 5 for 15 mins
            const attempts = user.failedLoginAttempts + 1;
            const update: Partial<User> = { failedLoginAttempts: attempts };
            if (attempts >= 5) {
                update.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
            await this.userRepository.update(user.id, update);
            throw new Error('INVALID_CREDENTIALS');
        }

        await this.userRepository.update(user.id, { failedLoginAttempts: 0, lockedUntil: null });
        return this.generateTokens(user);
    }

    async refresh(refreshToken: string) {
        const payload = jwt.verify(
            refreshToken,
            config.jwt.refreshSecret
        ) as { userId: string };

        const user = await this.userRepository.findOne({
            where: { id: payload.userId },
        });

        if (!user || user.refreshToken !== refreshToken) {
            // bonus:Enhanced Security: token rotation - validate stored token on refresh
            throw new Error('INVALID_REFRESH_TOKEN');
        }

        return this.generateTokens(user);
    }

    async logout(refreshToken: string) {
        // bonus: Enhanced Security: real logout - invalidate refresh token in DB
        const payload = jwt.verify(
            refreshToken,
            config.jwt.refreshSecret
        ) as { userId: string };
        await this.userRepository.update(payload.userId, { refreshToken: null });
        return { success: true };
    }

    private async generateTokens(user: User) {
        const accessToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            config.jwt.accessSecret,
            {
                expiresIn: '15m',
            }
        );

        const refreshToken = jwt.sign(
            {
                userId: user.id,
                jti: Math.random().toString(36).slice(2),
            },
            config.jwt.refreshSecret,
            {
                expiresIn: '7d',
            }
        );

        await this.userRepository.update(user.id, { refreshToken });
        // bonus:Enhanced Security: token rotation - store new refresh token, old one is invalidated

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                totalPoints: user.totalPoints,
                createdAt: user.createdAt,
            },
        };
    }
}