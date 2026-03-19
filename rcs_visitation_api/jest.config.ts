import type { Config } from 'jest';

const config: Config = {
  preset:          'ts-jest',
  testEnvironment: 'node',
  rootDir:         'src',
  testMatch:       ['**/__tests__/**/*.test.ts'],
  moduleNameMapper:{ '^@/(.*)$': '<rootDir>/$1' },
  collectCoverageFrom: [
    'modules/**/*.service.ts',
    'middleware/**/*.ts',
    'shared/utils/**/*.ts',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 },
  },
  testTimeout: 30000,
  verbose:     true,
};

export default config;
