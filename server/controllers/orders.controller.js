const logger = require('../utils/logger');
const valkeyClient = require('../config/valkey');
const chalk = require('chalk');
const { executeQuery, getDatasetName, formatDateForBigQuery } = require('../utils/bigquery');

const ordersController = {
  getOrdersOverview: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const cacheKey = `get_orders_overview:${startDate}:${endDate}`;
      let cachedData = null;
      
      // Try to get data from cache first
      try {
        cachedData = await valkeyClient.get(cacheKey);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      // if (cachedData) {
      //   console.log(chalk.bgGreen('Cache hit for orders overview'));
      //   return res.status(200).json({
      //     success: true,
      //     data: JSON.parse(cachedData),
      //     fromCache: true
      //   });
      // }

      // Format dates for BigQuery
      const formattedStartDate = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : new Date().toISOString();

      // Updated query for new table structure with nested data
      const query = `
        WITH order_metrics AS (
          SELECT 
            COUNT(DISTINCT NAME) as total_orders,
            SUM(CAST(TOTAL_PRICE AS NUMERIC)) as total_sales,
            AVG(CAST(TOTAL_PRICE AS NUMERIC)) as average_order_value,
            SUM(ARRAY_LENGTH(line_items)) as total_items_sold,
            COUNT(DISTINCT CASE WHEN ARRAY_LENGTH(refunds) > 0 THEN NAME END) as orders_with_refunds
          FROM \`${getDatasetName()}\`
          WHERE CREATED_AT >= TIMESTAMP('${formattedStartDate}')
            AND CREATED_AT <= TIMESTAMP('${formattedEndDate}')
        ),
        previous_period AS (
          SELECT 
            COUNT(DISTINCT NAME) as prev_total_orders,
            SUM(CAST(TOTAL_PRICE AS NUMERIC)) as prev_total_sales,
            AVG(CAST(TOTAL_PRICE AS NUMERIC)) as prev_average_order_value
          FROM \`${getDatasetName()}\`
          WHERE CREATED_AT >= TIMESTAMP_SUB(TIMESTAMP('${formattedStartDate}'), INTERVAL 30 DAY)
            AND CREATED_AT < TIMESTAMP('${formattedStartDate}')
        )
        SELECT 
          om.*,
          pp.prev_total_orders,
          pp.prev_total_sales,
          pp.prev_average_order_value,
          ROUND(SAFE_DIVIDE((om.total_orders - pp.prev_total_orders) * 100.0, pp.prev_total_orders), 2) as orders_growth,
          ROUND(SAFE_DIVIDE((om.total_sales - pp.prev_total_sales) * 100.0, pp.prev_total_sales), 2) as sales_growth,
          ROUND(SAFE_DIVIDE((om.average_order_value - pp.prev_average_order_value) * 100.0, pp.prev_average_order_value), 2) as aov_growth
        FROM order_metrics om, previous_period pp
      `;

      const rows = await executeQuery(query);
      const result = rows[0] || {};
      
      // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(result), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error fetching orders overview:', error);
      next(error);
    }
  },

  getOrdersByTimeRange: async (req, res, next) => {
    try {
      const { startDate, endDate, timeframe = 'day' } = req.query;
      console.log('Received parameters:', { startDate, endDate, timeframe });
      
      const cacheKey = `get_orders_by_time_range:${startDate}:${endDate}:${timeframe}`;
      let cachedData = null;

      try {
        cachedData = await valkeyClient.get(cacheKey);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      // if (cachedData) {
      //   console.log(chalk.bgGreen('Cache hit for orders by time range'));
      //   return res.status(200).json({
      //     success: true,
      //     data: JSON.parse(cachedData),
      //     fromCache: true
      //   });
      // }

      // Format dates for BigQuery
      const formattedStartDate = new Date(startDate).toISOString();
      const formattedEndDate = new Date(endDate).toISOString();
      console.log('Formatted dates:', { formattedStartDate, formattedEndDate });

      // First, let's check if we have any data at all
      const checkQuery = `
        SELECT 
          COUNT(*) as total_records,
          MIN(CREATED_AT) as earliest_date,
          MAX(CREATED_AT) as latest_date,
          COUNT(DISTINCT NAME) as unique_orders,
          SUM(TOTAL_PRICE) as total_revenue
        FROM \`${getDatasetName()}\`
      `;

      console.log('Executing check query...');
      const checkResults = await executeQuery(checkQuery);
      console.log('Check query results:', checkResults);

      // Updated query for time range data with nested structure
      const query = `
        SELECT 
          FORMAT_DATE('%Y-%m-%d', DATE(CREATED_AT)) as date,
          COUNT(DISTINCT NAME) as total_orders,
          SUM(CAST(TOTAL_PRICE AS NUMERIC)) as total_revenue,
          AVG(CAST(TOTAL_PRICE AS NUMERIC)) as average_order_value,
          SUM(ARRAY_LENGTH(line_items)) as total_items_sold,
          COUNT(DISTINCT CASE WHEN ARRAY_LENGTH(refunds) > 0 THEN NAME END) as refund_count
        FROM \`${getDatasetName()}\`
        WHERE CREATED_AT >= TIMESTAMP('${formattedStartDate}')
          AND CREATED_AT <= TIMESTAMP('${formattedEndDate}')
        GROUP BY date
        ORDER BY date
      `;

      console.log('Executing main query with params:', {
        startDate: formattedStartDate,
        endDate: formattedEndDate
      });

      const rows = await executeQuery(query);
      console.log('Main query results:', rows);
      
      // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(rows), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: rows });
    } catch (error) {
      logger.error('Error fetching orders by time range:', error);
      next(error);
    }
  },

  getTopSellingProducts: async (req, res, next) => {
    try {
      const { startDate, endDate, limit = 10 } = req.query;
      
      const cacheKey = `get_top_selling_products:${startDate}:${endDate}:${limit}`;
      let cachedData = null;

      try {
        cachedData = await valkeyClient.get(cacheKey);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      if (cachedData) {
        console.log(chalk.bgGreen('Cache hit for top selling products'));
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedData),
          fromCache: true
        });
      }

      // Format dates for BigQuery
      const formattedStartDate = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : new Date().toISOString();

      // Updated query for nested line_items
      const query = `
        SELECT 
          line_item.PRODUCT_ID,
          line_item.NAME as product_name,
          line_item.VARIANT_TITLE,
          SUM(CAST(line_item.QUANTITY AS NUMERIC)) as total_quantity_sold,
          SUM(CAST(line_item.PRICE AS NUMERIC) * CAST(line_item.QUANTITY AS NUMERIC)) as total_revenue,
          AVG(CAST(line_item.PRICE AS NUMERIC)) as average_price,
          COUNT(DISTINCT o.NAME) as orders_count
        FROM \`${getDatasetName()}\` o,
        UNNEST(o.line_items) as line_item
        WHERE o.CREATED_AT >= TIMESTAMP('${formattedStartDate}')
          AND o.CREATED_AT <= TIMESTAMP('${formattedEndDate}')
        GROUP BY line_item.PRODUCT_ID, line_item.NAME, line_item.VARIANT_TITLE
        ORDER BY total_quantity_sold DESC
        LIMIT ${parseInt(limit)}
      `;

      const rows = await executeQuery(query);
      
      // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(rows), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: rows });
    } catch (error) {
      logger.error('Error fetching top selling products:', error);
      next(error);
    }
  },

  getRefundMetrics: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      const cacheKey = `get_refund_metrics:${startDate}:${endDate}`;
      let cachedData = null;

      try {
        cachedData = await valkeyClient.get(cacheKey);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      if (cachedData) {
        console.log(chalk.bgGreen('Cache hit for refund metrics'));
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedData),
          fromCache: true
        });
      }

      const formattedStartDate = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : new Date().toISOString();

      // First, let's check the structure of the refunds
      const structureQuery = `
        SELECT refund.*
        FROM \`${getDatasetName()}\` o,
        UNNEST(o.refunds) as refund
        LIMIT 1
      `;

      const structureResult = await executeQuery(structureQuery);
      console.log('Refund structure:', structureResult[0]);

      // Updated query for nested refunds using the correct field names
      const query = `
        WITH current_period AS (
          SELECT 
            COUNT(DISTINCT refund.id) as total_refunds,
            SUM(CAST(transaction.amount AS NUMERIC)) as total_refunded_amount,
            COUNT(DISTINCT o.NAME) as orders_with_refunds,
            AVG(CAST(transaction.amount AS NUMERIC)) as average_refund_amount,
            COUNT(DISTINCT CASE 
              WHEN refund.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR) 
              THEN refund.id 
            END) as refunds_last_24h
          FROM \`${getDatasetName()}\` o,
          UNNEST(o.refunds) as refund,
          UNNEST(refund.transactions) as transaction
          WHERE o.CREATED_AT >= TIMESTAMP('${formattedStartDate}')
            AND o.CREATED_AT <= TIMESTAMP('${formattedEndDate}')
        ),
        previous_period AS (
          SELECT 
            COUNT(DISTINCT refund.id) as prev_total_refunds,
            SUM(CAST(transaction.amount AS NUMERIC)) as prev_total_refunded_amount,
            AVG(CAST(transaction.amount AS NUMERIC)) as prev_average_refund_amount,
            COUNT(DISTINCT CASE 
              WHEN refund.created_at >= TIMESTAMP_SUB(TIMESTAMP('${formattedStartDate}'), INTERVAL 24 HOUR)
              AND refund.created_at < TIMESTAMP('${formattedStartDate}')
              THEN refund.id 
            END) as prev_refunds_last_24h
          FROM \`${getDatasetName()}\` o,
          UNNEST(o.refunds) as refund,
          UNNEST(refund.transactions) as transaction
          WHERE o.CREATED_AT >= TIMESTAMP_SUB(TIMESTAMP('${formattedStartDate}'), INTERVAL 30 DAY)
            AND o.CREATED_AT < TIMESTAMP('${formattedStartDate}')
        )
        SELECT 
          cp.*,
          pp.prev_total_refunds,
          pp.prev_total_refunded_amount,
          pp.prev_average_refund_amount,
          pp.prev_refunds_last_24h,
          ROUND(SAFE_DIVIDE((cp.total_refunds - pp.prev_total_refunds) * 100.0, NULLIF(pp.prev_total_refunds, 0)), 2) as refunds_growth,
          ROUND(SAFE_DIVIDE((cp.total_refunded_amount - pp.prev_total_refunded_amount) * 100.0, NULLIF(pp.prev_total_refunded_amount, 0)), 2) as refund_amount_growth
        FROM current_period cp, previous_period pp
      `;

      const rows = await executeQuery(query);
      const result = rows[0] || {};
      
      // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(result), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error fetching refund metrics:', error);
      next(error);
    }
  },

  getRecentOrders: async (req, res, next) => {
    try {
      // Ensure page and pageSize are valid numbers
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize) || 10));
      const offset = (page - 1) * pageSize;
      
      const cacheKey = `get_recent_orders:${page}:${pageSize}`;
      let cachedData = null;

      try {
        cachedData = await valkeyClient.get(cacheKey);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      if (cachedData) {
        console.log(chalk.bgGreen('Cache hit for recent orders'));
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedData),
          fromCache: true
        });
      }

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT NAME) as total
        FROM \`${getDatasetName()}\`
      `;
      const countResult = await executeQuery(countQuery);
      const total = countResult[0].total;

      // Get recent orders with pagination
      const query = `
        SELECT 
          NAME as id,
          FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%S', CREATED_AT) as date,
          CAST(CURRENT_TOTAL_PRICE AS NUMERIC) as total,
          COALESCE(FINANCIAL_STATUS, 'pending') as status,
          COALESCE(FULFILLMENT_STATUS, 'unfulfilled') as fulfillment_status,
          CAST(CURRENT_SUBTOTAL_PRICE AS NUMERIC) as subtotal,
          CAST(CURRENT_TOTAL_DISCOUNTS AS NUMERIC) as discounts,
          CAST(CURRENT_TOTAL_TAX AS NUMERIC) as tax
        FROM \`${getDatasetName()}\`
        ORDER BY CREATED_AT DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `;

      const rows = await executeQuery(query);
      
      const response = {
        orders: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
      
      // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(response), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      logger.error('Error fetching recent orders:', error);
      next(error);
    }
  }
};

module.exports = ordersController; 