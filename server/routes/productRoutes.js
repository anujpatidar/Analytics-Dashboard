const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');


router.get('/get-all-products', productsController.getAllProductsList);
router.get('/get-product-by-id/:productId', productsController.getProductById);
router.get('/get-marketplace-prices', productsController.getMarketplacePrices);
router.get('/get-overall-product-metrics', productsController.getOverallProductMetrics);
router.get('/get-product-metrics-by-id/:productId', productsController.getProductMetricsById);
module.exports = router; 