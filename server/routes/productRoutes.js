const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');


router.post('/get-products', productsController.getProductList);

module.exports = router; 