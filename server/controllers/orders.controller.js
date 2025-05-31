const logger = require('../utils/logger');
const valkeyClient = require('../config/valkey');
const chalk = require('chalk');
const { executeQuery, getDatasetName, formatDateForBigQuery } = require('../utils/bigquery');

const ordersController = {
  getOrdersOverview: async (req, res, next) => {
    try {
      const cacheKey = 'get_orders_overview';
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

      // Query to get orders overview
      const query = `
        SELECT 
          COUNT(DISTINCT o.NAME) as total_orders,
          SUM(o.TOTAL_PRICE) as total_revenue,
          AVG(o.TOTAL_PRICE) as average_order_value,
          COUNT(DISTINCT CASE WHEN r.ORDER_ID IS NOT NULL THEN o.NAME END) as total_refunds,
          SUM(CASE WHEN r.ORDER_ID IS NOT NULL THEN o.TOTAL_PRICE ELSE 0 END) as refunded_amount
        FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.orders\` o
        LEFT JOIN \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.refunds\` r ON o.NAME = r.ORDER_NAME
        WHERE o.CREATED_AT >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
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
      const { startDate, endDate } = req.query;
      const cacheKey = `get_orders_by_time_range:${startDate}:${endDate}`;
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

      const query = `
        SELECT 
          DATE(CREATED_AT) as date,
          COUNT(DISTINCT NAME) as order_count,
          SUM(TOTAL_PRICE) as daily_revenue,
          COUNT(DISTINCT CASE WHEN r.ORDER_ID IS NOT NULL THEN NAME END) as refund_count
        FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.orders\` o
        LEFT JOIN \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.refunds\` r ON o.NAME = r.ORDER_NAME
        WHERE CREATED_AT BETWEEN @startDate AND @endDate
        GROUP BY date
        ORDER BY date
      `;

      const rows = await executeQuery(query, {
        startDate: formattedStartDate,
        endDate: formattedEndDate
      });
      
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
        LIMIT @limit
      `;

      const rows = await executeQuery(query, { limit: parseInt(limit) });
      
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
      const cacheKey = 'get_refund_metrics';
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

      const query = `
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
        WHERE r.REFUND_CREATED_AT >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
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
  }
};

module.exports = ordersController; 