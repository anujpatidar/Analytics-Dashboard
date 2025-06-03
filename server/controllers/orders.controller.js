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
      
      if (cachedData) {
        console.log(chalk.bgGreen('Cache hit for orders overview'));
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedData),
          fromCache: true
        });
      }

      // Format dates for BigQuery
      const formattedStartDate = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : new Date().toISOString();

      // Query to get orders overview with date range
      const query = `
        WITH current_period AS (
          SELECT 
            COUNT(DISTINCT o.NAME) as total_orders,
            SUM(o.TOTAL_PRICE) as total_revenue,
            AVG(o.TOTAL_PRICE) as average_order_value,
            COUNT(DISTINCT CASE WHEN r.ORDER_ID IS NOT NULL THEN o.NAME END) as total_refunds,
            SUM(CASE WHEN r.ORDER_ID IS NOT NULL THEN o.TOTAL_PRICE ELSE 0 END) as refunded_amount
          FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.orders\` o
          LEFT JOIN \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.refunds\` r ON o.NAME = r.ORDER_NAME
          WHERE o.CREATED_AT >= TIMESTAMP('${formattedStartDate}')
            AND o.CREATED_AT <= TIMESTAMP('${formattedEndDate}')
        ),
        previous_period AS (
          SELECT 
            COUNT(DISTINCT o.NAME) as prev_total_orders,
            SUM(o.TOTAL_PRICE) as prev_total_revenue,
            AVG(o.TOTAL_PRICE) as prev_average_order_value,
            COUNT(DISTINCT CASE WHEN r.ORDER_ID IS NOT NULL THEN o.NAME END) as prev_total_refunds
          FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.orders\` o
          LEFT JOIN \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.refunds\` r ON o.NAME = r.ORDER_NAME
          WHERE o.CREATED_AT >= TIMESTAMP_SUB(TIMESTAMP('${formattedStartDate}'), INTERVAL 30 DAY)
            AND o.CREATED_AT < TIMESTAMP('${formattedStartDate}')
        )
        SELECT 
          cp.*,
          pp.prev_total_orders,
          pp.prev_total_revenue,
          pp.prev_average_order_value,
          pp.prev_total_refunds,
          ROUND(((cp.total_orders - pp.prev_total_orders) / pp.prev_total_orders) * 100, 1) as order_change_percentage,
          ROUND(((cp.total_revenue - pp.prev_total_revenue) / pp.prev_total_revenue) * 100, 1) as revenue_change_percentage,
          ROUND(((cp.average_order_value - pp.prev_average_order_value) / pp.prev_average_order_value) * 100, 1) as aov_change_percentage,
          ROUND(((cp.total_refunds / cp.total_orders) - (pp.prev_total_refunds / pp.prev_total_orders)) * 100, 1) as refund_rate_change_percentage
        FROM current_period cp
        CROSS JOIN previous_period pp
      `;

      const rows = await executeQuery(query);
      
      // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(rows[0]), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: rows[0] });
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
      
      if (cachedData) {
        console.log(chalk.bgGreen('Cache hit for orders by time range'));
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedData),
          fromCache: true
        });
      }

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
        FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.orders\`
      `;

      console.log('Executing check query...');
      const checkResults = await executeQuery(checkQuery);
      console.log('Check query results:', checkResults);

      // Now let's try to get the data for the specific date range
      const query = `
        SELECT 
          FORMAT_DATE('%Y-%m-%d', DATE(CREATED_AT)) as date,
          COUNT(DISTINCT o.NAME) as total_orders,
          SUM(o.TOTAL_PRICE) as total_revenue,
          AVG(o.TOTAL_PRICE) as average_order_value,
          COUNT(DISTINCT NAME) as order_count,
          SUM(TOTAL_PRICE) as daily_revenue,
          COUNT(DISTINCT CASE WHEN r.ORDER_ID IS NOT NULL THEN NAME END) as refund_count
        FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.orders\` o
        LEFT JOIN \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.refunds\` r 
          ON o.NAME = r.ORDER_NAME
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
      const { limit = 5 } = req.query;
      const cacheKey = `get_top_selling_products:${limit}`;
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

      const query = `
        SELECT 
          TITLE as product_name,
          SUM(CURRENT_QUANTITY) as total_quantity_sold,
          COUNT(DISTINCT SKU) as number_of_variants
        FROM 
          \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.line_items\`
        WHERE 
          TITLE IS NOT NULL 
          AND CURRENT_QUANTITY IS NOT NULL
          AND CURRENT_QUANTITY > 0
        GROUP BY 
          TITLE
        ORDER BY 
          total_quantity_sold DESC
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

      // Format dates for BigQuery
      const formattedStartDate = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : new Date().toISOString();

      const query = `
        WITH current_period AS (
          SELECT 
            COUNT(DISTINCT r.REFUND_ID) as total_refunds,
            SUM(r.TRANSACTION_AMOUNT) as total_refunded_amount,
            COUNT(DISTINCT r.ORDER_ID) as orders_with_refunds,
            AVG(r.TRANSACTION_AMOUNT) as average_refund_amount,
            COUNT(DISTINCT CASE 
              WHEN r.REFUND_CREATED_AT >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR) 
              THEN r.REFUND_ID 
            END) as refunds_last_24h
          FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.refunds\` r
          WHERE r.REFUND_CREATED_AT >= TIMESTAMP('${formattedStartDate}')
            AND r.REFUND_CREATED_AT <= TIMESTAMP('${formattedEndDate}')
        ),
        previous_period AS (
          SELECT 
            COUNT(DISTINCT r.REFUND_ID) as prev_total_refunds,
            SUM(r.TRANSACTION_AMOUNT) as prev_total_refunded_amount,
            AVG(r.TRANSACTION_AMOUNT) as prev_average_refund_amount,
            COUNT(DISTINCT CASE 
              WHEN r.REFUND_CREATED_AT >= TIMESTAMP_SUB(TIMESTAMP('${formattedStartDate}'), INTERVAL 24 HOUR)
              AND r.REFUND_CREATED_AT < TIMESTAMP('${formattedStartDate}')
              THEN r.REFUND_ID 
            END) as prev_refunds_last_24h
          FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.refunds\` r
          WHERE r.REFUND_CREATED_AT >= TIMESTAMP_SUB(TIMESTAMP('${formattedStartDate}'), INTERVAL 30 DAY)
            AND r.REFUND_CREATED_AT < TIMESTAMP('${formattedStartDate}')
        )
        SELECT 
          cp.*,
          ROUND(((cp.total_refunds - pp.prev_total_refunds) / pp.prev_total_refunds) * 100, 1) as refund_change_percentage,
          ROUND(((cp.total_refunded_amount - pp.prev_total_refunded_amount) / pp.prev_total_refunded_amount) * 100, 1) as refund_amount_change_percentage,
          ROUND(((cp.average_refund_amount - pp.prev_average_refund_amount) / pp.prev_average_refund_amount) * 100, 1) as avg_refund_change_percentage,
          ROUND(((cp.refunds_last_24h - pp.prev_refunds_last_24h) / pp.prev_refunds_last_24h) * 100, 1) as refund_24h_change_percentage
        FROM current_period cp
        CROSS JOIN previous_period pp
      `;

      const rows = await executeQuery(query);
      
      // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(rows[0]), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: rows[0] });
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
        FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.orders\`
      `;
      const countResult = await executeQuery(countQuery);
      const total = countResult[0].total;

      // Get recent orders with pagination
      const query = `
        SELECT 
          NAME as id,
          FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%S', CREATED_AT) as date,
          CURRENT_TOTAL_PRICE as total,
          COALESCE(FINANCIAL_STATUS, 'pending') as status,
          COALESCE(FULFILLMENT_STATUS, 'unfulfilled') as fulfillment_status,
          CURRENT_SUBTOTAL_PRICE as subtotal,
          CURRENT_TOTAL_DISCOUNTS as discounts,
          CURRENT_TOTAL_TAX as tax
        FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.orders\`
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
      
      // Store in cache for 5 minutes
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(response), 300);
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