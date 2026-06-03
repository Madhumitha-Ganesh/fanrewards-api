import { FastifyInstance } from 'fastify';

// TODO: Implement auth routes
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/refresh
// POST /api/auth/logout

import { AuthService } from '../services/AuthService';

const authService = new AuthService();

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, displayName } = request.body as {
        email: string;
        password: string;
        displayName: string;
      };

      const result = await authService.register(
        email,
        password,
        displayName
      );

      return reply.status(201).send({
        data: result,
      });
    } catch (error: any) {
      return reply.status(400).send({
        error: {
          code: error.message,
          message: error.message,
        },
      });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      const result = await authService.login(
        email,
        password
      );

      return reply.send({
        data: result,
      });
    } catch (error: any) {
      return reply.status(401).send({
        error: {
          code: error.message,
          message: error.message,
        },
      });
    }
  });

  // Refresh Token
  fastify.post('/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body as {
        refreshToken: string;
      };

      const result = await authService.refresh(
        refreshToken
      );

      return reply.send({
        data: result,
      });
    } catch (error: any) {
      return reply.status(401).send({
        error: {
          code: error.message,
          message: error.message,
        },
      });
    }
  });

  // Logout
  fastify.post('/logout', async (_request, reply) => {
    await authService.logout();

    return reply.send({
      data: {
        success: true,
      },
    });
  });
}