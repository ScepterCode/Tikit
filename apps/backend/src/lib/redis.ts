// Mock Redis client for development without Redis
const mockRedisClient = {
  isOpen: false,
  async connect() {
    console.log('📝 Using mock Redis client (Redis disabled for development)');
    return Promise.resolve();
  },
  async disconnect() {
    return Promise.resolve();
  },
  async quit() {
    return Promise.resolve();
  },
  async ping() {
    return 'PONG';
  },
  async get(key: string) {
    return null;
  },
  async set(key: string, value: string) {
    return 'OK';
  },
  async setEx(key: string, seconds: number, value: string) {
    return 'OK';
  },
  async del(key: string) {
    return 1;
  },
  async incr(key: string) {
    return 1;
  },
  async expire(key: string, seconds: number) {
    return 1;
  },
  on(event: string, callback: Function) {
    // Mock event listener
  }
};

export default mockRedisClient;
