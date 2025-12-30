import { beforeAll, afterAll, vi } from 'vitest';
import dotenv from 'dotenv';
import { mockRedisClient } from './mocks/redis.mock.js';

// Load environment variables from .env.test file for testing
dotenv.config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Mock Redis with stateful implementation
vi.mock('../lib/redis.js', () => {
  return {
    default: mockRedisClient,
  };
});

// Mock Africa's Talking
vi.mock('../lib/africastalking.js', () => {
  return {
    sms: {
      send: vi.fn().mockResolvedValue({
        SMSMessageData: {
          Message: 'Sent to 1/1 Total Cost: NGN 0.0000',
          Recipients: [{ statusCode: 101, number: '+234XXXXXXXXXX', status: 'Success', cost: 'NGN 0.0000', messageId: 'test-id' }],
        },
      }),
    },
    default: {},
  };
});

beforeAll(async () => {
  // Setup test environment
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test environment
  console.log('Cleaning up test environment...');
});
