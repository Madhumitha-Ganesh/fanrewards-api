module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000,
  setupFiles: ['<rootDir>/tests/env.ts'],
  moduleNameMapper: {
    '@fastify/swagger-ui': '<rootDir>/tests/__mocks__/swagger-ui.ts',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/app.ts',
    '!src/seed.ts',
    '!src/types/**',
    '!src/migrations/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
