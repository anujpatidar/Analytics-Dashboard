const logger = require('../utils/logger');
const valkeyClient = require('../config/valkey');
const chalk = require('chalk');
const { executeQuery, getDatasetName, formatDateForBigQuery } = require('../utils/bigquery');
const skuData = require('./sku.json');
const marketingKeywords = require('./marketingKeywords.json');
const MetaAdsAnalytics = require('../utils/MetaAdsAnalytics');

// Helper function to find COGS and S&D for a given SKU
const findCOGSForSKU = (sku) => {
  for (const product of skuData) {
    for (const variant of product.variants) {
      for (const variantSku of variant.variantSkus) {
        if (variantSku.variant_sku === sku) {
          return {
            cogs: variant.cogs || product.cogs || 0,
            sd: variant['s&d'] || product['s&d'] || 0,
            productName: product.itemName,
            variantName: variant.variantName
          };
        }
      }
    }
  }
  return { cogs: 0, sd: 0, productName: 'Unknown', variantName: 'Unknown' };
};

// Helper function to initialize Meta Ads Analytics
const initializeMetaAds = () => {
  const accessToken = process.env.META_ACCESS_TOKEN || 'EAATpfGwjZCXkBO33nuWkRLZCpRpsBbNU5EVkes11zoG5VewkbMqYZC2aDn2H4y5tYCQye4ZBd2OQBSQ1al25QJNAM8TMZBWUkDQpH89C3D9kC9azE7hwTDq7HA2CpIbq9rzPqBjyPlcjYUtydyR5dCX0pdWltSbRdcZBI3iqmjBtvORMy6MMpM';
  const appId = process.env.META_APP_ID || '1609334849774379';
  const appSecret = process.env.META_APP_SECRET || 'c43c137e36f234e9a9f38df459d018bd';
  const adAccountId = process.env.META_AD_ACCOUNT_ID || 'act_1889983027860390';

  return new MetaAdsAnalytics(accessToken, appId, appSecret, adAccountId);
};

