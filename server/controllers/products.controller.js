const logger = require('../utils/logger');
const path=require('path');
const skuJson=require('../controllers/sku.json');
const valkeyClient = require('../config/valkey');
const chalk=require('chalk');
const fetchProductsWithVariants=require('../utils/fetchmarketplaceprice');
const {fetchTotalProductsCount,calculateAverageProductPrice,getTopSellingProducts,getTopSellingProducts24h,getTopCategories,getTopCategories24h,getLeastSellingProducts,getLeastSellingProducts24h,getMostReturnedProducts} = require('../utils/fetchOverallProductMetric');
const {fetchAllProducts} = require('../utils/fetchDataFromShopify');
const {fetchListingImageAndDescriptionById} = require('../utils/fetchDataFromShopify');
const queryForBigQuery = require('../config/bigquery');
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
      const { productSlug } = req.params; //product Id referes to slug of the product
      const product=skuJson.find(p=>p.MasterSKU===productSlug);
      const productId=product.productId;
    
      const {imageUrl,description}=await fetchListingImageAndDescriptionById(productId);

        const query=`SELECT 
        COUNT(DISTINCT(li.ORDER_ID)) AS total_orders,
        SUM(li.CURRENT_QUANTITY) AS total_quantity_sold,
        SUM(li.CURRENT_QUANTITY * (li.PRICE - COALESCE(li.DISCOUNT_ALLOCATION_AMOUNT, 0))) AS total_sales,
        COUNT(DISTINCT(CASE 
            WHEN CONTAINS_SUBSTR(CAST(o.ID AS STRING), 'EX') 
                 OR CONTAINS_SUBSTR(UPPER(COALESCE(o.TAGS, '')), 'EXCHANGE') 
            THEN li.ORDER_ID 
        END)) AS exchange_orders_count
    FROM \`analytics-dashboard-459607.analytics.line_items\` li
    LEFT JOIN \`analytics-dashboard-459607.analytics.orders\` o
    ON li.ORDER_ID = o.ID
    WHERE li.SKU IN ('${product.variants.map(v=>v.variantSkus.map(s=>s.variant_sku)).join("','")}')
        AND li.QUANTITY IS NOT NULL
        AND li.PRICE IS NOT NULL`;
       
        console.log('query',query);
      
      const fetchOverviewData=await queryForBigQuery(query);
      console.log('response',fetchOverviewData);

      const mockData = {
        product: {
          id: 1,
          name: product.itemName,
          image: imageUrl,
          description: description,
          sku: 'PH-001',
          price: 12999,
          costPrice: 8000,
        },
       overview: {
          totalOrders: fetchOverviewData[0].total_orders,
          totalSales: (fetchOverviewData[0].total_sales) * (1+(product.tax/100)),
          aov: ((fetchOverviewData[0].total_sales) * (1+(product.tax/100)))/(fetchOverviewData[0].total_quantity_sold-fetchOverviewData[0].exchange_orders_count),
          //
          quantitySold: fetchOverviewData[0].total_quantity_sold,
          grossProfit: 6249500,
          profitMargin: 40,
          refundRate:  5.2,
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