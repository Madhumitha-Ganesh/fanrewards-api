import { AuthService } from '../src/services/AuthService';
import { testDataSource, setupTestDB, teardownTestDB, clearDB } from './setup';
import { User } from '../src/entities/User';

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(async () => {
    await setupTestDB();
  }, 30000);

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDB();
    authService = new AuthService(testDataSource);
  });

  describe('register', () => {
    it('should create user and return tokens', async () => {
      const result = await authService.register('test@example.com', 'password123', 'Test User');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.totalPoints).toBe(0);
    });

    it('should throw error on duplicate email', async () => {
      await authService.register('test@example.com', 'password123', 'Test User');

      await expect(
        authService.register('test@example.com', 'password456', 'Another User')
      ).rejects.toThrow('EMAIL_ALREADY_EXISTS');
    });

    it('should hash password before storing', async () => {
      await authService.register('test@example.com', 'password123', 'Test User');

      const user = await testDataSource.getRepository(User).findOne({ where: { email: 'test@example.com' } });
      expect(user?.passwordHash).not.toBe('password123');
      expect(user?.passwordHash).toHaveLength(60);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register('test@example.com', 'password123', 'Test User');
    });

    it('should return tokens on valid credentials', async () => {
      const result = await authService.login('test@example.com', 'password123');

      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw on invalid email', async () => {
      await expect(authService.login('wrong@example.com', 'password123')).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('should throw on invalid password', async () => {
      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        try { await authService.login('test@example.com', 'wrongpassword'); } catch {}
      }
      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow('ACCOUNT_LOCKED');
    });

    it('should reset failed attempts on successful login', async () => {
      try { await authService.login('test@example.com', 'wrongpassword'); } catch {}
      await authService.login('test@example.com', 'password123');

      const user = await testDataSource.getRepository(User).findOne({ where: { email: 'test@example.com' } });
      expect(user?.failedLoginAttempts).toBe(0);
    });
  });

  describe('refresh', () => {
    it('should issue new token pair and rotate token', async () => {
      const { refreshToken } = await authService.register('test@example.com', 'password123', 'Test User');
      const result = await authService.refresh(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).not.toBe(refreshToken);
    });

    it('should throw on invalid refresh token', async () => {
      await expect(authService.refresh('invalid-token')).rejects.toThrow();
    });

    it('should throw if stored token does not match', async () => {
      const { refreshToken } = await authService.register('test@example.com', 'password123', 'Test User');
      await authService.refresh(refreshToken);

      await expect(authService.refresh(refreshToken)).rejects.toThrow('INVALID_REFRESH_TOKEN');
    });
  });

  describe('logout', () => {
    it('should invalidate refresh token', async () => {
      const { refreshToken } = await authService.register('test@example.com', 'password123', 'Test User');
      await authService.logout(refreshToken);

      await expect(authService.refresh(refreshToken)).rejects.toThrow('INVALID_REFRESH_TOKEN');
    });
  });
});
