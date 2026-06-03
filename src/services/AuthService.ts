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

export class AuthService {
    private userRepository = dataSource.getRepository(User);

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

        const validPassword = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!validPassword) {
            throw new Error('INVALID_CREDENTIALS');
        }

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

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        return this.generateTokens(user);
    }

    async logout() {
        return { success: true };
    }

    private generateTokens(user: User) {
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
            },
            config.jwt.refreshSecret,
            {
                expiresIn: '7d',
            }
        );

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