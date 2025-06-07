require('dotenv').config()


const { createClient } = require('redis');

let redisClient = null;

async function initRedis(config = {}) {
  if (redisClient) return redisClient;
  
  const url =
    config.url ||
    process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || 
    'localhost'}:${process.env.REDIS_PORT || 6379}`;
  
  redisClient = createClient({
    url,
    username: config.username || 'default',
    password: config.password || process.env.REDIS_PASSWORD,
    database: config.database || process.env.REDIS_DATABASE || 0
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });
  
  await redisClient.connect();
  console.log('🔒 Redis connected');
  return redisClient;
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return redisClient;
}

async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

module.exports = {
  initRedis,
  getRedisClient,
  disconnectRedis
};