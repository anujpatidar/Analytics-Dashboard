
const logger = require('../utils/logger');
const path=require('path');
const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const valkeyClient = require('../config/valkey');
const chalk=require('chalk');
const fetchProductsWithVariants=require('../utils/fetchmarketplaceprice');

// Configure AWS SDK
// Initialize DynamoDB client with detailed logging
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  //enable for logs down below
  // logger: console 
});

const docClient = DynamoDBDocumentClient.from(client);


const productsController = {

  getAllProductsList: async (req, res, next) => {
    try {
      const cacheKey = 'get_all_products';
      
      // Try to get data from cache first
      const cachedData = await valkeyClient.get(cacheKey);
      
      if (cachedData) {
       console.log(chalk.bgGreen('Cache hit for all products')); 
        return res.status(200).json({ 
          success: true, 
          data: JSON.parse(cachedData),
          fromCache: true 
        });
      }
      
      // If not in cache, fetch from DynamoDB
      console.log(chalk.bgYellow('Cache miss for all products, fetching from DynamoDB'));
      const command = new ScanCommand({
        TableName: "ShopifyProducts-dev",
      });
      
      const response = await docClient.send(command);
      
      // Store in cache permanently (no expiration)
      await valkeyClient.set(cacheKey, JSON.stringify(response.Items));
      
      res.status(200).json({ success: true, data: response.Items });
    } catch (error) {
      logger.error('Error fetching all products:', error);
      next(error);
    }
  },

  getProductById: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const cacheKey = `get_product_by_id:${productId}`;      
      // Try to get data from cache first
      const cachedData = await valkeyClient.get(cacheKey);
      
      if (cachedData) {
        console.log(chalk.bgGreen(`Cache hit for product ${productId}`));
        return res.status(200).json({ 
          success: true, 
          data: JSON.parse(cachedData),
          fromCache: true 
        });
      }
      
      // If not in cache, fetch from DynamoDB
      console.log(chalk.bgYellow(`Cache miss for product ${productId}, fetching from DynamoDB`));
      const command = new GetCommand({
        TableName: "ShopifyProducts-dev",
        Key: { id: productId }
      });
      
      const response = await docClient.send(command);
      
      if (response.Item) {
        // Store in cache permanently (no expiration)
        await valkeyClient.set(cacheKey, JSON.stringify(response.Item));
      }
      
      res.status(200).json({ success: true, data: response.Item });
    } catch (error) {
      console.log(chalk.bgRed(`Error fetching product ${req.params.productId}:`), error);
      next(error);
    }
  },

  getMarketplacePrices: async (req, res, next) => {
    try {
      
      const cacheKey = `get_marketplace_prices`;

      // Try to get data from cache first
      const cachedData = await valkeyClient.get(cacheKey);
      
      if (cachedData) {
        console.log(chalk.bgGreen(`Cache hit for marketplace prices.`));
        return res.status(200).json({ 
          success: true, 
          data: JSON.parse(cachedData),
          fromCache: true 
        });
      }
      
      // If not in cache, fetch from DynamoDB
      console.log(chalk.bgYellow(`Cache miss for marketplace prices .}, fetching from DynamoDB`));
      const products = await fetchProductsWithVariants();

      //store in cache
      await valkeyClient.set(cacheKey, JSON.stringify(products));

      console.log(chalk.bgGreen(`Fetched ${products.length} products with variants`));
      res.status(200).json({ success: true, data: products });
    } catch (error) {
      logger.error('Error fetching marketplace prices:', error);
      next(error);
    }
  }

  

};



module.exports = productsController; 