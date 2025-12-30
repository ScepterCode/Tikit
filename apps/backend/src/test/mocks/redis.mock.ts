import { vi } from 'vitest';

// Mock Redis client for testing
const mockRedisData = new Map<string, { value: string; expiry?: number }>();
const mockRedisList = new Map<string, string[]>();

export const mockRedisClient = {
  isOpen: true,
  
  async connect() {
    return Promise.resolve();
  },

  async disconnect() {
    mockRedisData.clear();
    mockRedisList.clear();
    return Promise.resolve();
  },

  async quit() {
    mockRedisData.clear();
    mockRedisList.clear();
    return Promise.resolve();
  },

  async ping() {
    return 'PONG';
  },

  async get(key: string) {
    const data = mockRedisData.get(key);
    if (!data) return null;
    
    // Check if expired
    if (data.expiry && Date.now() > data.expiry) {
      mockRedisData.delete(key);
      return null;
    }
    
    return data.value;
  },

  async set(key: string, value: string) {
    mockRedisData.set(key, { value });
    return 'OK';
  },

  async setEx(key: string, seconds: number, value: string) {
    mockRedisData.set(key, {
      value,
      expiry: Date.now() + seconds * 1000,
    });
    return 'OK';
  },

  async del(key: string) {
    mockRedisData.delete(key);
    mockRedisList.delete(key);
    return 1;
  },

  async incr(key: string) {
    const current = mockRedisData.get(key);
    const newValue = current ? parseInt(current.value) + 1 : 1;
    mockRedisData.set(key, { value: newValue.toString() });
    return newValue;
  },

  async expire(key: string, seconds: number) {
    const data = mockRedisData.get(key);
    if (data) {
      data.expiry = Date.now() + seconds * 1000;
      mockRedisData.set(key, data);
    }
    return 1;
  },

  async ttl(key: string) {
    const data = mockRedisData.get(key);
    if (!data || !data.expiry) return -1;
    
    const remaining = Math.ceil((data.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  },

  async flushDb() {
    mockRedisData.clear();
    mockRedisList.clear();
    return 'OK';
  },

  async lPush(key: string, value: string) {
    const list = mockRedisList.get(key) || [];
    list.unshift(value);
    mockRedisList.set(key, list);
    return list.length;
  },

  async lLen(key: string) {
    const list = mockRedisList.get(key) || [];
    return list.length;
  },

  async lRange(key: string, start: number, stop: number) {
    const list = mockRedisList.get(key) || [];
    return list.slice(start, stop + 1);
  },
};

export default mockRedisClient;
