const { getClient } = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes default

class CacheService {
  constructor() {
    this.client = getClient();
  }

  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn(`[Cache Error] get(${key}):`, err.message);
      return null;
    }
  }

  async set(key, value, ttl = CACHE_TTL) {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (err) {
      console.warn(`[Cache Error] set(${key}):`, err.message);
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      console.warn(`[Cache Error] del(${key}):`, err.message);
      return false;
    }
  }

  async invalidateServiceQueue(serviceId) {
    await this.del(`service_queue:${serviceId}`);
    await this.del(`admin_overview`);
  }
}

module.exports = new CacheService();
