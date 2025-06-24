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
const { getDatasetName, executeQuery } = require('../utils/bigquery');
const marketingKeywords = require('./marketingKeywords.json');
const MetaAdsAnalytics = require('../utils/MetaAdsAnalytics');
const productsController = {
  getAllProductsList: async (req, res, next) => {
    try {
      const { store = 'myfrido' } = req.query;
      
      // For non-myfrido stores, return null to let client handle with demo data
      if (store !== 'myfrido') {
        return res.status(200).json({
          success: true,
          data: null,
          store: store,
          message: 'Using demo data for this store'
        });
      }

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
      
      res.status(200).json({
        success: true,
        data: products, store: store,
        total: products.length
      });
    } catch (error) {
      logger.error('Error fetching products list:', error);
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
      const { store = 'myfrido' } = req.query;
      
      // For non-myfrido stores, return null to let client handle with demo data
      if (store !== 'myfrido') {
        return res.status(200).json({
          success: true,
          data: null,
          store: store,
          message: 'Using demo data for this store'
        });
      }

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
      res.status(200).json({ success: true, data: products, store: store });
    } catch (error) {
      logger.error('Error fetching marketplace prices:', error);
      next(error);
    }
  },
  getOverallProductMetrics: async (req, res, next) => {
    try {
      const { store = 'myfrido' } = req.query;
      
      // For non-myfrido stores, return null to let client handle with demo data
      if (store !== 'myfrido') {
        return res.status(200).json({
          success: true,
          data: null,
          store: store,
          message: 'Using demo data for this store'
        });
      }

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
      res.status(200).json({ success: true, data: mockData, store: store });
    } catch (error) {
      logger.error('Error fetching overall product metrics:', error);
      next(error);
    }
  },
  getProductMetricsById: async (req, res, next) => {
    try {
      const { productSlug } = req.params; //product Id referes to slug of the product
      const { startDate, endDate } = req.query; // Get date filter parameters
      
      // Helper function to convert date to UTC with 5:30 offset
      const convertToUTCWithOffset = (dateString, isEndDate = false) => {
        if (!dateString) return null;
        
        try {
          // Parse the input date (assuming YYYY-MM-DD format)
          const [year, month, day] = dateString.split('-').map(Number);
          
          if (!year || !month || !day) {
            throw new Error('Invalid date format');
          }
          
          console.log(`Converting ${dateString} (isEndDate: ${isEndDate})`);
          console.log(`Parsed: year=${year}, month=${month}, day=${day}`);
          
          if (isEndDate) {
            // For end date: same day at 18:29:59 UTC
            // This means the date should be the same as input, but at 18:29:59 UTC
            const date = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));
            console.log(`End date result: ${date.toISOString()}`);
            return date.toISOString();
          } else {
            // For start date: previous day at 18:30:00 UTC
            // First, create the date for the input day
            const inputDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            // Subtract 24 hours to get the previous day
            const previousDay = new Date(inputDate.getTime() - (24 * 60 * 60 * 1000));
            // Set to 18:30:00 UTC
            previousDay.setUTCHours(18, 30, 0, 0);
            console.log(`Start date result: ${previousDay.toISOString()}`);
            return previousDay.toISOString();
          }
        } catch (error) {
          console.error('Error converting date:', error);
          return null;
        }
      };
      
      // Set default date range if not provided (last 30 days)
      const defaultEndDate = new Date().toISOString().split('T')[0];
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const filterStartDate = startDate || defaultStartDate;
      const filterEndDate = endDate || defaultEndDate;
      
      // Convert dates to UTC with offset
      const utcStartDate = convertToUTCWithOffset(filterStartDate, false);
      const utcEndDate = convertToUTCWithOffset(filterEndDate, true);
      
      // Validate converted dates
      if (!utcStartDate || !utcEndDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format provided. Please use YYYY-MM-DD format.' 
        });
      }
      
      console.log(`Original dates: ${filterStartDate} to ${filterEndDate}`);
      console.log(`UTC dates with offset: ${utcStartDate} to ${utcEndDate}`);
      
      // Test case verification
      if (filterStartDate === '2025-06-01' && filterEndDate === '2025-06-15') {
        console.log('=== TEST CASE VERIFICATION ===');
        console.log('Expected start date: 2025-05-31T18:30:00.000Z');
        console.log('Actual start date:   ' + utcStartDate);
        console.log('Expected end date:   2025-06-15T18:29:59.999Z');
        console.log('Actual end date:     ' + utcEndDate);
        console.log('=============================');
      }
      
      // Validate product exists
      const product = skuJson.find(p => p.MasterSKU === productSlug);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product with SKU ${productSlug} not found` 
        });
      }
      
      const productId = product.productId;
    
      // Handle image and description with fallbacks
      let imageUrl = null;
      let description = null;
      try {
        const productDetails = await fetchListingImageAndDescriptionById(productId);
        imageUrl = productDetails.imageUrl || null;
        description = productDetails.description || 'No description available';
      } catch (error) {
        console.log('Error fetching product details:', error.message);
        imageUrl = null;
        description = 'No description available';
      }

      // Get marketing data for this product with date filter - with error handling
      let marketingData = null;
      try {
        marketingData = await getProductMarketingData(product.itemName, filterStartDate, filterEndDate);
      } catch (error) {
        console.log('Error fetching marketing data:', error.message);
        marketingData = {
          campaigns: [],
          totalSpend: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalPurchases: 0,
          totalPurchaseValue: 0,
          averageRoas: 0,
          averageCpc: 0,
          averageCpm: 0,
          averageCtr: 0,
          keyword: null
        };
      }

      // Build variants SKU list with validation
      const variantSkus = product.variants && Array.isArray(product.variants) 
        ? product.variants.flatMap(v => 
            v.variantSkus && Array.isArray(v.variantSkus) 
              ? v.variantSkus
                  .filter(s => s.storeName === 'Shopify') // Only include Shopify SKUs
                  .map(s => s.variant_sku)
                  .filter(Boolean)  
              : []
          ).filter(Boolean)
        : [];

      if (variantSkus.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: `No valid variant SKUs found for product ${productSlug}` 
        });
      }

      // Updated query for nested line_items structure with UTC dates
      const query1=`WITH latest_orders AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY _daton_batch_runtime DESC) as rn
  FROM \`frido-429506.Frido_BigQuery.Frido_Shopify_orders\`
  WHERE created_at >= TIMESTAMP('${utcStartDate}')
    AND created_at <= TIMESTAMP('${utcEndDate}')
),
product_data AS (
  SELECT 
    o.id as order_id,  -- Added order_id here
    item.name as product_name,
    CAST(item.price AS NUMERIC) * item.quantity  as gross_sales_per_item,
    (
     
      (CAST(item.price AS NUMERIC) * item.quantity) - 
      COALESCE((
        SELECT SUM(CAST(disc.amount AS NUMERIC)) 
        FROM UNNEST(item.discount_allocations) as disc
      ), 0)
    ) as total_sales_per_item,
    (
      SELECT SUM(CAST(tax.price AS NUMERIC)) 
      FROM UNNEST(item.tax_lines) as tax
    ) as total_tax_per_item,
    item.quantity as total_items_sold_per_line
  FROM latest_orders o
  CROSS JOIN UNNEST(o.line_items) as item
  WHERE o.rn = 1
    AND item.sku IN ('${variantSkus.join("','")}')
)

SELECT 
  SUM(total_sales_per_item) as total_sales,
  SUM(gross_sales_per_item) as gross_sales,
  SUM(total_tax_per_item) as total_tax,
  CASE 
    WHEN SUM(total_sales_per_item) > 0 THEN SUM(total_tax_per_item) / SUM(total_sales_per_item)
    ELSE 0 
  END as tax_rate,
  SUM(total_items_sold_per_line) as total_items_sold,
  COUNT(DISTINCT order_id) as total_orders,  -- Changed to COUNT(DISTINCT order_id)
  CASE 
    WHEN SUM(total_items_sold_per_line) > 0 THEN SUM(total_sales_per_item) / SUM(total_items_sold_per_line)
    ELSE 0 
  END as average_order_price
FROM product_data;
`

      let overviewData = {};
      try {
        const result = await executeQuery(query1);
        overviewData = result[0] || {};
      } catch (error) {
        console.error('Error fetching overview data:', error.message);
        overviewData = {};
      }

      // Query 2: Customer insights with error handling - using UTC dates
      const query2 = `WITH latest_orders AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY _daton_batch_runtime DESC) as rn
  FROM \`frido-429506.Frido_BigQuery.Frido_Shopify_orders\`
  WHERE created_at >= TIMESTAMP('${utcStartDate}')
    AND created_at <= TIMESTAMP('${utcEndDate}')
),
product_orders AS (
  SELECT DISTINCT
    o.id as order_id,
    o.name as order_name,
    cust.id as customer_id,
    cust.email as customer_email,
    CAST(o.total_price AS NUMERIC) as order_total_value,
    -- Calculate product-specific value for this order
    (
      SELECT SUM(
        (CAST(item.price AS NUMERIC) * item.quantity) - 
        COALESCE((
          SELECT SUM(CAST(disc.amount AS NUMERIC)) 
          FROM UNNEST(item.discount_allocations) as disc
        ), 0)
      )
      FROM UNNEST(o.line_items) as item
      WHERE item.sku IN ('${variantSkus.join("','")}')
    ) as product_specific_value
  FROM latest_orders o
  CROSS JOIN UNNEST(o.customer) as cust
  WHERE o.rn = 1
    AND EXISTS (
      SELECT 1 
      FROM UNNEST(o.line_items) as item
      WHERE item.sku IN ('${variantSkus.join("','")}')
    )
    AND cust.id IS NOT NULL
),
customer_metrics AS (
  SELECT 
    customer_id,
    customer_email,
    COUNT(DISTINCT order_id) as order_count,
    SUM(product_specific_value) as total_product_value,
    AVG(product_specific_value) as avg_order_value
  FROM product_orders
  GROUP BY customer_id, customer_email
),
customer_segments AS (
  SELECT 
    *,
    -- Frequency segments
    CASE 
      WHEN order_count = 1 THEN 'one_order'
      WHEN order_count = 2 THEN 'two_orders' 
      WHEN order_count = 3 THEN 'three_orders'
      WHEN order_count >= 4 THEN 'four_plus_orders'
    END as frequency_segment,
    -- Value segments (you may need to adjust these thresholds)
    CASE 
      WHEN total_product_value >= 7000 THEN 'high_value'
      WHEN total_product_value >= 5000 THEN 'medium_value'
      ELSE 'low_value'
    END as value_segment
  FROM customer_metrics
),
summary_stats AS (
  SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN order_count > 1 THEN 1 END) as repeat_customers,
    COUNT(CASE WHEN order_count = 1 THEN 1 END) as first_time_customers,
    AVG(order_count) as avg_orders_per_customer
  FROM customer_metrics
)

-- Main query combining all insights
SELECT 
  -- Basic customer metrics
  (SELECT total_customers FROM summary_stats) as unique_customers,
  (SELECT repeat_customers FROM summary_stats) as repeat_customers,
  (SELECT repeat_customers * 100.0 / total_customers FROM summary_stats) as repeat_customer_rate,
  (SELECT avg_orders_per_customer FROM summary_stats) as avg_quantity_per_order,
  (SELECT first_time_customers FROM summary_stats) as first_time_customers,
  (SELECT first_time_customers * 100.0 / total_customers FROM summary_stats) as first_time_customer_rate,
  
  -- Value segments
  COUNT(CASE WHEN value_segment = 'high_value' THEN 1 END) as high_value_customer_count,
  COUNT(CASE WHEN value_segment = 'high_value' THEN 1 END) * 100.0 / COUNT(*) as high_value_customer_percentage,
  
  COUNT(CASE WHEN value_segment = 'medium_value' THEN 1 END) as medium_value_customer_count,
  COUNT(CASE WHEN value_segment = 'medium_value' THEN 1 END) * 100.0 / COUNT(*) as medium_value_customer_percentage,
  
  COUNT(CASE WHEN value_segment = 'low_value' THEN 1 END) as low_value_customer_count,
  COUNT(CASE WHEN value_segment = 'low_value' THEN 1 END) * 100.0 / COUNT(*) as low_value_customer_percentage,
  
  -- Frequency distribution
  COUNT(CASE WHEN frequency_segment = 'one_order' THEN 1 END) as one_order_customer_count,
  COUNT(CASE WHEN frequency_segment = 'one_order' THEN 1 END) * 100.0 / COUNT(*) as one_order_customer_percentage,
  
  COUNT(CASE WHEN frequency_segment = 'two_orders' THEN 1 END) as two_orders_customer_count,
  COUNT(CASE WHEN frequency_segment = 'two_orders' THEN 1 END) * 100.0 / COUNT(*) as two_orders_customer_percentage,
  
  COUNT(CASE WHEN frequency_segment = 'three_orders' THEN 1 END) as three_orders_customer_count,
  COUNT(CASE WHEN frequency_segment = 'three_orders' THEN 1 END) * 100.0 / COUNT(*) as three_orders_customer_percentage,
  
  COUNT(CASE WHEN frequency_segment = 'four_plus_orders' THEN 1 END) as four_plus_orders_customer_count,
  COUNT(CASE WHEN frequency_segment = 'four_plus_orders' THEN 1 END) * 100.0 / COUNT(*) as four_plus_orders_customer_percentage

FROM customer_segments`;

      let customerInsights = {};
      try {
        const result2 = await executeQuery(query2);
        customerInsights = result2[0] || {};
        console.log(customerInsights, 'customerInsights');
      } catch (error) {
        console.error('Error fetching customer insights:', error.message);
        customerInsights = {};
      }

      // Create SKU to variant name mapping from sku.json
      const skuToVariantMap = new Map();
      if (product && product.variants && Array.isArray(product.variants)) {
        for (const variant of product.variants) {
          if (variant.variantSkus && Array.isArray(variant.variantSkus)) {
            for (const skuData of variant.variantSkus) {
              if (skuData.storeName === 'Shopify' && skuData.variant_sku) {
                skuToVariantMap.set(skuData.variant_sku, variant.variantName || 'Unknown Variant');
              }
            }
          }
        }
      }

      // Query 3: Variant insights grouped by SKU only - using UTC dates
      const query3 = `WITH latest_orders AS (
                      SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY name ORDER BY _daton_batch_runtime DESC) as rn
                      FROM \`frido-429506.Frido_BigQuery.Frido_Shopify_orders\`
                      WHERE created_at >= TIMESTAMP('${utcStartDate}')
                        AND created_at <= TIMESTAMP('${utcEndDate}')
                    ),
                    variant_data AS (
                      SELECT 
                        item.sku as variant_sku,
                        SUM(item.quantity) as total_units_sold,
                        SUM(
                          (CAST(item.price AS NUMERIC) * item.quantity) - 
                          COALESCE((
                            SELECT SUM(CAST(disc.amount AS NUMERIC)) 
                            FROM UNNEST(item.discount_allocations) as disc
                          ), 0)
                        ) as total_sales_amount
                      FROM latest_orders o
                      CROSS JOIN UNNEST(o.line_items) as item
                      WHERE o.rn = 1
                        AND item.sku IN ('${variantSkus.join("','")}')
                     GROUP BY item.sku
                    )
                    SELECT 
                      variant_sku,
                      total_units_sold,
                      ROUND(total_sales_amount, 2) as total_sales_amount,
                      ROUND(
                        (total_units_sold * 100.0) / NULLIF(SUM(total_units_sold) OVER(), 0), 2
                      ) as units_sold_percentage
                    FROM variant_data
                    ORDER BY total_sales_amount DESC`;

      let fetchVariantInsights = [];
      try {
        const rawVariantData = await executeQuery(query3);
        console.log('Raw variant data:', rawVariantData);
        
        // Process the raw data to map SKUs to variant names and group "Other"
        const mappedVariants = [];
        let otherVariantData = {
          variant_sku: 'OTHER',
          variant_name: 'Other',
          total_units_sold: 0,
          total_sales_amount: 0,
          units_sold_percentage: 0
        };
        
        for (const variantData of rawVariantData) {
          const sku = variantData.variant_sku;
          const variantName = skuToVariantMap.get(sku);
          
          if (variantName) {
            // SKU found in sku.json, use the mapped variant name
            mappedVariants.push({
              variant_sku: sku,
              variant_name: variantName,
              total_units_sold: variantData.total_units_sold,
              total_sales_amount: variantData.total_sales_amount,
              units_sold_percentage: variantData.units_sold_percentage
            });
          } else {
            // SKU not found in sku.json, aggregate into "Other"
            otherVariantData.total_units_sold += parseInt(variantData.total_units_sold) || 0;
            otherVariantData.total_sales_amount += parseFloat(variantData.total_sales_amount) || 0;
          }
        }
        
        // Add "Other" category if it has any data
        if (otherVariantData.total_units_sold > 0) {
          // Calculate percentage for "Other" category
          const totalUnits = mappedVariants.reduce((sum, v) => sum + (parseInt(v.total_units_sold) || 0), 0) + otherVariantData.total_units_sold;
          otherVariantData.units_sold_percentage = totalUnits > 0 ? ((otherVariantData.total_units_sold * 100.0) / totalUnits) : 0;
          
          // Recalculate percentages for all variants including "Other"
          for (const variant of mappedVariants) {
            variant.units_sold_percentage = totalUnits > 0 ? ((parseInt(variant.total_units_sold) * 100.0) / totalUnits) : 0;
          }
          
          mappedVariants.push(otherVariantData);
        }
        
        fetchVariantInsights = mappedVariants.sort((a, b) => (parseFloat(b.total_sales_amount) || 0) - (parseFloat(a.total_sales_amount) || 0));
        console.log('Processed variant insights:', fetchVariantInsights);
      } catch (error) {
        console.error('Error fetching variant insights:', error.message);
        fetchVariantInsights = [];
      }

      /**
       * Calculate total COGS and S&D cost based on variant sales
       * 
       * Logic:
       * 1. For each sold variant SKU, first try to find it in the product's variants list
       * 2. If found, use the variant-specific COGS and S&D costs
       * 3. If not found in variants, fall back to product-level COGS and S&D costs
       * 4. This ensures we can handle cases where new SKUs exist in sales data
       *    but haven't been added to the sku.json variants list yet
       */
      let totalCogs = 0;
      let totalSdCost = 0;

      if (product && fetchVariantInsights.length > 0) {
        // Create a map of SKU -> cost details for quick lookup
        const skuCostMap = new Map();
        
        // First, populate with variant-specific costs if variants exist
        if (product.variants && Array.isArray(product.variants)) {
          for (const variant of product.variants) {
            if (variant.variantSkus && Array.isArray(variant.variantSkus)) {
              for (const skuData of variant.variantSkus) {
                if (skuData.storeName === 'Shopify' && skuData.variant_sku) {
                  skuCostMap.set(skuData.variant_sku, {
                    cogs: variant.cogs || product.cogs || 0,
                    sd: variant['s&d'] || product['s&d'] || 0,
                    source: 'variant'
                  });
                }
              }
            }
          }
        }

        //console skuCostMap
        console.log(skuCostMap,'skuCostMap');

        // Calculate total costs for each sold variant
        for (const variantSold of fetchVariantInsights) {
          const variantSku = variantSold.variant_sku;
          const unitsSold = parseInt(variantSold.total_units_sold) || 0;
          
          // Try to get costs from SKU map (variant-specific)
          let costDetails = skuCostMap.get(variantSku);
          
          // If not found in variants, use product-level costs as fallback
          if (!costDetails) {
            costDetails = {
              cogs: product.cogs || 0,
              sd: product['s&d'] || 0,
              source: 'product-fallback'
            };
            console.log(`Using product-level costs for SKU ${variantSku} (not found in variants)`);
          }
          
          totalCogs += unitsSold * costDetails.cogs;
          totalSdCost += unitsSold * costDetails.sd;
          
          console.log(`SKU: ${variantSku}, Units: ${unitsSold}, COGS: ${costDetails.cogs}, S&D: ${costDetails.sd}, Source: ${costDetails.source}`);
        }
      }

      const totalSales = parseFloat(overviewData.total_sales) || 0;
      const grossSales = parseFloat(overviewData.gross_sales) || 0;
      const totalTax = parseFloat(overviewData.total_tax) || 0;
      const taxRate = parseFloat(overviewData.tax_rate) || 0;
      const totalItemsSold = parseInt(overviewData.total_items_sold) || 0;
      const totalOrders = parseInt(overviewData.total_orders) || 0;
      const averageOrderPrice = parseFloat(overviewData.average_order_price) || 0;

      const cogsPercentage = totalSales > 0 ? (totalCogs / totalSales) * 100 : 0;
      const sdCostPercentage = totalSales > 0 ? (totalSdCost / totalSales) * 100 : 0;

      /**
       * Calculate ROAS and MER metrics
       * 
       * Definitions:
       * - Gross ROAS: Total Sales / Marketing Spend
       * - Net ROAS: (Total Sales - COGS) / Marketing Spend
       * - N-ROAS: (Total Sales - COGS - S&D) / Marketing Spend
       * - Gross MER: (Marketing Spend / Total Sales) * 100
       * - Net MER: (Marketing Spend / (Total Sales - COGS)) * 100
       * - N-MER: (Marketing Spend / (Total Sales - COGS - S&D)) * 100
       */
        const totalMarketingSpend = marketingData ? (marketingData.totalSpend || 0) : 0;
        const netSales = totalSales - totalCogs; // Sales after COGS
        const nSales = totalSales - totalCogs - totalSdCost; // Sales after COGS and S&D

        // ROAS calculations (return on ad spend)
        const grossRoas = totalMarketingSpend > 0 ? totalSales / totalMarketingSpend : 0;
        const netRoas = totalMarketingSpend > 0 ? netSales / totalMarketingSpend : 0;
        const nRoas = totalMarketingSpend > 0 ? nSales / totalMarketingSpend : 0;

              // MER calculations (marketing efficiency ratio as percentage)
      const grossMer = totalSales > 0 ? (totalMarketingSpend / totalSales) * 100 : 0;
      const netMer = netSales > 0 ? (totalMarketingSpend / netSales) * 100 : 0;
      const nMer = nSales > 0 ? (totalMarketingSpend / nSales) * 100 : 0;

      /**
       * Calculate Contribution Margin metrics
       * 
       * Definitions:
       * - CM2: Total Sales - COGS - Marketing Spend (Contribution Margin after variable costs and marketing)
       * - CM2%: (CM2 / Total Sales) * 100
       * - CM3: Total Sales - COGS - S&D - Marketing Spend (Contribution Margin after all variable costs)
       * - CM3%: (CM3 / Total Sales) * 100
       */
      const cm2 = totalSales - totalCogs - totalMarketingSpend;
      const cm2Percentage = totalSales > 0 ? (cm2 / totalSales) * 100 : 0;
      const cm3 = totalSales - totalCogs - totalSdCost - totalMarketingSpend;
      const cm3Percentage = totalSales > 0 ? (cm3 / totalSales) * 100 : 0;

      console.log(overviewData,totalCogs,totalSdCost,sdCostPercentage,cogsPercentage,'overviewData')
      console.log(customerInsights,'customerInsights')
      
      const totalMarketingCost = marketingData ? (marketingData.totalSpend || 0) : 0;
      const grossProfit = totalSales * 0.4; 

      
      const mockData = {
        dateFilter: {
          startDate: filterStartDate,
          endDate: filterEndDate, 
          utcStartDate: utcStartDate,
          utcEndDate: utcEndDate
        },
        product: {
          id: productId || null,
          name: product.itemName || 'Unknown Product',
          image: imageUrl,
          description: description,
          sku: product.MasterSKU || 'N/A',
          price: product.price || 0,
          costPrice: product.costPrice || 0,
        },
       overview: {
        totalSales: totalSales,
        grossSales: grossSales,
        netSales: 0,
        totalTax: totalTax,
        taxRate: (taxRate*100).toFixed(2),
        totalQuantitySold: totalItemsSold,
        netQuantitySold: 0,
        totalOrders: totalOrders,
        netOrders: 0,
        aov: averageOrderPrice.toFixed(2),
        cogs: totalCogs,
        cogsPercentage: cogsPercentage,
        sdCost: totalSdCost,
        sdCostPercentage: sdCostPercentage,
        grossRoas: grossRoas,
        netRoas: netRoas,
        grossMer: grossMer,
        netMer: netMer,
        nRoas: nRoas,
        nMer: nMer,
        cac:(marketingData.totalPurchases || 0) > 0 ? (marketingData.totalSpend || 0) / (marketingData.totalPurchases || 1) : 0,
        cm2: cm2,
        cm2Percentage: cm2Percentage,
        cm3: cm3,
        cm3Percentage: cm3Percentage
        },
        // Add marketing data section with safe access
        marketing: marketingData ? {
          keyword: marketingData.keyword || null,
          totalSpend: marketingData.totalSpend || 0,
          totalImpressions: marketingData.totalImpressions || 0,
          totalClicks: marketingData.totalClicks || 0,
          totalPurchases: marketingData.totalPurchases || 0,
          totalPurchaseValue: marketingData.totalPurchaseValue || 0,
          averageRoas: marketingData.averageRoas || 0,
          averageCpc: marketingData.averageCpc || 0,
          averageCpm: marketingData.averageCpm || 0,
          averageCtr: marketingData.averageCtr || 0,
          campaignCount: marketingData.campaigns ? marketingData.campaigns.length : 0,
          campaigns: marketingData.campaigns && Array.isArray(marketingData.campaigns) ? marketingData.campaigns.map(campaign => ({
            id: campaign.campaign_id || null,
            name: campaign.campaign_name || 'Unknown Campaign',
            spend: campaign.spend || 0,
            impressions: campaign.impressions || 0,
            clicks: campaign.clicks || 0,
            purchases: campaign.total_purchases || 0,
            purchaseValue: campaign.total_purchase_value || 0,
            roas: campaign.overall_roas || 0,
            cpc: campaign.cpc || 0,
            cpm: campaign.cpm || 0,
            ctr: campaign.ctr || 0
          })) : [],
          performanceMetrics: {
            costPerPurchase: (marketingData.totalPurchases || 0) > 0 ? (marketingData.totalSpend || 0) / (marketingData.totalPurchases || 1) : 0,
            conversionRate: (marketingData.totalClicks || 0) > 0 ? ((marketingData.totalPurchases || 0) / (marketingData.totalClicks || 1)) * 100 : 0,
            profitFromAds: (marketingData.totalPurchaseValue || 0) - (marketingData.totalSpend || 0)
          }
        } : null,
        customerInsights: {
          totalCustomers: parseFloat(customerInsights?.unique_customers || 0),
          repeatCustomers: parseFloat(customerInsights?.repeat_customers || 0),
          repeatCustomerRate: parseFloat(customerInsights?.repeat_customer_rate || 0),
          avgOrdersPerCustomer: parseFloat(customerInsights?.avg_quantity_per_order || 0),
          firstTimeCustomers: parseFloat(customerInsights?.first_time_customers || 0), 
          firstTimeCustomerRate: parseFloat(customerInsights?.first_time_customer_rate || 0),
          customerAcquisitionCost: 0,
          
          highValueCustomers: {
            customerCount: customerInsights?.high_value_customer_count || 0,
            customerPercentage: parseFloat(customerInsights?.high_value_customer_percentage || 0),
          },
          mediumValueCustomers: {
            customerCount: customerInsights?.medium_value_customer_count || 0,
            customerPercentage: parseFloat(customerInsights?.medium_value_customer_percentage || 0),
          },
          lowValueCustomers: {
            customerCount: customerInsights?.low_value_customer_count || 0,
            customerPercentage: parseFloat(customerInsights?.low_value_customer_percentage || 0),
          },
          
          frequencyDistribution: {
            oneOrderCustomers: {
              customerCount: customerInsights?.one_order_customer_count || 0,
              customerPercentage: parseFloat(customerInsights?.one_order_customer_percentage || 0),
            },
            twoOrdersCustomers: {
              customerCount: customerInsights?.two_orders_customer_count || 0,
              customerPercentage: parseFloat(customerInsights?.two_orders_customer_percentage || 0),
            },
            threeOrdersCustomers: {
              customerCount: customerInsights?.three_orders_customer_count || 0,
              customerPercentage: parseFloat(customerInsights?.three_orders_customer_percentage || 0),
            },
            fourOrdersCustomers: {
              customerCount: customerInsights?.four_plus_orders_customer_count || 0,
              customerPercentage: parseFloat(customerInsights?.four_plus_orders_customer_percentage || 0),
            }
          }
        },
        variants: fetchVariantInsights && Array.isArray(fetchVariantInsights) ? fetchVariantInsights.map(variant => ({
          name: variant.variant_name || 'Unknown Variant',
          sku: variant.variant_sku || 'N/A',
          soldCount: parseInt(variant.total_units_sold) || 0,
          salesAmount: parseFloat(variant.total_sales_amount) || 0,
          unitsPercentage: parseFloat(variant.units_sold_percentage) || 0,
          profit: parseFloat(variant.total_sales_amount) * 0.4 || 0 // Assuming 40% profit margin
        })) : [],
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

// Helper function to initialize Meta Ads Analytics
const initializeMetaAds = () => {
  const accessToken = process.env.META_ACCESS_TOKEN || 'EAATpfGwjZCXkBO33nuWkRLZCpRpsBbNU5EVkes11zoG5VewkbMqYZC2aDn2H4y5tYCQye4ZBd2OQBSQ1al25QJNAM8TMZBWUkDQpH89C3D9kC9azE7hwTDq7HA2CpIbq9rzPqBjyPlcjYUtydyR5dCX0pdWltSbRdcZBI3iqmjBtvORMy6MMpM';
  const appId = process.env.META_APP_ID || '1609334849774379';
  const appSecret = process.env.META_APP_SECRET || 'c43c137e36f234e9a9f38df459d018bd';
  const adAccountId = process.env.META_AD_ACCOUNT_ID || 'act_1889983027860390';

  return new MetaAdsAnalytics(accessToken, appId, appSecret, adAccountId);
};

// Helper function to get marketing data for a product
const getProductMarketingData = async (productName, startDate, endDate) => {
  try {
    // Find the keyword for this product
    const productKeyword = marketingKeywords.find(item => 
      item.productName.toLowerCase() === productName.toLowerCase()
    );
    
    if (!productKeyword || productKeyword.keyword === '-') {
      console.log(`No marketing keyword found for product: ${productName}`);
      return {
        campaigns: [],
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalPurchases: 0,
        totalPurchaseValue: 0,
        averageRoas: 0,
        averageCpc: 0,
        averageCpm: 0,
        averageCtr: 0,
        keyword: null
      };
    }

    const keyword = productKeyword.keyword;
    // console.log(`Searching Meta Ads campaigns for keyword: ${keyword} (Product: ${productName}) from ${startDate} to ${endDate}`);
    
    const analytics = initializeMetaAds();
    
    // Create date range for Meta Ads API
    const dateRange = {
      since: startDate,
      until: endDate
    };
    
    // Get campaigns for the specified date range
    const allCampaigns = await analytics.getCampaignInsights(dateRange);
    
    // Filter campaigns that contain the product keyword in their name
    const matchingCampaigns = allCampaigns.filter(campaign => 
      campaign.campaign_name && 
      campaign.campaign_name.toLowerCase().includes(keyword.toLowerCase().replace(/[_-]/g, ''))
    );

    // console.log(`Found ${matchingCampaigns.length} matching campaigns for keyword: ${keyword} in date range ${startDate} to ${endDate}`);
    
    if (matchingCampaigns.length === 0) {
      return {
        campaigns: [],
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalPurchases: 0,
        totalPurchaseValue: 0,
        averageRoas: 0,
        averageCpc: 0,
        averageCpm: 0,
        averageCtr: 0,
        keyword: keyword
      };
    }

    // Calculate aggregate metrics
    const totalSpend = matchingCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
    const totalImpressions = matchingCampaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
    const totalClicks = matchingCampaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
    const totalPurchases = matchingCampaigns.reduce((sum, campaign) => sum + campaign.total_purchases, 0);
    const totalPurchaseValue = matchingCampaigns.reduce((sum, campaign) => sum + campaign.total_purchase_value, 0);
    
    // Calculate averages
    const averageRoas = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
    const averageCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const averageCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      campaigns: matchingCampaigns,
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalImpressions,
      totalClicks,
      totalPurchases,
      totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
      averageRoas: Math.round(averageRoas * 100) / 100,
      averageCpc: Math.round(averageCpc * 100) / 100,
      averageCpm: Math.round(averageCpm * 100) / 100,
      averageCtr: Math.round(averageCtr * 100) / 100,
      keyword: keyword
    };
  } catch (error) {
    console.error('Error fetching marketing data:', error);
    return {
      campaigns: [],
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalPurchases: 0,
      totalPurchaseValue: 0,
      averageRoas: 0,
      averageCpc: 0,
      averageCpm: 0,
      averageCtr: 0,
      error: error.message,
      keyword: null
    };
  }
};

module.exports = productsController;