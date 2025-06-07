const { isIP } = require('net');
const crypto = require('crypto');
const { initRedis, getRedisClient } = require('./redis.js');

class IPBanner {
  constructor(app, config = {}) {
    this.app = app;
    this.config = {
      prefix: config.prefix || process.env.REDIS_BAN_PREFIX || 'ban:',
      redis: config.redis || {}
    };
    this.client = null;
  }
  
  extractIP(req) {
    const ipSources = [
      req.get('X-Forwarded-For'),
      req.get('X-Real-IP'),
      req.ip,
      req.connection?.remoteAddress
    ];
    
    for (const source of ipSources) {
      if (source) {
        const ip = source.split(',')[0].trim();
        if (isIP(ip)) return ip;
      }
    }
    
    return null;
  }
  
  sanitizeIP(ip) {
    if (!ip) throw new Error('Invalid IP');
    
    return crypto
      .createHash('sha256')
      .update(ip)
      .digest('hex');
  }
  
  isBanned() {
    return async (req, res, next) => {
      try {
        const client = this.client || getRedisClient();
        const ip = this.extractIP(req);
        if (!ip) {
          return res.status(403).json({ error: 'Unable to determine client IP' }).end();
        }
        
        const sanitizedIP = this.sanitizeIP(ip);
        const banKey = `${this.config.prefix}${sanitizedIP}`;
        const isBanned = await client.exists(banKey);
        
        if (isBanned) {
          return res.status(403)
            .set('X-Ban-Type', 'IP')
            .json({ error: 'Access Denied' })
            .end();
        }
        
        next();
      } catch (err) {
        console.error('IP check error:', err);
        next(err);
      }
    };
  }
  
  async initialize() {
    try {
      this.client = await initRedis(this.config.redis);
      this.app.use(this.isBanned());
    } catch (error) {
      console.error('IP Banner Initialization Error:', error);
      throw new Error('Critical: IP Banner Initialization Failed');
    }
  }
  
  async setBanned(ip, duration) {
    const client = this.client || getRedisClient();
    
    if (!isIP(ip)) {
      throw new Error('Invalid IP Address');
    }
    
    const sanitizedIP = this.sanitizeIP(ip);
    const banKey = `${this.config.prefix}${sanitizedIP}`;
    
    try {
      if (duration) {
        await client.set(banKey, '1', { EX: duration, NX: true });
      } else {
        await client.set(banKey, '1');
      }
      console.log(`IP Banned: ${sanitizedIP}`);
    } catch (error) {
      console.error('Ban Implementation Error:', error);
      throw new Error('Failed to ban IP');
    }
  }
  
  async disconnect() {
    await require('./redisClient').disconnectRedis();
    this.client = null;
  }
}

module.exports = IPBanner;