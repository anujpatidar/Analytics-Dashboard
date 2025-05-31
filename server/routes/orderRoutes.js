const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');

// Get orders overview metrics
router.get('/overview', ordersController.getOrdersOverview);

// Get orders data by time range
router.get('/time-range', ordersController.getOrdersByTimeRange);

// Get top selling products
router.get('/top-selling', ordersController.getTopSellingProducts);

// Get refund metrics
router.get('/refund-metrics', ordersController.getRefundMetrics);

module.exports = router; 