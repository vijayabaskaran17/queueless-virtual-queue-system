const Redis = require('ioredis');

// In-memory fallback cache in case Redis server is offline
class MemoryCache {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    if (this.ttls.has(key) && Date.now() > this.ttls.get(key)) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  async set(key, value, mode, duration) {
    this.store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    if (mode === 'EX' && duration) {
      this.ttls.set(key, Date.now() + duration * 1000);
    }
    return 'OK';
  }

  async del(key) {
    const deleted = this.store.delete(key);
    this.ttls.delete(key);
    return deleted ? 1 : 0;
  }

  async rpush(key, ...values) {
    const list = JSON.parse(this.store.get(key) || '[]');
    list.push(...values);
    this.store.set(key, JSON.stringify(list));
    return list.length;
  }

  async lpop(key) {
    const list = JSON.parse(this.store.get(key) || '[]');
    const item = list.shift() || null;
    this.store.set(key, JSON.stringify(list));
    return item;
  }

  async lrange(key, start, stop) {
    const list = JSON.parse(this.store.get(key) || '[]');
    if (stop === -1) return list.slice(start);
    return list.slice(start, stop + 1);
  }

  async llen(key) {
    const list = JSON.parse(this.store.get(key) || '[]');
    return list.length;
  }

  async flushall() {
    this.store.clear();
    this.ttls.clear();
    return 'OK';
  }
}

let redisClient = null;
const memoryFallback = new MemoryCache();
let useFallback = false;

try {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 2) {
        useFallback = true;
        return null; // Stop reconnecting and use fallback
      }
      return 1000;
    },
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    console.log('[Redis] Connected successfully for high-speed caching & queue operations');
  }).catch((err) => {
    console.warn(`[Redis] Connection notice: ${err.message}. Seamlessly using in-memory high-speed cache.`);
    useFallback = true;
  });

  redisClient.on('error', (err) => {
    if (!useFallback) {
      console.warn(`[Redis] Notice: ${err.message}. Seamlessly using in-memory high-speed cache.`);
      useFallback = true;
    }
  });
} catch (err) {
  console.warn(`[Redis] Init notice: ${err.message}. Using in-memory cache.`);
  useFallback = true;
}

const getClient = () => {
  if (useFallback || !redisClient || redisClient.status !== 'ready') {
    return memoryFallback;
  }
  return redisClient;
};

module.exports = {
  getClient,
  isUsingFallback: () => useFallback,
};
