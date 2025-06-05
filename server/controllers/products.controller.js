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
        SUM(li.CURRENT_QUANTITY * li.PRICE) - SUM(COALESCE(li.DISCOUNT_ALLOCATION_AMOUNT, 0)) AS total_sales,
        COUNT(DISTINCT(CASE 
        WHEN UPPER(COALESCE(li.ORDER_NAME, '')) LIKE '%EX%' 
             OR UPPER(COALESCE(o.TAGS, '')) LIKE '%EXCHANGE%' 
        THEN li.ORDER_ID 
        ELSE NULL
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


      const query2=`WITH product_orders AS (
  SELECT DISTINCT
    o.CUSTOMER_ID,
    o.NAME as order_name,
    o.PROCESSED_AT,
    o.CURRENT_TOTAL_PRICE
  FROM \`analytics-dashboard-459607.analytics.orders\` o
  INNER JOIN \`analytics-dashboard-459607.analytics.line_items\` li ON CAST(o.ID AS STRING) = CAST(li.ORDER_ID AS STRING)
  WHERE o.CUSTOMER_ID IS NOT NULL
    AND li.SKU IN ('${product.variants.map(v=>v.variantSkus.map(s=>s.variant_sku)).join("','")}')
),

customer_order_counts AS (
  SELECT 
    CUSTOMER_ID,
    COUNT(DISTINCT order_name) as total_orders,
    SUM(CURRENT_TOTAL_PRICE) as total_spent
  FROM product_orders
  GROUP BY CUSTOMER_ID
),

customer_segments AS (
  SELECT 
    CUSTOMER_ID,
    total_orders,
    total_spent,
    CASE 
      WHEN total_spent >= 5000 THEN 'High Value'
      WHEN total_spent >= 3000 THEN 'Medium Value'
      ELSE 'Low Value'
    END as value_segment,
    CASE 
      WHEN total_orders = 1 THEN '1 Order'
      WHEN total_orders = 2 THEN '2 Orders'
      WHEN total_orders = 3 THEN '3 Orders'
      WHEN total_orders >= 4 THEN '4+ Orders'
    END as order_frequency_segment
  FROM customer_order_counts
)

-- Main metrics
SELECT 
  'MAIN_METRICS' as metric_type,
  COUNT(DISTINCT CUSTOMER_ID) as total_customers,
  COUNT(DISTINCT CASE WHEN total_orders >= 2 THEN CUSTOMER_ID END) as repeat_customers,
  ROUND(
    (COUNT(DISTINCT CASE WHEN total_orders >= 2 THEN CUSTOMER_ID END) * 100.0) / 
    COUNT(DISTINCT CUSTOMER_ID), 2
  ) as repeat_customer_rate_percentage,
  ROUND(AVG(total_orders), 2) as avg_orders_per_customer,
  COUNT(DISTINCT CASE WHEN total_orders = 1 THEN CUSTOMER_ID END) as first_time_customers,
  NULL as segment_name,
  NULL as segment_count,
  NULL as segment_percentage
FROM customer_segments

UNION ALL

-- Value segment breakdown
SELECT 
  'VALUE_SEGMENTS' as metric_type,
  NULL as total_customers,
  NULL as repeat_customers,
  NULL as repeat_customer_rate_percentage,
  NULL as avg_orders_per_customer,
  NULL as first_time_customers,
  value_segment as segment_name,
  COUNT(DISTINCT CUSTOMER_ID) as segment_count,
  ROUND(
    (COUNT(DISTINCT CUSTOMER_ID) * 100.0) / 
    (SELECT COUNT(DISTINCT CUSTOMER_ID) FROM customer_segments), 2
  ) as segment_percentage
FROM customer_segments
GROUP BY value_segment

UNION ALL

-- Purchase frequency distribution
SELECT 
  'FREQUENCY_DISTRIBUTION' as metric_type,
  NULL as total_customers,
  NULL as repeat_customers,
  NULL as repeat_customer_rate_percentage,
  NULL as avg_orders_per_customer,
  NULL as first_time_customers,
  order_frequency_segment as segment_name,
  COUNT(DISTINCT CUSTOMER_ID) as segment_count,
  ROUND(
    (COUNT(DISTINCT CUSTOMER_ID) * 100.0) / 
    (SELECT COUNT(DISTINCT CUSTOMER_ID) FROM customer_segments), 2
  ) as segment_percentage
FROM customer_segments
GROUP BY order_frequency_segment

ORDER BY 
  CASE 
    WHEN metric_type = 'MAIN_METRICS' THEN 1
    WHEN metric_type = 'VALUE_SEGMENTS' THEN 2
    WHEN metric_type = 'FREQUENCY_DISTRIBUTION' THEN 3
  END,
  segment_name;`;

      const fetchCustomerInsights=await queryForBigQuery(query2);
      console.log('fetchCustomerInsights',fetchCustomerInsights);


      const query3=`SELECT 
  VARIANT_TITLE,
  
  -- Core metrics you requested
  SUM(CURRENT_QUANTITY) as total_units_sold,
  ROUND(SUM((QUANTITY * PRICE) - COALESCE(DISCOUNT_ALLOCATION_AMOUNT, 0)), 2) as total_sales_amount,
  
  -- Performance share
  ROUND(
    (SUM(QUANTITY) * 100.0) / SUM(SUM(QUANTITY)) OVER(), 2
  ) as units_sold_percentage,
  

FROM \`analytics-dashboard-459607.analytics.line_items\` 
WHERE SKU IN ('${product.variants.map(v=>v.variantSkus.map(s=>s.variant_sku)).join("','")}') 
GROUP BY VARIANT_TITLE
ORDER BY total_sales_amount DESC;`

      const fetchVariantInsights=await queryForBigQuery(query3);
      console.log('fetchVariantInsights',fetchVariantInsights);
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
          totalSales: (fetchOverviewData[0].total_sales),
          aov: ((fetchOverviewData[0].total_sales))/(fetchOverviewData[0].total_quantity_sold),
          //
          quantitySold: fetchOverviewData[0].total_quantity_sold,
          grossProfit: "to be calculated",
          profitMargin: 0,
          refundRate: (fetchOverviewData[0].exchange_orders_count/fetchOverviewData[0].total_orders)*100,
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
          totalCustomers: fetchCustomerInsights[0].total_customers,
          repeatCustomers: fetchCustomerInsights[0].repeat_customers,
          repeatCustomerRate: fetchCustomerInsights[0].repeat_customer_rate_percentage,
          avgOrdersPerCustomer: fetchCustomerInsights[0].avg_orders_per_customer,
          firstTimeCustomers: fetchCustomerInsights[0].first_time_customers,
          customerAcquisitionCost: 0,
          highValueCustomers: {
            customerCount: fetchCustomerInsights[1].segment_count,
            customerPercentage: fetchCustomerInsights[1].segment_percentage,
          },
          mediumValueCustomers: {
            customerCount: fetchCustomerInsights[3].segment_count,
            customerPercentage: fetchCustomerInsights[3].segment_percentage,
          },
          lowValueCustomers: {
            customerCount: fetchCustomerInsights[2].segment_count,
            customerPercentage: fetchCustomerInsights[2].segment_percentage,
          },
          frequencyDistribution: {
            oneOrderCustomers: {
              customerCount: fetchCustomerInsights[4].segment_count,
              customerPercentage: fetchCustomerInsights[4].segment_percentage,
            },
            twoOrdersCustomers: {
              customerCount: fetchCustomerInsights[5].segment_count,
              customerPercentage: fetchCustomerInsights[5].segment_percentage,
            },
            threeOrdersCustomers: {
              customerCount: fetchCustomerInsights[6].segment_count,
              customerPercentage: fetchCustomerInsights[6].segment_percentage,
            },
            fourOrdersCustomers: {
              customerCount: fetchCustomerInsights[7].segment_count,
              customerPercentage: fetchCustomerInsights[7].segment_percentage,
            }
          }
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
        variantInsights: fetchVariantInsights,
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