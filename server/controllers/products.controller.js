const logger = require('../utils/logger');
const path=require('path');

const valkeyClient = require('../config/valkey');
const chalk=require('chalk');
const fetchProductsWithVariants=require('../utils/fetchmarketplaceprice');
const {fetchTotalProductsCount,calculateAverageProductPrice,getTopSellingProducts,getTopSellingProducts24h,getTopCategories,getTopCategories24h,getLeastSellingProducts,getLeastSellingProducts24h,getMostReturnedProducts} = require('../utils/fetchOverallProductMetric');
const {fetchAllProducts} = require('../utils/fetchDataFromShopify');


const productsController = {
  getAllProductsList: async (req, res, next) => {
    try {
      // const cacheKey = 'get_all_products';
      // // Try to get data from cache first
      // const cachedData = await valkeyClient.get(cacheKey);
      // if (cachedData) {
      //  console.log(chalk.bgGreen('Cache hit for all products'));
      //   return res.status(200).json({
      //     success: true,
      //     data: JSON.parse(cachedData),
      //     fromCache: true
      //   });
      // }
      // // If not in cache, fetch from DynamoDB
      // console.log(chalk.bgYellow('Cache miss for all products, fetching from DynamoDB'));
      // const command = new ScanCommand({
      //   TableName: "ShopifyProducts-dev",
      // });
      // const response = await docClient.send(command);
      // // Store in cache permanently (no expiration)
      // await valkeyClient.set(cacheKey, JSON.stringify(response.Items));
      // res.status(200).json({ success: true, data: response.Items });
      const products = await fetchAllProducts();
      res.status(200).json({ success: true, data: products });
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
      console.log(chalk.bgYellow(`Cache miss for product ${productId},`));
      
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
  },
  getOverallProductMetrics: async (req, res, next) => {
    try {
      const cacheKey = `get_overall_product_metrics`;
      // Try to get data from cache first
      const cachedData = await valkeyClient.get(cacheKey);
      // if (cachedData) {
      //   console.log(chalk.bgGreen(`Cache hit for overall product metrics.`));
      //   return res.status(200).json({
      //     success: true,
      //     data: JSON.parse(cachedData),
      //     fromCache: true
      //   });
      // }

      const mockData = {
        totalProducts: await fetchTotalProductsCount(),
        averageProductPrice: await calculateAverageProductPrice(),
        totalCategories: 16,
        averageReturnRate: 5.6,
        topSellingProducts: await getTopSellingProducts(),
        topSellingProducts24h: await getTopSellingProducts24h(),
        topCategories: await getTopCategories(),
        topCategories24h: await getTopCategories24h(),
        leastSellingProducts: await getLeastSellingProducts(),
        leastSellingProducts24h: await getLeastSellingProducts24h(),
        mostReturnedProducts: await getMostReturnedProducts(),
      };
      //add cache
      await valkeyClient.set(cacheKey, JSON.stringify(mockData));
      res.status(200).json({ success: true, data: mockData });
    } catch (error) {
      logger.error('Error fetching overall product metrics:', error);
      next(error);
    }
  },
  getProductMetricsById: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const mockData = {
        product: {
          id: 1,
          name: 'Premium Wireless Headphones',
          image: 'https://cdn.shopify.com/s/files/1/0553/0419/2034/files/products_4july-03_803b519a-125c-458b-bfab-15f0d0009fb1.jpg?v=1720861559&width=648',
          description: 'High-quality wireless headphones with noise cancellation',
          sku: 'PH-001',
          price: 12999,
          costPrice: 8000,
        },
        overview: {
          totalOrders: 1250,
          totalSales: 15623750,
          aov: 12500,
          quantitySold: 1250,
          grossProfit: 6249500,
          profitMargin: 40,
          refundRate: 5.2,
        },
        salesAndProfit: {
          totalRevenue: 15623750,
          marketingCost: 1250000,
          profitAfterMarketing: 4999500,
          profitPerUnit: 4000,
          costPricePerUnit: 8000,
          returnUnits: 65,
          returnRate: 5.2,
        },
        customerInsights: {
          repeatCustomerRate: 35,
          customerBreakdown: [
            { name: 'First-time', value: 65 },
            { name: 'Returning', value: 35 },
          ],
        },
        variants: [
          { name: 'Black', soldCount: 500, profit: 2000000 },
          { name: 'White', soldCount: 450, profit: 1800000 },
          { name: 'Blue', soldCount: 300, profit: 1200000 },
        ],
        salesTrend: [
          { date: 'Jan', sales: 1200000 },
          { date: 'Feb', sales: 1500000 },
          { date: 'Mar', sales: 1800000 },
          { date: 'Apr', sales: 1600000 },
          { date: 'May', sales: 2000000 },
          { date: 'Jun', sales: 2200000 },
        ],
        refundsOverTime: [
          { date: 'Jan', refunds: 5 },
          { date: 'Feb', refunds: 8 },
          { date: 'Mar', refunds: 6 },
          { date: 'Apr', refunds: 7 },
          { date: 'May', refunds: 4 },
          { date: 'Jun', refunds: 3 },
        ],
        profitVsMarketing: [
          { date: 'Jan', profit: 1200000, marketing: 200000 },
          { date: 'Feb', profit: 1500000, marketing: 250000 },
          { date: 'Mar', profit: 1800000, marketing: 300000 },
          { date: 'Apr', profit: 1600000, marketing: 200000 },
          { date: 'May', profit: 2000000, marketing: 250000 },
          { date: 'Jun', profit: 2200000, marketing: 300000 },
        ],
      };
      res.status(200).json({ success: true, data: mockData });
    } catch (error) {
      logger.error('Error fetching product metrics:', error);
      next(error);
    }
  },
  clearAndUpdateCache: async (req, res, next) => {
    try {
      // Clear all product-related cache keys
      const cacheKeys = [
        'get_all_products',
        'get_marketplace_prices',
        'get_overall_product_metrics'
      ];
      
      for (const key of cacheKeys) {
        await valkeyClient.del(key);
      }
      
      // Fetch fresh data to update cache
      await productsController.getAllProductsList(req, res, next);
      await productsController.getMarketplacePrices(req, res, next);
      await productsController.getOverallProductMetrics(req, res, next);
      
      res.status(200).json({ 
        success: true, 
        message: 'Cache cleared and updated successfully' 
      });
    } catch (error) {
      logger.error('Error clearing and updating cache:', error);
      next(error);
    }
  }
};
module.exports = productsController;