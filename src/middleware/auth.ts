// Implement auth middleware
// Protect routes by verifying the JWT from the Authorization header
// Attach the authenticated user to the request
import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthPayload {
    userId: string;
    email: string;
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthPayload;
    }
}

export async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return reply.status(401).send({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Missing access token',
                },
            });
        }

        const token = authHeader.replace('Bearer ', '');

        const payload = jwt.verify(
            token,
            config.jwt.accessSecret
        ) as AuthPayload;

        request.user = payload;
    } catch (error) {
        //Handling expired token separately for better error messages
        if (error instanceof jwt.TokenExpiredError) {
            return reply.status(401).send({
                error: { code: 'TOKEN_EXPIRED', message: 'Token expired' },
            });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return reply.status(401).send({
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Token is invalid',
                },
            });
        }

        if (error instanceof jwt.NotBeforeError) {
            return reply.status(401).send({
                error: {
                    code: 'TOKEN_NOT_ACTIVE',
                    message: 'Token not active yet',
                },
            });
        }
        // fallback
        return reply.status(401).send({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication failed',
            },
        });
    }
}