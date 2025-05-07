const Redis = require('ioredis');
const logger = require('../utils/logger');

// Initialize Valkey client with connection details
const valkeyClient = new Redis({
  host: process.env.VALKEY_HOST || 'localhost',
  port: process.env.VALKEY_PORT || 6379,
  password: process.env.VALKEY_PASSWORD || '',
  // Optional configurations
  connectTimeout: 10000,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Connection event handlers
valkeyClient.on('connect', () => {
  logger.info('Connected to Valkey server');
});

valkeyClient.on('error', (err) => {
  logger.error('Valkey connection error:', err);
});

module.exports = valkeyClient;