const logger = require('../utils/logger');
const queryForBigQuery = require('../config/bigquery');
const Redis = require('ioredis');

const valkeyClient = new Redis({
  host: process.env.VALKEY_HOST || 'localhost',
  port: process.env.VALKEY_PORT || 6379,
  password: process.env.VALKEY_PASSWORD || '',
  connectTimeout: 10000,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Helper function to convert input dates to IST
const convertToIST = (dateString) => {
  if (!dateString) return null;
  
  // Create date object from input
  const inputDate = new Date(dateString);
  
  // Convert to IST (UTC+5:30)
  const istOffset = 330 * 60 * 1000; // 5.5 hours in milliseconds
  const istDate = new Date(inputDate.getTime() + istOffset);
  
  // Return in YYYY-MM-DD format for BigQuery
  return istDate.toISOString().split('T')[0];
};

const amazonController = {
  getAmazonOrdersOverview: async (req, res, next) => {
    try {
      const { startDate, endDate, store } = req.query;
      const cacheKey = `amazon-orders-overview-${startDate}-${endDate}-${store}`;
      
      // Check cache first
      try {
        const cachedData = await valkeyClient.get(cacheKey);
        if (cachedData) {
          return res.status(200).json({ success: true, data: JSON.parse(cachedData), store, cached: true });
        }
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }

      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      // Convert input dates to IST
      const formattedStartDate = convertToIST(startDate);
      const formattedEndDate = convertToIST(endDate);

      if (!formattedStartDate || !formattedEndDate) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }

      logger.info(`Amazon Overview - Original dates: ${startDate} to ${endDate}, IST dates: ${formattedStartDate} to ${formattedEndDate}`);

      // Amazon BigQuery table name from your schema
      const amazonTableName = process.env.AMAZON_BIGQUERY_TABLE || 'Frido_AmazonSeller_FlatFileAllOrdersReportbyLastUpdate';
      
      const query = `
        WITH latest_line_items AS (
          SELECT 
            *,
            ROW_NUMBER() OVER (
              PARTITION BY amazon_order_id, sku, asin
              ORDER BY last_updated_date DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.${amazonTableName}\`
          WHERE DATE(DATETIME_ADD(purchase_date, INTERVAL 330 MINUTE)) >= '${formattedStartDate}'
            AND DATE(DATETIME_ADD(purchase_date, INTERVAL 330 MINUTE)) <= '${formattedEndDate}'
        ),
        current_period AS (
          SELECT 
            -- Order level metrics
            COUNT(*) as total_orders,
            
            -- Product level metrics  
            COUNT(*) as total_line_items,
            SUM(CASE WHEN quantity IS NOT NULL THEN CAST(quantity AS FLOAT64) ELSE 0 END) as total_items_sold,
            
            -- Cancelled and returned items
            COUNT(CASE WHEN LOWER(item_status) LIKE '%cancel%' THEN 1 END) as cancelled_items,
            COUNT(CASE WHEN LOWER(item_status) LIKE '%return%' THEN 1 END) as returned_items,
            
            -- Financial metrics
            SUM(CAST(COALESCE(item_price, 0) AS FLOAT64)) as gross_sales,
            SUM(CAST(COALESCE(item_price, 0) AS FLOAT64) - CAST(COALESCE(item_promotion_discount, 0) AS FLOAT64)) as total_sales,
            SUM(CAST(COALESCE(item_tax, 0) AS FLOAT64)) as total_tax,
            SUM(CAST(COALESCE(shipping_price, 0) AS FLOAT64)) as total_shipping,
            SUM(CAST(COALESCE(shipping_tax, 0) AS FLOAT64)) as total_shipping_tax,
            SUM(CAST(COALESCE(item_promotion_discount, 0) AS FLOAT64) + CAST(COALESCE(ship_promotion_discount, 0) AS FLOAT64)) as total_promotions,
            
            -- Average calculations
            AVG(CAST(COALESCE(item_price, 0) AS FLOAT64)) as avg_item_price
            
          FROM latest_line_items
          WHERE rn = 1
        )
        SELECT 
          total_orders,
          total_line_items,
          total_items_sold,
          cancelled_items,
          returned_items,
          gross_sales,
          total_sales,
          total_tax,
          total_shipping,
          total_shipping_tax,
          total_promotions,
          avg_item_price,
          ROUND(total_sales / NULLIF(total_orders-cancelled_items, 0), 2) as average_order_value
        FROM current_period
      `;

      const rows = await queryForBigQuery(query);
      const result = rows[0] || {};
      
      // Debug logging
      logger.info('Amazon Overview Raw Result:', result);
      
      // Calculate additional metrics
      const totalOrders = parseInt(result.total_orders) || 0;
      const totalSales = parseFloat(result.total_sales) || 0;
      const grossSales = parseFloat(result.gross_sales) || 0;
      const cancelledItems = parseInt(result.cancelled_items) || 0;
      const returnedItems = parseInt(result.returned_items) || 0;
      const totalItemsSold = parseInt(result.total_items_sold) || 0;
      
      // Amazon-specific calculations
      const amazonFees = totalSales * 0.15; // Assuming 15% Amazon fee
      const netSales = totalSales - amazonFees;
      const returnRate = totalItemsSold > 0 ? (returnedItems / totalItemsSold) * 100 : 0;
      const cancellationRate = totalItemsSold > 0 ? (cancelledItems / totalItemsSold) * 100 : 0;
      
      // Calculate percentage changes (you can implement previous period comparison later)
      const amazonMetrics = {
        ...result,
        amazon_fees: amazonFees,
        net_sales: netSales,
        return_rate: returnRate,
        cancellation_rate: cancellationRate,
        gross_sales_percentage: grossSales > 0 ? (grossSales / totalSales) * 100 : 0,
        net_sales_percentage: netSales > 0 ? (netSales / totalSales) * 100 : 0,
        total_returns: returnedItems * (totalSales / totalItemsSold), // Estimated return value
        tax_rate: totalSales > 0 ? (parseFloat(result.total_tax) / totalSales) : 0,
        // Estimated costs (you can adjust these based on your business model)
        cogs: totalSales * 0.4, // Assuming 40% COGS
        sd_cost: parseFloat(result.total_shipping) || (totalSales * 0.08), // Use actual shipping or 8% estimate
        cogs_percentage: 40,
        sd_cost_percentage: 8,
        // Placeholder percentage changes (implement comparison with previous period)
        orders_change_percentage: 0,
        revenue_change_percentage: 0,
        aov_change_percentage: 0,
        gross_sales_change_percentage: 0,
        net_sales_change_percentage: 0,
        returns_change_percentage: 0,
        tax_change_percentage: 0
      };
      
      // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(amazonMetrics), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: amazonMetrics, store: store });
    } catch (error) {
      logger.error('Error fetching Amazon orders overview:', error);
      next(error);
    }
  },

  getAmazonOrdersByTimeRange: async (req, res, next) => {
    try {
      const { startDate, endDate, timeframe = 'day', store } = req.query;
      const cacheKey = `amazon-orders-time-range-${startDate}-${endDate}-${timeframe}-${store}`;
      
      // Check cache first
      try {
        const cachedData = await valkeyClient.get(cacheKey);
        if (cachedData) {
          return res.status(200).json({ success: true, data: JSON.parse(cachedData), store, cached: true });
        }
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      // Convert input dates to IST
      const formattedStartDate = convertToIST(startDate);
      const formattedEndDate = convertToIST(endDate);

      if (!formattedStartDate || !formattedEndDate) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }

      logger.info(`Amazon Time Range - Original dates: ${startDate} to ${endDate}, IST dates: ${formattedStartDate} to ${formattedEndDate}`);

      const amazonTableName = process.env.AMAZON_BIGQUERY_TABLE || 'Frido_AmazonSeller_FlatFileAllOrdersReportbyLastUpdate';
      
      // Determine the date format based on timeframe
      let dateFormat;
      switch (timeframe) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-%W';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        case 'year':
          dateFormat = '%Y';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }

      const query = `
        WITH latest_line_items AS (
          SELECT 
            *,
            ROW_NUMBER() OVER (
              PARTITION BY amazon_order_id, sku, asin
              ORDER BY last_updated_date DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.${amazonTableName}\`
          WHERE DATE(purchase_date) >= '${formattedStartDate}'
            AND DATE(purchase_date) <= '${formattedEndDate}'
        )
        SELECT 
          FORMAT_DATE('${dateFormat}', DATE(purchase_date)) as period,
          COUNT(DISTINCT amazon_order_id) as order_count,
          SUM(CAST(COALESCE(item_price, 0) AS FLOAT64) - CAST(COALESCE(item_promotion_discount, 0) AS FLOAT64)) as daily_revenue,
          AVG(CAST(COALESCE(item_price, 0) AS FLOAT64) - CAST(COALESCE(item_promotion_discount, 0) AS FLOAT64)) as avg_order_value,
          SUM(CASE WHEN quantity IS NOT NULL THEN CAST(quantity AS FLOAT64) ELSE 0 END) as items_sold
        FROM latest_line_items
        WHERE rn = 1
        GROUP BY period
        ORDER BY period
      `;

      const rows = await queryForBigQuery(query);
      
      // Store in cache for 30 minutes
    //   try {
    //     await valkeyClient.set(cacheKey, JSON.stringify(rows), 1800);
    //   } catch (cacheError) {
    //     logger.warn('Cache error:', cacheError);
    //   }
      
      res.status(200).json({ success: true, data: rows, store: store });
    } catch (error) {
      logger.error('Error fetching Amazon orders by time range:', error);
      next(error);
    }
  },

  getAmazonTopSellingProducts: async (req, res, next) => {
    try {
      const { startDate, endDate, store } = req.query;
      const cacheKey = `amazon-top-selling-${startDate}-${endDate}-${store}`;
      
      // Check cache first
      try {
        const cachedData = await valkeyClient.get(cacheKey);
        if (cachedData) {
          return res.status(200).json({ success: true, data: JSON.parse(cachedData), store, cached: true });
        }
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      // Convert input dates to IST
      const formattedStartDate = convertToIST(startDate);
      const formattedEndDate = convertToIST(endDate);

      if (!formattedStartDate || !formattedEndDate) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }

      logger.info(`Amazon Top Products - Original dates: ${startDate} to ${endDate}, IST dates: ${formattedStartDate} to ${formattedEndDate}`);

      const amazonTableName = process.env.AMAZON_BIGQUERY_TABLE || 'Frido_AmazonSeller_FlatFileAllOrdersReportbyLastUpdate';
      
      const query = `
        WITH latest_line_items AS (
          SELECT 
            *,
            ROW_NUMBER() OVER (
              PARTITION BY amazon_order_id, sku, asin
              ORDER BY last_updated_date DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.${amazonTableName}\`
          WHERE DATE(purchase_date) >= '${formattedStartDate}'
            AND DATE(purchase_date) <= '${formattedEndDate}'
        )
        SELECT 
          COALESCE(product_name, 'Unknown Product') as product_name,
          SUM(CASE WHEN quantity IS NOT NULL THEN CAST(quantity AS FLOAT64) ELSE 0 END) as total_quantity,
          SUM(CAST(COALESCE(item_price, 0) AS FLOAT64) - CAST(COALESCE(item_promotion_discount, 0) AS FLOAT64)) as total_revenue,
          COUNT(DISTINCT sku) as number_of_variants,
          COUNT(DISTINCT asin) as number_of_asins,
          AVG(CAST(COALESCE(item_price, 0) AS FLOAT64)) as average_price,
          COUNT(DISTINCT amazon_order_id) as orders_count
        FROM latest_line_items
        WHERE rn = 1
          AND LOWER(item_status) NOT LIKE '%cancel%'  -- Exclude cancelled items
        GROUP BY product_name
        ORDER BY total_quantity DESC
        LIMIT 10
      `;

      const rows = await queryForBigQuery(query);
      
      // Debug logging for top products
      logger.info('Amazon Top Products Raw Result:', rows);
      
    //   // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(rows), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: rows, store: store });
    } catch (error) {
      logger.error('Error fetching Amazon top selling products:', error);
      next(error);
    }
  },

  getAmazonReturnsData: async (req, res, next) => {
    try {
      const { startDate, endDate, store } = req.query;
      const cacheKey = `amazon-returns-data-${startDate}-${endDate}-${store}`;
      
      // Check cache first
      try {
        const cachedData = await valkeyClient.get(cacheKey);
        if (cachedData) {
          return res.status(200).json({ success: true, data: JSON.parse(cachedData), store, cached: true });
        }
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      // Convert input dates to IST
      const formattedStartDate = convertToIST(startDate);
      const formattedEndDate = convertToIST(endDate);

      if (!formattedStartDate || !formattedEndDate) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }

      logger.info(`Amazon Returns Data - Original dates: ${startDate} to ${endDate}, IST dates: ${formattedStartDate} to ${formattedEndDate}`);

      // Combine data from both Amazon returns tables and calculate return amounts from orders table
      const query = `
        WITH amazon_orders AS (
          SELECT 
            amazon_order_id,
            sku,
            asin,
            item_price,
            quantity as order_quantity,
            ROW_NUMBER() OVER (
              PARTITION BY amazon_order_id, sku, asin
              ORDER BY last_updated_date DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.Frido_AmazonSeller_FlatFileAllOrdersReportbyLastUpdate\`
        ),
        seller_fulfilled_returns AS (
          SELECT 
            Order_ID as order_id,
            Return_request_date as return_date,
            Item_Name as product_name,
            Return_quantity as quantity,
            Return_Reason as reason,
            Return_request_status as status,
            In_policy,
            Resolution,
            ASIN as asin,
            Merchant_SKU as sku,
            'Seller Fulfilled' as fulfillment_type,
            ROW_NUMBER() OVER (
              PARTITION BY Order_ID, ASIN, Merchant_SKU
              ORDER BY _daton_batch_runtime DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.Frido_AmazonSeller_FlatFileReturnsReportbyReturnDate\`
          WHERE Return_request_date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'
        ),
        fba_returns AS (
          SELECT 
            order_id,
            DATETIME(return_date) as return_date,
            product_name,
            quantity,
            reason,
            status,
            CAST(NULL AS STRING) as In_policy,
            detailed_disposition as Resolution,
            asin,
            sku,
            'FBA' as fulfillment_type,
            ROW_NUMBER() OVER (
              PARTITION BY order_id, asin, sku
              ORDER BY _daton_batch_runtime DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.Frido_AmazonSeller_FBAReturnsReport\`
          WHERE DATE(return_date) BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'
        ),
        combined_returns AS (
          SELECT 
            order_id,
            return_date,
            product_name,
            quantity,
            reason,
            status,
            In_policy,
            Resolution,
            asin,
            sku,
            fulfillment_type
          FROM seller_fulfilled_returns 
          WHERE rn = 1 AND (Resolution != "Replacement" OR Resolution IS NULL)
          
          UNION ALL
          
          SELECT 
            order_id,
            return_date,
            product_name,
            quantity,
            reason,
            status,
            In_policy,
            Resolution,
            asin,
            sku,
            fulfillment_type
          FROM fba_returns 
          WHERE rn = 1
        )
        SELECT 
          c.*,
          COALESCE(o.item_price, 0) as item_price,
          (COALESCE(c.quantity, 0) * COALESCE(o.item_price, 0)) as return_amount
        FROM combined_returns c
        LEFT JOIN amazon_orders o ON c.order_id = o.amazon_order_id 
          AND c.sku = o.sku 
          AND c.asin = o.asin 
          AND o.rn = 1
        ORDER BY c.return_date DESC
        LIMIT 1000
      `;

      const rows = await queryForBigQuery(query);
      
    //   // Store in cache for 30 minutes
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(rows), 1800);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: rows, store: store });
    } catch (error) {
      logger.error('Error fetching Amazon returns data:', error);
      next(error);
    }
  },

  getAmazonReturnsOverview: async (req, res, next) => {
    try {
      const { startDate, endDate, store } = req.query;
      const cacheKey = `amazon-returns-overview-${startDate}-${endDate}-${store}`;
      
      // Check cache first
      try {
        const cachedData = await valkeyClient.get(cacheKey);
        if (cachedData) {
          return res.status(200).json({ success: true, data: JSON.parse(cachedData), store, cached: true });
        }
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      // Convert input dates to IST
      const formattedStartDate = convertToIST(startDate);
      const formattedEndDate = convertToIST(endDate);

      if (!formattedStartDate || !formattedEndDate) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }

      logger.info(`Amazon Returns Overview - Original dates: ${startDate} to ${endDate}, IST dates: ${formattedStartDate} to ${formattedEndDate}`);

      const query = `
        WITH amazon_orders AS (
          SELECT 
            *,
            ROW_NUMBER() OVER (
              PARTITION BY amazon_order_id, sku, asin
              ORDER BY last_updated_date DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.Frido_AmazonSeller_FlatFileAllOrdersReportbyLastUpdate\`
          WHERE DATE(DATETIME_ADD(purchase_date, INTERVAL 330 MINUTE)) >= '${formattedStartDate}'
            AND DATE(DATETIME_ADD(purchase_date, INTERVAL 330 MINUTE)) <= '${formattedEndDate}'
        ),
        unique_orders AS (
          SELECT 
            COUNT(DISTINCT amazon_order_id) as total_orders_placed,
            COUNT(*) as total_line_items_ordered,
            SUM(CASE WHEN quantity IS NOT NULL THEN CAST(quantity AS FLOAT64) ELSE 0 END) as total_items_ordered
          FROM amazon_orders
          WHERE rn = 1
        ),
        amazon_orders_for_returns AS (
          SELECT 
            amazon_order_id,
            sku,
            asin,
            item_price,
            quantity as order_quantity,
            ROW_NUMBER() OVER (
              PARTITION BY amazon_order_id, sku, asin
              ORDER BY last_updated_date DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.Frido_AmazonSeller_FlatFileAllOrdersReportbyLastUpdate\`
        ),
        seller_fulfilled_returns AS (
          SELECT 
            Order_ID as order_id,
            Return_request_date as return_date,
            Item_Name as product_name,
            Return_quantity as quantity,
            Return_Reason as reason,
            Return_request_status as status,
            In_policy,
            Resolution,
            ASIN as asin,
            Merchant_SKU as sku,
            Is_prime,
            Label_cost,
            Category,
            'Seller Fulfilled' as fulfillment_type,
            ROW_NUMBER() OVER (
              PARTITION BY Order_ID, ASIN, Merchant_SKU
              ORDER BY _daton_batch_runtime DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.Frido_AmazonSeller_FlatFileReturnsReportbyReturnDate\`
          WHERE Return_request_date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'
        ),
        fba_returns AS (
          SELECT 
            order_id,
            DATETIME(return_date) as return_date,
            product_name,
            quantity,
            reason,
            status,
            CAST(NULL AS STRING) as In_policy,
            detailed_disposition as Resolution,
            asin,
            sku,
            CAST(NULL AS BOOLEAN) as Is_prime,
            CAST(NULL AS NUMERIC) as Label_cost,
            CAST(NULL AS STRING) as Category,
            'FBA' as fulfillment_type,
            ROW_NUMBER() OVER (
              PARTITION BY order_id, asin, sku
              ORDER BY _daton_batch_runtime DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.Frido_AmazonSeller_FBAReturnsReport\`
          WHERE DATE(return_date) BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'
        ),
        combined_returns_raw AS (
          SELECT 
            order_id,
            return_date,
            product_name,
            quantity,
            reason,
            status,
            In_policy,
            Resolution,
            asin,
            sku,
            Is_prime,
            Label_cost,
            Category,
            fulfillment_type
          FROM seller_fulfilled_returns 
          WHERE rn = 1 AND (Resolution != "Replacement" OR Resolution IS NULL)
          
          UNION ALL
          
          SELECT 
            order_id,
            return_date,
            product_name,
            quantity,
            reason,
            status,
            In_policy,
            Resolution,
            asin,
            sku,
            Is_prime,
            Label_cost,
            Category,
            fulfillment_type
          FROM fba_returns 
          WHERE rn = 1
        ),
        returns_data AS (
          SELECT 
            c.*,
            CAST(COALESCE(o.item_price, 0) AS FLOAT64) as item_price,
            (CAST(COALESCE(c.quantity, 0) AS FLOAT64) * CAST(COALESCE(o.item_price/NULLIF(o.order_quantity, 0), 0) AS FLOAT64)) as return_amount
          FROM combined_returns_raw c
          LEFT JOIN amazon_orders_for_returns o ON c.order_id = o.amazon_order_id 
            AND c.sku = o.sku 
            AND c.asin = o.asin 
            AND o.rn = 1
        ),
        return_metrics AS (
          SELECT 
            COUNT(DISTINCT order_id) as total_return_orders,
            COUNT(*) as total_return_items,
            SUM(CAST(COALESCE(quantity, 0) AS FLOAT64)) as total_return_quantity,
            SUM(CAST(COALESCE(return_amount, 0) AS FLOAT64)) as total_return_amount,
            COUNT(CASE WHEN status = 'Closed' OR status = 'Completed' THEN 1 END) as closed_returns,
            COUNT(CASE WHEN status = 'Approved' OR status = 'Processing' THEN 1 END) as approved_returns,
            COUNT(CASE WHEN In_policy = 'Yes' THEN 1 END) as in_policy_returns,
            COUNT(CASE WHEN In_policy = 'No' THEN 1 END) as out_of_policy_returns,
            COUNT(CASE WHEN Is_prime = true THEN 1 END) as prime_returns,
            AVG(CAST(COALESCE(Label_cost, 0) AS FLOAT64)) as avg_label_cost,
            COUNT(DISTINCT reason) as unique_return_reasons,
            COUNT(DISTINCT Category) as unique_categories,
            -- Top return reasons
            STRING_AGG(DISTINCT reason LIMIT 5) as top_return_reasons,
            -- Resolution breakdown
            COUNT(CASE WHEN Resolution = 'Refund' OR Resolution LIKE '%Refund%' THEN 1 END) as refund_resolutions,
            COUNT(CASE WHEN Resolution = 'Refund & Return' THEN 1 END) as refund_return_resolutions,
            COUNT(CASE WHEN Resolution != 'Refund' AND Resolution != 'Refund & Return' AND Resolution != 'Replacement' AND Resolution IS NOT NULL THEN 1 END) as other_resolutions,
            -- Fulfillment type breakdown
            COUNT(CASE WHEN fulfillment_type = 'Seller Fulfilled' THEN 1 END) as seller_fulfilled_returns,
            COUNT(CASE WHEN fulfillment_type = 'FBA' THEN 1 END) as fba_returns,
            -- Average return amount per item
            AVG(CAST(COALESCE(return_amount, 0) AS FLOAT64)) as avg_return_amount_per_item
          FROM returns_data
        )
        SELECT 
          u.total_orders_placed,
          u.total_line_items_ordered,
          u.total_items_ordered,
          r.total_return_orders,
          r.total_return_items,
          r.total_return_quantity,
          r.total_return_amount,
          r.closed_returns,
          r.approved_returns,
          r.in_policy_returns,
          r.out_of_policy_returns,
          r.prime_returns,
          r.avg_label_cost,
          r.unique_return_reasons,
          r.unique_categories,
          r.top_return_reasons,
          r.refund_resolutions,
          r.refund_return_resolutions,
          r.other_resolutions,
          r.seller_fulfilled_returns,
          r.fba_returns,
          r.avg_return_amount_per_item
        FROM unique_orders u
        CROSS JOIN return_metrics r
      `;

      const rows = await queryForBigQuery(query);
      const result = rows[0] || {};
      
      // Calculate additional metrics
      const totalOrdersPlaced = parseInt(result.total_orders_placed) || 0;
      const totalReturnOrders = parseInt(result.total_return_orders) || 0;
      const totalReturnItems = parseInt(result.total_return_items) || 0;
      const totalItemsOrdered = parseInt(result.total_items_ordered) || 0;
      const totalReturnAmount = parseFloat(result.total_return_amount) || 0;
      const inPolicyReturns = parseInt(result.in_policy_returns) || 0;
      const outOfPolicyReturns = parseInt(result.out_of_policy_returns) || 0;
      
      const returnsMetrics = {
        ...result,
        // Proper return rate calculation: (returned orders / total orders) * 100
        return_rate_percentage: totalOrdersPlaced > 0 ? ((totalReturnOrders / totalOrdersPlaced) * 100).toFixed(2) : 0,
        // Item return rate: (returned items / total items ordered) * 100
        item_return_rate_percentage: totalItemsOrdered > 0 ? ((totalReturnItems / totalItemsOrdered) * 100).toFixed(2) : 0,
        avg_return_amount_per_return: totalReturnItems > 0 ? (totalReturnAmount / totalReturnItems).toFixed(2) : 0,
        in_policy_percentage: (inPolicyReturns + outOfPolicyReturns) > 0 ? ((inPolicyReturns / (inPolicyReturns + outOfPolicyReturns)) * 100).toFixed(2) : 0,
        prime_return_percentage: totalReturnItems > 0 ? ((parseInt(result.prime_returns) / totalReturnItems) * 100).toFixed(2) : 0
      };
      
    //   // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(returnsMetrics), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: returnsMetrics, store: store });
    } catch (error) {
      logger.error('Error fetching Amazon returns overview:', error);
      next(error);
    }
  },

  getAmazonProductMetrics: async (req, res, next) => {
    try {
      const { sku } = req.params; // This is the MasterSKU
      const { startDate, endDate, store } = req.query;
      const cacheKey = `amazon-product-metrics-${sku}-${startDate}-${endDate}-${store}`;
      
      // Check cache first
      try {
        const cachedData = await valkeyClient.get(cacheKey);
        if (cachedData) {
          return res.status(200).json({ success: true, data: JSON.parse(cachedData), store, cached: true });
        }
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }

      // Validate required parameters
      if (!sku) {
        return res.status(400).json({ success: false, message: 'SKU is required' });
      }
      
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      // Find the product in sku.json by MasterSKU
      const skuJson = require('./sku.json');
      const product = skuJson.find(p => p.MasterSKU === sku);
      
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product with SKU ${sku} not found` 
        });
      }

      // Get all variant SKUs for Amazon store, fallback to Shopify if no Amazon SKUs
      const amazonVariantSkus = product.variants && Array.isArray(product.variants) 
        ? product.variants.flatMap(v => 
            v.variantSkus && Array.isArray(v.variantSkus) 
              ? v.variantSkus
                  .filter(s => s.storeName === 'Amazon')
                  .map(s => s.variant_sku)
                  .filter(Boolean)  
              : []
          ).filter(Boolean)
        : [];

      // Fallback to Shopify SKUs if no Amazon SKUs found
      const fallbackVariantSkus = amazonVariantSkus.length === 0 ? 
        product.variants && Array.isArray(product.variants) 
          ? product.variants.flatMap(v => 
              v.variantSkus && Array.isArray(v.variantSkus) 
                ? v.variantSkus
                    .filter(s => s.storeName === 'Shopify')
                    .map(s => s.variant_sku)
                    .filter(Boolean)  
                : []
            ).filter(Boolean)
          : []
        : amazonVariantSkus;

      const variantSkus = fallbackVariantSkus;

      if (variantSkus.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: `No valid variant SKUs found for product ${sku}` 
        });
      }

      logger.info(`Found ${variantSkus.length} variant SKUs for ${sku}:`, variantSkus);

      // Convert input dates to IST
      const formattedStartDate = convertToIST(startDate);
      const formattedEndDate = convertToIST(endDate);

      if (!formattedStartDate || !formattedEndDate) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }

      logger.info(`Amazon Product Metrics - MasterSKU: ${sku}, Variant SKUs: ${variantSkus.join(', ')}, Original dates: ${startDate} to ${endDate}, IST dates: ${formattedStartDate} to ${formattedEndDate}`);

      const amazonTableName = process.env.AMAZON_BIGQUERY_TABLE || 'Frido_AmazonSeller_FlatFileAllOrdersReportbyLastUpdate';
      
      const query = `
        WITH latest_line_items AS (
          SELECT 
            *,
            ROW_NUMBER() OVER (
              PARTITION BY amazon_order_id, sku, asin
              ORDER BY last_updated_date DESC
            ) as rn
          FROM \`frido-429506.Frido_BigQuery.${amazonTableName}\`
          WHERE LOWER(sku) IN (${variantSkus.map(s => `'${s.toLowerCase()}'`).join(',')})
            AND DATE(DATETIME_ADD(purchase_date, INTERVAL 330 MINUTE)) >= '${formattedStartDate}'
            AND DATE(DATETIME_ADD(purchase_date, INTERVAL 330 MINUTE)) <= '${formattedEndDate}'
        ),
        product_data AS (
          SELECT 
            sku,
            product_name,
            asin,
            currency,
            -- Placeholder for image URL since product_image_url column doesn't exist
            NULL as image_url,
            -- Order level metrics
            COUNT(DISTINCT amazon_order_id) as total_orders,
            COUNT(*) as total_line_items,
            SUM(CASE WHEN quantity IS NOT NULL THEN CAST(quantity AS FLOAT64) ELSE 0 END) as total_items_sold,
            
            -- Cancelled and returned items
            COUNT(CASE WHEN LOWER(item_status) LIKE '%cancel%' THEN 1 END) as cancelled_items,
            COUNT(CASE WHEN LOWER(item_status) LIKE '%return%' THEN 1 END) as returned_items,
            
            -- Financial metrics
            SUM(CAST(COALESCE(item_price, 0) AS FLOAT64)) as gross_sales,
            SUM(CAST(COALESCE(item_price, 0) AS FLOAT64) - CAST(COALESCE(item_promotion_discount, 0) AS FLOAT64)) as total_sales,
            SUM(CAST(COALESCE(item_tax, 0) AS FLOAT64)) as total_tax,
            SUM(CAST(COALESCE(shipping_price, 0) AS FLOAT64)) as total_shipping,
            SUM(CAST(COALESCE(shipping_tax, 0) AS FLOAT64)) as total_shipping_tax,
            SUM(CAST(COALESCE(item_promotion_discount, 0) AS FLOAT64) + CAST(COALESCE(ship_promotion_discount, 0) AS FLOAT64)) as total_promotions,
            
            -- Average calculations
            AVG(CAST(COALESCE(item_price, 0) AS FLOAT64)) as avg_item_price,
            
            -- Time series data for charts
            ARRAY_AGG(
              STRUCT(
                DATE(purchase_date) as date,
                CAST(COALESCE(item_price, 0) AS FLOAT64) - CAST(COALESCE(item_promotion_discount, 0) AS FLOAT64) as daily_sales,
                CAST(quantity AS FLOAT64) as daily_quantity
              )
              ORDER BY DATE(purchase_date)
            ) as daily_data
            
          FROM latest_line_items
          WHERE rn = 1
          GROUP BY sku, product_name, asin, currency
        ),
        returns_data AS (
          SELECT 
            COUNT(*) as total_return_items,
            SUM(CAST(COALESCE(Return_quantity, 0) AS FLOAT64)) as total_return_quantity,
            AVG(CAST(COALESCE(Return_quantity, 0) AS FLOAT64)) as avg_return_quantity
          FROM \`frido-429506.Frido_BigQuery.Frido_AmazonSeller_FlatFileReturnsReportbyReturnDate\`
          WHERE LOWER(Merchant_SKU) IN (${variantSkus.map(s => `'${s.toLowerCase()}'`).join(',')})
            AND Return_request_date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'
        ),
        marketing_data AS (
          -- Placeholder for marketing data - you can extend this based on your Amazon Ads tables
          SELECT 
            0 as ad_spend,
            0 as impressions,
            0 as clicks,
            0 as ad_purchases
        )
        SELECT 
          p.*,
          r.total_return_items,
          r.total_return_quantity,
          r.avg_return_quantity,
          m.ad_spend,
          m.impressions,
          m.clicks,
          m.ad_purchases
        FROM product_data p
        CROSS JOIN returns_data r
        CROSS JOIN marketing_data m
      `;

      const rows = await queryForBigQuery(query);
      const result = rows[0] || {};
      
      // If no data found, return basic structure with N/A values
      if (!result.sku) {
        const noDataResult = {
          product: {
            name: product.itemName || 'Product Not Found',
            sku: sku,
            price: 0,
            image: null,
            asin: 'N/A'
          },
          overview: {
            totalOrders: 0,
            totalSales: 0,
            grossSales: 0,
            netSales: 0,
            aov: 0,
            grossSalePercentage: 0,
            netSalePercentage: 0,
            netOrders: 0,
            totalQuantitySold: 0,
            netQuantitySold: 0,
            totalReturnsQuantity: 0,
            totalReturns: 0,
            totalReturnPercentage: 0,
            totalTax: 0,
            taxRate: 0,
            cogs: 0,
            cogsPercentage: 0,
            sdCost: 0,
            sdCostPercentage: 0,
            grossRoas: 0,
            netRoas: 0,
            nRoas: 0,
            nMer: 0,
            cac: 0,
            nCac: 0,
            cm2: 0,
            cm2Percentage: 0,
            cm3: 0,
            cm3Percentage: 0,
            paidCac: 0,
            organicCac: 0,
            contributionMargin: 0,
            contributionMarginPercentage: 0,
            profitMargin: 0
          },
          charts: {
            salesOverTime: [],
            quantityOverTime: [],
            topVariants: [],
            customerInsights: []
          },
          marketing: {
            adSpend: 0,
            impressions: 0,
            clicks: 0,
            purchases: 0,
            purchaseValue: 0,
            roas: 0,
            ctr: 0,
            cpc: 0,
            targetingKeyword: 'N/A'
          },
          variants: [],
          customers: {
            totalCustomers: 0,
            repeatCustomers: 0,
            repeatRate: 0,
            avgOrdersPerCustomer: 0,
            acquisitionCost: 0
          }
        };
        
        // Store in cache for 30 minutes
        try {
          await valkeyClient.set(cacheKey, JSON.stringify(noDataResult), 1800);
        } catch (cacheError) {
          logger.warn('Cache error:', cacheError);
        }
        
        return res.status(200).json({ success: true, data: noDataResult, store: store });
      }
      
      // Calculate additional metrics
      const totalOrders = parseInt(result.total_orders) || 0;
      const totalSales = parseFloat(result.total_sales) || 0;
      const grossSales = parseFloat(result.gross_sales) || 0;
      const cancelledItems = parseInt(result.cancelled_items) || 0;
      const returnedItems = parseInt(result.returned_items) || 0;
      const totalItemsSold = parseInt(result.total_items_sold) || 0;
      const totalTax = parseFloat(result.total_tax) || 0;
      const totalShipping = parseFloat(result.total_shipping) || 0;
      const totalPromotions = parseFloat(result.total_promotions) || 0;
      const totalReturnQuantity = parseFloat(result.total_return_quantity) || 0;
      
      // Amazon-specific calculations
      const amazonFees = totalSales * 0.15; // Assuming 15% Amazon fee
      const netSales = totalSales - amazonFees;
      const returnRate = totalItemsSold > 0 ? (totalReturnQuantity / totalItemsSold) * 100 : 0;
      const cancellationRate = totalItemsSold > 0 ? (cancelledItems / totalItemsSold) * 100 : 0;
      const aov = totalOrders > 0 ? totalSales / totalOrders : 0;
      
      // Estimated costs (you can adjust these based on your business model)
      const estimatedCogs = totalSales * 0.4; // Assuming 40% COGS
      const estimatedSdCost = totalShipping || (totalSales * 0.08); // Use actual shipping or 8% estimate
      
      // Format the response to match Myfrido structure
      const productMetrics = {
        product: {
          name: result.product_name || product.itemName || 'Unknown Product',
          sku: sku, // Use MasterSKU
          price: parseFloat(result.avg_item_price) || 0,
          image: result.image_url || null,
          asin: result.asin || 'N/A',
          currency: result.currency || 'USD'
        },
        overview: {
          totalOrders: totalOrders,
          totalSales: totalSales,
          grossSales: grossSales,
          netSales: netSales,
          aov: aov,
          grossSalePercentage: grossSales > 0 ? 100 : 0,
          netSalePercentage: netSales > 0 ? (netSales / grossSales) * 100 : 0,
          netOrders: totalOrders - cancelledItems,
          totalQuantitySold: totalItemsSold,
          netQuantitySold: totalItemsSold - returnedItems,
          totalReturnsQuantity: totalReturnQuantity,
          totalReturns: totalReturnQuantity * aov, // Estimated return value
          totalReturnPercentage: returnRate,
          totalTax: totalTax,
          taxRate: totalSales > 0 ? (totalTax / totalSales) * 100 : 0,
          cogs: estimatedCogs,
          cogsPercentage: 40,
          sdCost: estimatedSdCost,
          sdCostPercentage: totalSales > 0 ? (estimatedSdCost / totalSales) * 100 : 8,
          grossRoas: estimatedCogs > 0 ? totalSales / estimatedCogs : 0,
          netRoas: estimatedCogs > 0 ? netSales / estimatedCogs : 0,
          nRoas: 0, // Placeholder for net ROAS calculation
          nMer: netSales > 0 ? (netSales / totalSales) * 100 : 0,
          cac: 0, // Placeholder for CAC calculation
          nCac: 0, // Placeholder for net CAC calculation
          cm2: netSales - estimatedCogs,
          cm2Percentage: netSales > 0 ? ((netSales - estimatedCogs) / netSales) * 100 : 0,
          cm3: netSales - estimatedCogs - estimatedSdCost,
          cm3Percentage: netSales > 0 ? ((netSales - estimatedCogs - estimatedSdCost) / netSales) * 100 : 0,
          paidCac: 0, // Placeholder
          organicCac: 0, // Placeholder
          contributionMargin: netSales - estimatedCogs - estimatedSdCost,
          contributionMarginPercentage: netSales > 0 ? ((netSales - estimatedCogs - estimatedSdCost) / netSales) * 100 : 0,
          profitMargin: netSales > 0 ? ((netSales - estimatedCogs) / netSales) * 100 : 0,
          // Change percentages (placeholder - you can implement comparison with previous period)
          ordersChangePercentage: 0,
          revenueChangePercentage: 0,
          aovChangePercentage: 0,
          grossSalesChangePercentage: 0,
          netSalesChangePercentage: 0,
          returnsChangePercentage: 0,
          taxChangePercentage: 0
        },
        charts: {
          salesOverTime: result.daily_data ? result.daily_data.map(d => ({
            date: d.date,
            sales: d.daily_sales || 0,
            quantity: d.daily_quantity || 0
          })) : [],
          quantityOverTime: result.daily_data ? result.daily_data.map(d => ({
            date: d.date,
            quantity: d.daily_quantity || 0
          })) : [],
          topVariants: [], // Placeholder - you can extend this
          customerInsights: [] // Placeholder - you can extend this
        },
        marketing: {
          adSpend: parseFloat(result.ad_spend) || 0,
          impressions: parseInt(result.impressions) || 0,
          clicks: parseInt(result.clicks) || 0,
          purchases: parseInt(result.ad_purchases) || 0,
          purchaseValue: 0, // Placeholder
          roas: result.ad_spend > 0 ? totalSales / result.ad_spend : 0,
          ctr: result.impressions > 0 ? (result.clicks / result.impressions) * 100 : 0,
          cpc: result.clicks > 0 ? result.ad_spend / result.clicks : 0,
          targetingKeyword: 'Amazon Product Ads' // Placeholder
        },
        variants: [
          {
            name: result.product_name || 'Main Variant',
            sku: result.sku,
            unitsSold: totalItemsSold,
            revenue: totalSales,
            avgPrice: aov,
            performance: totalItemsSold > 0 ? 'Good' : 'Low'
          }
        ],
        customers: {
          totalCustomers: totalOrders, // Approximation - assuming 1 customer per order
          repeatCustomers: 0, // Placeholder
          repeatRate: 0, // Placeholder
          avgOrdersPerCustomer: 1, // Placeholder
          acquisitionCost: 0 // Placeholder
        }
      };
      
      // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(productMetrics), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: productMetrics, store: store });
    } catch (error) {
      logger.error('Error fetching Amazon product metrics:', error);
      next(error);
    }
  }
};

module.exports = amazonController; 