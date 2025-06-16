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
const { getDatasetName } = require('../utils/bigquery');
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
      
      // Set default date range if not provided (last 30 days)
      const defaultEndDate = new Date().toISOString().split('T')[0];
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const filterStartDate = startDate || defaultStartDate;
      const filterEndDate = endDate || defaultEndDate;
      
      console.log(`Filtering data from ${filterStartDate} to ${filterEndDate}`);
      
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
              ? v.variantSkus.map(s => s.variant_sku).filter(Boolean)
              : []
          ).filter(Boolean)
        : [];

      if (variantSkus.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: `No valid variant SKUs found for product ${productSlug}` 
        });
      }

      // Updated query for nested line_items structure
      const query1 = `SELECT 
        COUNT(DISTINCT line_item.VARIANT_ID) as total_variants_sold,
        SUM(line_item.QUANTITY) as total_units_sold,
        ROUND(SUM(line_item.PRICE * line_item.QUANTITY), 2) as total_sales_amount,
        ROUND(AVG(line_item.PRICE), 2) as average_price,
        COUNT(DISTINCT o.NAME) as total_orders
      FROM \`${getDatasetName()}\` o,
      UNNEST(o.line_items) as line_item
      WHERE line_item.SKU IN ('${variantSkus.join("','")}') 
        AND DATE(o.PROCESSED_AT) >= '${filterStartDate}'
        AND DATE(o.PROCESSED_AT) <= '${filterEndDate}'`;

      let overviewData = {};
      try {
        const result = await queryForBigQuery(query1);
        overviewData = result[0] || {};
      } catch (error) {
        console.error('Error fetching overview data:', error.message);
        overviewData = {};
      }

      // Query 2: Customer insights with error handling
      const query2 = `SELECT 
        COUNT(DISTINCT CUSTOMER_ID) as unique_customers,
        COUNT(DISTINCT o.NAME) as total_orders,
        ROUND(SUM(line_item.QUANTITY) / COUNT(DISTINCT o.NAME), 2) as avg_quantity_per_order,
        ROUND(SUM(line_item.PRICE * line_item.QUANTITY) / COUNT(DISTINCT o.NAME), 2) as avg_order_value,
        COUNT(DISTINCT CASE WHEN o.FINANCIAL_STATUS = 'refunded' THEN o.NAME END) as refunded_orders
      FROM \`${getDatasetName()}\` o,
      UNNEST(o.line_items) as line_item
      WHERE line_item.SKU IN ('${variantSkus.join("','")}') 
        AND DATE(o.PROCESSED_AT) >= '${filterStartDate}'
        AND DATE(o.PROCESSED_AT) <= '${filterEndDate}'`;

      let customerInsights = {};
      try {
        const result2 = await queryForBigQuery(query2);
        customerInsights = result2[0] || {};
      } catch (error) {
        console.error('Error fetching customer insights:', error.message);
        customerInsights = {};
      }

      // Query 3: Variant insights with updated structure for nested line_items
      const query3 = `SELECT 
        line_item.VARIANT_TITLE,
        SUM(line_item.QUANTITY) as total_units_sold,
        ROUND(SUM(line_item.PRICE * line_item.QUANTITY - COALESCE(line_item.TOTAL_DISCOUNT, 0)), 2) as total_sales_amount,
        ROUND(
          (SUM(line_item.QUANTITY) * 100.0) / NULLIF(SUM(SUM(line_item.QUANTITY)) OVER(), 0), 2
        ) as units_sold_percentage
      FROM \`${getDatasetName()}\` o,
      UNNEST(o.line_items) as line_item
      WHERE line_item.SKU IN ('${variantSkus.join("','")}') 
        AND DATE(o.PROCESSED_AT) >= '${filterStartDate}'
        AND DATE(o.PROCESSED_AT) <= '${filterEndDate}'
      GROUP BY line_item.VARIANT_TITLE
      ORDER BY total_sales_amount DESC`;

      let fetchVariantInsights = [];
      try {
        fetchVariantInsights = await queryForBigQuery(query3);
      } catch (error) {
        console.error('Error fetching variant insights:', error.message);
        fetchVariantInsights = [];
      }
      
      // Safe calculations with null checks
      const totalRevenue = parseFloat(overviewData.total_sales) || 0;
      const totalOrders = parseInt(overviewData.total_orders) || 0;
      const totalQuantitySold = parseInt(overviewData.total_units_sold) || 0;
      const netQuantitySold = parseInt(overviewData.total_variants_sold) || 0;
      const exchangeOrdersCount = parseInt(customerInsights.refunded_orders) || 0;
      
      const totalMarketingCost = marketingData ? (marketingData.totalSpend || 0) : 0;
      const grossProfit = totalRevenue * 0.4; // Assuming 40% gross margin
      const profitAfterMarketing = grossProfit - totalMarketingCost;
      const aov = netQuantitySold > 0 ? totalRevenue / netQuantitySold : 0;
      const refundRate = totalOrders > 0 ? (exchangeOrdersCount / totalOrders) * 100 : 0;
      
      const mockData = {
        dateFilter: {
          startDate: filterStartDate,
          endDate: filterEndDate
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
          totalOrders: totalOrders,
          totalSales: totalRevenue,
          aov: aov,
          netQuantitySold: netQuantitySold,
          totalQuantitySold: totalQuantitySold,
          grossProfit: grossProfit,
          profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
          refundRate: refundRate,
        },
        salesAndProfit: {
          totalRevenue: totalRevenue,
          marketingCost: totalMarketingCost,
          profitAfterMarketing: profitAfterMarketing,
          profitPerUnit: netQuantitySold > 0 ? profitAfterMarketing / netQuantitySold : 0,
          costPricePerUnit: product.costPrice || 8000,
          returnUnits: exchangeOrdersCount,
          returnRate: refundRate,
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
          totalCustomers: customerInsights.unique_customers || 0,
          repeatCustomers: 0,
          repeatCustomerRate: 0,
          avgOrdersPerCustomer: customerInsights.avg_quantity_per_order || 0,
          firstTimeCustomers: 0,
          customerAcquisitionCost: 0,
          highValueCustomers: {
            customerCount: 0,
            customerPercentage: 0,
          },
          mediumValueCustomers: {
            customerCount: 0,
            customerPercentage: 0,
          },
          lowValueCustomers: {
            customerCount: 0,
            customerPercentage: 0,
          },
          frequencyDistribution: {
            oneOrderCustomers: {
              customerCount: 0,
              customerPercentage: 0,
            },
            twoOrdersCustomers: {
              customerCount: 0,
              customerPercentage: 0,
            },
            threeOrdersCustomers: {
              customerCount: 0,
              customerPercentage: 0,
            },
            fourOrdersCustomers: {
              customerCount: 0,
              customerPercentage: 0,
            }
          }
        },
        variants: fetchVariantInsights && Array.isArray(fetchVariantInsights) ? fetchVariantInsights.map(variant => ({
          name: variant.VARIANT_TITLE || 'Unknown Variant',
          soldCount: parseInt(variant.total_units_sold) || 0,
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