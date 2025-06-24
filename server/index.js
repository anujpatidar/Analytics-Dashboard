require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const Redis=require('ioredis');
const errorHandler = require('./middleware/errorHandler');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const metaAdsRoutes = require('./routes/metaAdsRoutes');
const googleAdsRoutes = require('./routes/googleAdsRoutes');
const sku=require('./controllers/sku.json');

const app = express();

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

valkeyClient.on('connect', () => {
  logger.info('Connected to Valkey server');
});

valkeyClient.on('error', (err) => {
  logger.error('Valkey connection error:', err);
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
//all origins for cors
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/meta-ads', metaAdsRoutes);
app.use('/api/v1/google-ads', googleAdsRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
}); 



