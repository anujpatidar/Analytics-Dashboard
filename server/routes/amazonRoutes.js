const express = require('express');
const router = express.Router();
const amazonController = require('../controllers/amazon.controller');

// Get Amazon orders overview metrics
router.get('/overview', amazonController.getAmazonOrdersOverview);

// Get Amazon orders data by time range
router.get('/time-range', amazonController.getAmazonOrdersByTimeRange);

// Get top selling products from Amazon
router.get('/top-selling', amazonController.getAmazonTopSellingProducts);

// Get Amazon returns data
router.get('/returns-data', amazonController.getAmazonReturnsData);

// Get Amazon returns overview
router.get('/returns-overview', amazonController.getAmazonReturnsOverview);

// Get Amazon product metrics by SKU
router.get('/product-metrics/:sku', amazonController.getAmazonProductMetrics);

module.exports = router; 