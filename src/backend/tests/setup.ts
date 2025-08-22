// Global test setup for backend tests

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

/**
 * Jest Test Setup
 * Sistema de Monitoramento de Temperatura
 */

// Jest global imports
import 'jest';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeValidEmail(): R;
      toBeValidTemperature(): R;
    }
  }
}

// Custom matchers for our domain
expect.extend({
  toBeValidDate(received: any) {
    const isValid = received instanceof Date && !isNaN(received.getTime());
    
    return {
      message: () => `Expected ${received} to be a valid Date object`,
      pass: isValid
    };
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = typeof received === 'string' && emailRegex.test(received);
    
    return {
      message: () => `Expected ${received} to be a valid email address`,
      pass: isValid
    };
  },

  toBeValidTemperature(received: number) {
    const isValid = typeof received === 'number' && 
                    !isNaN(received) && 
                    received >= -100 && 
                    received <= 60; // Reasonable temperature range
    
    return {
      message: () => `Expected ${received} to be a valid temperature between -100°C and 60°C`,
      pass: isValid
    };
  }
});

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Global test timeout
jest.setTimeout(10000);

// Global test hooks
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});
