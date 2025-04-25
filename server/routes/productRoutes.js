const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');


router.get('/get-all-products', productsController.getAllProductsList);
router.get('/get-product-by-id/:productId', productsController.getProductById);
module.exports = router; 