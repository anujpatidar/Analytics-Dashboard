const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');


router.get('/get-all-products', productsController.getAllProductsList);
router.get('/get-product-by-id/:productId', productsController.getProductById);
router.get('/get-marketplace-prices', productsController.getMarketplacePrices);
module.exports = router; 