// Helper function to get overall marketing data (without product filtering)
const getOverallMarketingData = async (startDate, endDate) => {
  try {
    console.log(`Fetching overall marketing data from ${startDate} to ${endDate}`);
    
    const analytics = initializeMetaAds();
    
    // Create date range for Meta Ads API
    const dateRange = {
      since: startDate,
      until: endDate
    };
    
    // Get all campaigns for the specified date range
    const allCampaigns = await analytics.getCampaignInsights(dateRange);
    
    console.log(`Found ${allCampaigns.length} total campaigns in date range ${startDate} to ${endDate}`);
    
    if (allCampaigns.length === 0) {
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

    // Calculate aggregate metrics for all campaigns
    const totalSpend = allCampaigns.reduce((sum, campaign) => sum + (campaign.spend || 0), 0);
    const totalImpressions = allCampaigns.reduce((sum, campaign) => sum + (campaign.impressions || 0), 0);
    const totalClicks = allCampaigns.reduce((sum, campaign) => sum + (campaign.clicks || 0), 0);
    const totalPurchases = allCampaigns.reduce((sum, campaign) => sum + (campaign.total_purchases || 0), 0);
    const totalPurchaseValue = allCampaigns.reduce((sum, campaign) => sum + (campaign.total_purchase_value || 0), 0);
    
    // Calculate averages
    const averageRoas = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
    const averageCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const averageCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      campaigns: allCampaigns,
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalImpressions,
      totalClicks,
      totalPurchases,
      totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
      averageRoas: Math.round(averageRoas * 100) / 100,
      averageCpc: Math.round(averageCpc * 100) / 100,
      averageCpm: Math.round(averageCpm * 100) / 100,
      averageCtr: Math.round(averageCtr * 100) / 100,
      keyword: null // No specific keyword for overall data
    };
  } catch (error) {
    console.error('Error fetching overall marketing data:', error);
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

const ordersController = {
  getOrdersOverview: async (req, res, next) => {
    try {
      const { startDate, endDate, store = 'myfrido' } = req.query;
      const cacheKey = `get_orders_overview:${startDate}:${endDate}:${store}`;
      let cachedData = null;
      
      // For non-myfrido stores, return null to let client handle with demo data
      if (store !== 'myfrido') {
        return res.status(200).json({
          success: true,
          data: null,
          store: store,
          message: 'Using demo data for this store'
        });
      }
      
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
      console.log(startDate,endDate,'startDate,endDate')
      // Format dates for BigQuery
      const formattedStartDate = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : new Date().toISOString();

      console.log('--------------------------------');
      console.log('Formatted dates:', { formattedStartDate, formattedEndDate });
      console.log("--------------------------------");
      // Updated query for new table structure with nested data
      //2025-06-12T18:30:00.000Z
      //2025-06-20T18:29:59.000Z
      const query = `
        WITH latest_orders AS (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY name ORDER BY _daton_batch_runtime desc) as rn
        FROM \`frido-429506.Frido_BigQuery.Frido_Shopify_orders\`
            WHERE created_at >= TIMESTAMP('${formattedStartDate}')
                AND created_at <= TIMESTAMP('${formattedEndDate}')
      ),
      overall_metrics AS (
        SELECT 
          COUNT(DISTINCT name) as total_orders,
          SUM(CAST(total_price AS NUMERIC)) as total_sales,
          SUM(CAST(total_tax as Numeric)) as total_tax,
          SUM(CAST(total_tax as Numeric))/SUM(CAST(total_price as Numeric)) as tax_rate, 
          SUM(CAST(total_line_items_price AS NUMERIC)) as gross_sales, 
          AVG(CAST(total_price AS NUMERIC)) as average_order_value,
          SUM((SELECT SUM(item.quantity) FROM UNNEST(line_items) as item)) as total_items_sold,
          COUNT(DISTINCT CASE WHEN ARRAY_LENGTH(refunds) > 0 THEN name END) as orders_with_refunds
        FROM latest_orders
        WHERE rn = 1
      ),
      sku_data AS (
        SELECT 
          item.sku,
          item.title as product_name,
          SUM(item.quantity) as quantity_sold,
          SUM(CAST(item.price AS NUMERIC) * item.quantity) as sku_total_sales,
          AVG(CAST(item.price AS NUMERIC)) as average_unit_price,
          COUNT(DISTINCT o.name) as orders_containing_sku
        FROM latest_orders o
        CROSS JOIN UNNEST(o.line_items) as item
        WHERE o.rn = 1
        GROUP BY item.sku, item.title
      )

      SELECT 
        -- Overall metrics (will be repeated for each row but you can take first row)
        (SELECT total_orders FROM overall_metrics) as total_orders,
        (SELECT total_sales FROM overall_metrics) as total_sales,
        (SELECT total_tax FROM overall_metrics) as total_tax,
        (SELECT tax_rate FROM overall_metrics) as tax_rate,
        (SELECT gross_sales FROM overall_metrics) as gross_sales,
        (SELECT average_order_value FROM overall_metrics) as average_order_value,
        (SELECT total_items_sold FROM overall_metrics) as total_items_sold,
        (SELECT orders_with_refunds FROM overall_metrics) as orders_with_refunds,
        
        -- SKU-wise data for COGS calculation
        sku,
        product_name,
        quantity_sold,
        sku_total_sales,
        average_unit_price,
        orders_containing_sku
      FROM sku_data
      ORDER BY quantity_sold DESC;
      `;

      const rows = await executeQuery(query);
      const result = rows || [];

      // console.log(result,'result');

      // Calculate COGS and S&D costs
      let totalCogs = 0;
      let totalSdCost = 0;
      const totalSales = parseFloat(result[0].total_sales) || 0;
      
      result.forEach(row => {
        const sku = row.sku;
        const quantitySold = parseFloat(row.quantity_sold) || 0;
        const cogsInfo = findCOGSForSKU(sku);
        
        const itemCogs = cogsInfo.cogs * quantitySold;
        const itemSdCost = cogsInfo.sd * quantitySold;
        
        totalCogs += itemCogs;
        totalSdCost += itemSdCost;
        
        // console.log(`SKU: ${sku}, Quantity: ${quantitySold}, COGS per unit: ${cogsInfo.cogs}, Total COGS: ${itemCogs}, S&D: ${itemSdCost}`);
      });


      //cogs and sd percentage
      const cogsPercentage = totalSales > 0 ? (totalCogs / totalSales) * 100 : 0;
      const sdCostPercentage = totalSales > 0 ? (totalSdCost / totalSales) * 100 : 0;
      
      // Fetch overall marketing data - extract date part from ISO strings for Meta Ads API
      const marketingStartDate = formattedStartDate.split('T')[0]; // Extract YYYY-MM-DD from ISO string
      const marketingEndDate = formattedEndDate.split('T')[0]; // Extract YYYY-MM-DD from ISO string
      const marketingData = await getOverallMarketingData(marketingStartDate, marketingEndDate);

      const netSales = totalSales - totalCogs; // Sales after COGS
      const nSales = totalSales - totalCogs - totalSdCost; // Sales after COGS and S&D
      

      // Calculate financial metrics with marketing data
      const grossRoas = marketingData.totalSpend > 0 ? (totalSales / marketingData.totalSpend) : 0;
      const netRoas = marketingData.totalSpend > 0 ? (netSales / marketingData.totalSpend) : 0;
      const nRoas = marketingData.totalSpend > 0 ? (nSales / marketingData.totalSpend) : 0;

      const grossMer = totalSales > 0 ? (marketingData.totalSpend / totalSales) * 100 : 0;
      const netMer = (netSales) > 0 ? (marketingData.totalSpend / (netSales)) * 100 : 0;
      const nMer = (nSales) > 0 ? (marketingData.totalSpend / (nSales)) * 100 : 0;

      const cac = marketingData.totalPurchases > 0 ? (marketingData.totalSpend / marketingData.totalPurchases) : 0;
      const cm2 = totalSales - totalCogs - marketingData.totalSpend;
      const cm2Percentage = totalSales > 0 ? (cm2 / totalSales) * 100 : 0;
      const cm3 = totalSales - totalCogs - totalSdCost - marketingData.totalSpend;
      const cm3Percentage = totalSales > 0 ? (cm3 / totalSales) * 100 : 0;


      const finalData = {
        dateFilter: {
          startDate: startDate,
          endDate: endDate, 
          utcStartDate: formattedStartDate,
          utcEndDate: formattedEndDate,
        },
       overview: {
        totalSales: parseFloat(result[0].total_sales) || 0,
        grossSales: parseFloat(result[0].gross_sales) || 0,
        grossSalesPercentage: (parseFloat(result[0].gross_sales)/parseFloat(result[0].total_sales)*100),
        netSalesPercentage: (parseFloat(result[0].net_sales)/parseFloat(result[0].total_sales)*100),
        totalReturns :0,
        returnRate:0,
        netSales: 0,
        totalTax: parseFloat(result[0].total_tax) || 0,
        taxRate: (parseFloat(result[0].tax_rate)*100),
        totalQuantitySold: parseFloat(result[0].total_items_sold) || 0,
        netQuantitySold: 0,
        totalOrders: parseFloat(result[0].total_orders) || 0,
        netOrders: 0,
        aov: parseFloat(result[0].average_order_value) || 0,
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
        cac: cac,
        cm2: cm2,
        cm2Percentage: cm2Percentage,
        cm3: cm3,
        cm3Percentage: cm3Percentage
        },
        // Add marketing data section with same structure as products controller
        marketing: marketingData ? {
          keyword: marketingData.keyword || null,
          totalSpend: parseFloat(marketingData.totalSpend) || 0,
          totalImpressions: parseFloat(marketingData.totalImpressions) || 0,
          totalClicks: parseFloat(marketingData.totalClicks) || 0,
          totalPurchases: parseFloat(marketingData.totalPurchases) || 0,
          totalPurchaseValue: parseFloat(marketingData.totalPurchaseValue) || 0,
          averageRoas: parseFloat(marketingData.averageRoas) || 0,
          averageCpc: parseFloat(marketingData.averageCpc) || 0,
          averageCpm: parseFloat(marketingData.averageCpm) || 0,
          averageCtr: parseFloat(marketingData.averageCtr) || 0,
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
        } : null
      };
      
      // Store in cache for 1 hour
      try {
        await valkeyClient.set(cacheKey, JSON.stringify(finalData), 3600);
      } catch (cacheError) {
        logger.warn('Cache error:', cacheError);
      }
      
      res.status(200).json({ success: true, data: finalData, store: store });
    } catch (error) {
      logger.error('Error fetching orders overview:', error);
      next(error);
    }
  },

  getOrdersByTimeRange: async (req, res, next) => {
    try {
      const { startDate, endDate, timeframe = 'day', store = 'myfrido' } = req.query;
      console.log('Received parameters:', { startDate, endDate, timeframe, store });
      
      const cacheKey = `get_orders_by_time_range:${startDate}:${endDate}:${timeframe}:${store}`;
      let cachedData = null;

      // For non-myfrido stores, return null to let client handle with demo data
      if (store !== 'myfrido') {
        return res.status(200).json({
          success: true,
          data: null,
          store: store,
          message: 'Using demo data for this store'
        });
      }

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
      
      res.status(200).json({ success: true, data: rows, store: store });
    } catch (error) {
      logger.error('Error fetching orders by time range:', error);
      next(error);
    }
  },

  getTopSellingProducts: async (req, res, next) => {
    try {
      const { startDate, endDate, limit = 10, store = 'myfrido' } = req.query;
      
      const cacheKey = `get_top_selling_products:${startDate}:${endDate}:${limit}:${store}`;
      let cachedData = null;

      // For non-myfrido stores, return null to let client handle with demo data
      if (store !== 'myfrido') {
        return res.status(200).json({
          success: true,
          data: null,
          store: store,
          message: 'Using demo data for this store'
        });
      }

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
      
      res.status(200).json({ success: true, data: rows, store: store });
    } catch (error) {
      logger.error('Error fetching top selling products:', error);
      next(error);
    }
  },

  getRefundMetrics: async (req, res, next) => {
    try {
      const { startDate, endDate, store = 'myfrido' } = req.query;
      const cacheKey = `get_refund_metrics:${startDate}:${endDate}:${store}`;
      let cachedData = null;

      // For non-myfrido stores, return null to let client handle with demo data
      if (store !== 'myfrido') {
        return res.status(200).json({
          success: true,
          data: null,
          store: store,
          message: 'Using demo data for this store'
        });
      }

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
      
      res.status(200).json({ success: true, data: rows[0], store: store });
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
      const store = req.query.store || 'myfrido';
      const offset = (page - 1) * pageSize;
      
      const cacheKey = `get_recent_orders:${page}:${pageSize}:${store}`;
      let cachedData = null;

      // For non-myfrido stores, return null to let client handle with demo data
      if (store !== 'myfrido') {
        return res.status(200).json({
          success: true,
          data: null,
          store: store,
          message: 'Using demo data for this store'
        });
      }

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
      
      res.status(200).json({ success: true, data: response, store: store });
    } catch (error) {
      logger.error('Error fetching recent orders:', error);
      next(error);
    }
  }
};

module.exports = ordersController; 