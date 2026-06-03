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
    } catch {
        return reply.status(401).send({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid access token',
            },
        });
    }
}