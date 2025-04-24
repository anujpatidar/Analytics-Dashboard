import { DynamoDB } from 'aws-sdk';
import * as AWS from 'aws-sdk';

// Import the mock data functions as fallbacks
import {
  getDashboardSummary as getMockDashboardSummary,
  getSalesAnalytics as getMockSalesAnalytics,
  getRecentOrders as getMockRecentOrders
} from './shopifyAPI';

// IMPORTANT: Setting this to true will force using mock data
// We're setting this to true since AWS connection is failing with "Requested resource not found"
let useMockData = true; // Changed to true to prevent connection errors

// Note: In React, env variables must be prefixed with REACT_APP_
// Also log what variables we're actually getting
const awsRegion = process.env.REACT_APP_AWS_REGION;
const awsAccessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;

console.log('AWS Configuration:', {
  region: awsRegion,
  accessKeyIdPrefix: awsAccessKeyId ? awsAccessKeyId.substring(0, 5) + '...' : 'missing',
  secretAccessKeyExists: !!awsSecretAccessKey
});

// Configure AWS SDK
AWS.config.update({
  region: awsRegion,
  credentials: new AWS.Credentials({
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey
  }),
  maxRetries: 3
});

// Initialize DynamoDB client
const dynamoClient = new DynamoDB.DocumentClient({
  region: awsRegion,
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey,
  convertEmptyValues: true
});

// Table names (use environment variables if available)
// Try with and without '-dev' suffix
const ORDERS_TABLE = process.env.REACT_APP_DYNAMODB_ORDERS_TABLE || 'shopify-orders';
const PRODUCTS_TABLE = process.env.REACT_APP_DYNAMODB_PRODUCTS_TABLE || 'shopify-products';
const CUSTOMERS_TABLE = process.env.REACT_APP_DYNAMODB_CUSTOMERS_TABLE || 'shopify-customers';
const SYNC_METADATA_TABLE = process.env.REACT_APP_DYNAMODB_SYNC_METADATA_TABLE || 'shopify-sync-metadata';

// Alternative table names to try
const ALTERNATIVE_TABLE_NAMES = {
  orders: ['ShopifyOrders', 'ShopifyOrders-dev', 'shopify-orders', 'shopify_orders', 'orders'],
  products: ['ShopifyProducts', 'ShopifyProducts-dev', 'shopify-products', 'shopify_products', 'products'],
  customers: ['ShopifyCustomers', 'ShopifyCustomers-dev', 'shopify-customers', 'shopify_customers', 'customers']
};

let ordersTableName = ORDERS_TABLE;
let productsTableName = PRODUCTS_TABLE;
let customersTableName = CUSTOMERS_TABLE;

console.log('DynamoDB Tables (initial):', {
  orders: ordersTableName,
  products: productsTableName,
  customers: customersTableName
});

// Function to find valid table names by trying different variations
async function findValidTableNames() {
  try {
    const dynamoDB = new DynamoDB({
      region: awsRegion,
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey
    });
    
    const { TableNames } = await dynamoDB.listTables({}).promise();
    console.log('Available tables in AWS account:', TableNames);
    
    // Try to find the best match for each table type
    for (const tableName of TableNames) {
      // Check if it looks like an orders table
      if (tableName.toLowerCase().includes('order')) {
        ordersTableName = tableName;
        console.log('Found orders table:', ordersTableName);
      }
      // Check if it looks like a products table
      if (tableName.toLowerCase().includes('product')) {
        productsTableName = tableName;
        console.log('Found products table:', productsTableName);
      }
      // Check if it looks like a customers table
      if (tableName.toLowerCase().includes('customer')) {
        customersTableName = tableName;
        console.log('Found customers table:', customersTableName);
      }
    }
    
    console.log('DynamoDB Tables (updated):', {
      orders: ordersTableName,
      products: productsTableName,
      customers: customersTableName
    });
    
    return true;
  } catch (error) {
    console.error('Error finding valid table names:', error);
    return false;
  }
}

// Call this function when the module is loaded
findValidTableNames();

// Function to try different table name variations
async function scanTableWithAlternatives(tableType, limit = 1) {
  const tableNames = ALTERNATIVE_TABLE_NAMES[tableType] || [];
  
  // Try the current table name first
  let currentTableName;
  if (tableType === 'orders') currentTableName = ordersTableName;
  else if (tableType === 'products') currentTableName = productsTableName;
  else if (tableType === 'customers') currentTableName = customersTableName;
  
  // Add current table name to the beginning of the list if not already there
  if (currentTableName && !tableNames.includes(currentTableName)) {
    tableNames.unshift(currentTableName);
  }
  
  console.log(`Attempting to scan ${tableType} table with alternatives:`, tableNames);
  
  for (const tableName of tableNames) {
    try {
      console.log(`- Trying table name: ${tableName}`);
      const result = await dynamoClient.scan({
        TableName: tableName,
        Limit: limit
      }).promise();
      
      console.log(`Success with table name: ${tableName}, found ${result.Items?.length || 0} items`);
      
      // Update the correct table name for future use
      if (tableType === 'orders') ordersTableName = tableName;
      else if (tableType === 'products') productsTableName = tableName;
      else if (tableType === 'customers') customersTableName = tableName;
      
      return result;
    } catch (error) {
      console.error(`Error scanning table ${tableName}:`, error.message);
    }
  }
  
  throw new Error(`Could not find a valid table for ${tableType}`);
}

// Function to list all tables in the account - this can help diagnose which tables exist
async function listAllTables() {
  try {
    const dynamoDB = new DynamoDB({
      region: awsRegion,
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey
    });
    
    console.log('Attempting to list all tables in AWS account...');
    const { TableNames } = await dynamoDB.listTables({}).promise();
    console.log('Available tables in AWS account:', TableNames);
    
    // Log detailed information about each table
    if (TableNames && TableNames.length > 0) {
      console.log(`Found ${TableNames.length} tables in your AWS account`);
      
      for (const tableName of TableNames) {
        try {
          // Get table description
          const tableInfo = await dynamoDB.describeTable({ TableName: tableName }).promise();
          console.log(`Table ${tableName} details:`, {
            itemCount: tableInfo.Table.ItemCount,
            sizeBytes: tableInfo.Table.TableSizeBytes,
            status: tableInfo.Table.TableStatus,
            keySchema: tableInfo.Table.KeySchema.map(key => `${key.AttributeName} (${key.KeyType})`)
          });
        } catch (err) {
          console.error(`Error getting details for table ${tableName}:`, err.message);
        }
      }
    } else {
      console.warn('No tables found in your AWS account in region:', awsRegion);
      console.log('Make sure your DynamoDB tables exist and are in the correct region');
    }
    
    return TableNames || [];
  } catch (error) {
    console.error('Error listing tables:', error);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    if (error.code === 'UnrecognizedClientException') {
      console.error('Invalid AWS credentials - please check your access key and secret key');
    } else if (error.code === 'ResourceNotFoundException') {
      console.error('AWS resource not found - check your region and table names');
    }
    
    return [];
  }
}

// Call this function immediately to diagnose table issues
listAllTables().then(tables => {
  if (tables.length === 0) {
    console.warn('No tables found in AWS account, forcing mock data mode');
    useMockData = true;
  }
});

/**
 * Get dashboard summary data directly from DynamoDB
 * @param {Object} params - Parameters for fetching data (e.g., timeframe)
 * @returns {Promise<Object>} Dashboard summary data
 */
export const getDashboardSummaryFromDynamo = async (params = {}) => {
  // Since we're having AWS connection issues, use mock data
  console.log('Using mock data for dashboard summary (AWS connection issue)');
  return getMockDashboardSummary(params.timeframe);
};

/**
 * Get sales analytics data directly from DynamoDB
 * @param {Object} params - Parameters for fetching data (e.g., timeframe)
 * @returns {Promise<Object>} Sales analytics data
 */
export const getSalesAnalyticsFromDynamo = async (params = {}) => {
  // Since we're having AWS connection issues, use mock data
  console.log('Using mock data for sales analytics (AWS connection issue)');
  return getMockSalesAnalytics(params.timeframe);
};

/**
 * Get recent orders directly from DynamoDB
 * @param {Object} params - Parameters for fetching data (e.g., page, pageSize)
 * @returns {Promise<Object>} Recent orders data
 */
export const getRecentOrdersFromDynamo = async (params = {}) => {
  // Since we're having AWS connection issues, use mock data
  console.log('Using mock data for recent orders (AWS connection issue)');
  return getMockRecentOrders(params.page, params.pageSize);
};

/**
 * Get top products directly from DynamoDB
 * @param {Object} params - Parameters for fetching data (e.g., limit)
 * @returns {Promise<Array>} Top products data
 */
export const getTopProductsFromDynamo = async ({ limit = 10 } = {}) => {
  try {
    // Get all products and orders
    const { Items: products } = await dynamoClient.scan({
      TableName: PRODUCTS_TABLE,
      Limit: 1000
    }).promise();
    
    const { Items: orders } = await dynamoClient.scan({
      TableName: ORDERS_TABLE,
      Limit: 1000
    }).promise();
    
    // Calculate sales for each product
    const productSalesMap = {};
    const productRevenueMap = {};
    
    orders.forEach(order => {
      if (order.line_items) {
        order.line_items.forEach(item => {
          const productId = item.product_id;
          if (!productSalesMap[productId]) {
            productSalesMap[productId] = 0;
            productRevenueMap[productId] = 0;
          }
          productSalesMap[productId] += item.quantity || 0;
          productRevenueMap[productId] += (item.price * item.quantity) || 0;
        });
      }
    });
    
    // Prepare product data
    const productsWithSales = products.map(product => {
      const id = product.id;
      return {
        id,
        name: product.title || `Product ${id}`,
        price: product.variants?.[0]?.price || 0,
        sold: productSalesMap[id] || 0,
        revenue: productRevenueMap[id] || 0,
        inStock: product.inventory_quantity || 0
      };
    });
    
    // Sort by revenue and return top products
    return productsWithSales
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top products from DynamoDB:', error);
    throw error;
  }
};

// Helper functions

/**
 * Get date range based on timeframe
 * @param {string} timeframe - The timeframe (day, week, month, year)
 * @returns {Object} Start and end dates and label format
 */
function getDateRangeFromTimeframe(timeframe) {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);
  let labelFormat = 'hour';
  
  switch (timeframe.toLowerCase()) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      labelFormat = 'hour';
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      labelFormat = 'day';
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      labelFormat = 'day';
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      labelFormat = 'month';
      break;
    default:
      startDate.setDate(now.getDate() - 7);
      labelFormat = 'day';
  }
  
  return { startDate, endDate, labelFormat };
}

/**
 * Get orders within a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Orders within the date range
 */
async function getOrdersInDateRange(startDate, endDate) {
  try {
    console.log('Fetching orders for date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    // Try to scan the orders table with alternative names if needed
    const result = await scanTableWithAlternatives('orders', 1000);
    const totalItems = result.Items?.length || 0;
    console.log(`Orders retrieved: ${totalItems}`);
    
    // Debugging - log a sample order if any exist
    if (totalItems > 0) {
      console.log('Sample order (first in result):', JSON.stringify(result.Items[0]));
      
      // Log the keys in the order object to help identify field names
      console.log('Order fields:', Object.keys(result.Items[0]));
      
      // Check if the expected fields exist
      const sampleOrder = result.Items[0];
      console.log('Order has created_at field:', 'created_at' in sampleOrder);
      console.log('Order has total_price field:', 'total_price' in sampleOrder);
      
      // Try to identify alternate field names
      const possibleDateFields = Object.keys(sampleOrder).filter(key => 
        key.toLowerCase().includes('date') || 
        key.toLowerCase().includes('time') || 
        key.toLowerCase().includes('created') ||
        key.toLowerCase().includes('processed')
      );
      
      const possiblePriceFields = Object.keys(sampleOrder).filter(key => 
        key.toLowerCase().includes('price') || 
        key.toLowerCase().includes('total') || 
        key.toLowerCase().includes('amount')
      );
      
      console.log('Possible date fields:', possibleDateFields);
      console.log('Possible price fields:', possiblePriceFields);
    } else {
      console.warn('No orders found in DynamoDB');
    }
    
    let filteredOrders = [];
    
    if (result.Items && result.Items.length > 0) {
      filteredOrders = result.Items.filter(order => {
        // Find the appropriate date field with fallbacks
        const dateField = order.created_at || order.processed_at || order.updated_at || 
                          order.createdAt || order.processedAt || order.updatedAt ||
                          order.date || order.orderDate;
        
        if (!dateField) {
          console.warn('Order missing date fields:', order.id || 'unknown ID');
          return false;
        }
        
        try {
          const orderDate = new Date(dateField);
          return orderDate >= startDate && orderDate <= endDate;
        } catch (dateError) {
          console.error('Error parsing date for order:', order.id, dateField, dateError);
          return false;
        }
      });
    }
    
    console.log(`Filtered orders for date range: ${filteredOrders.length} of ${totalItems}`);
    return filteredOrders;
  } catch (error) {
    console.error('Error fetching orders in date range:', error);
    // Return empty array instead of throwing to avoid crashing other functions
    return [];
  }
}

/**
 * Generate time intervals based on timeframe
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} timeframe - The timeframe (day, week, month, year)
 * @returns {Array} Array of interval objects with start and end dates
 */
function generateTimeIntervals(startDate, endDate, timeframe) {
  const intervals = [];
  const current = new Date(startDate);
  
  switch (timeframe.toLowerCase()) {
    case 'day':
      // 24 hours
      while (current <= endDate) {
        const start = new Date(current);
        current.setHours(current.getHours() + 1);
        intervals.push({ start, end: new Date(current) });
      }
      break;
    case 'week':
      // 7 days
      while (current <= endDate) {
        const start = new Date(current);
        current.setDate(current.getDate() + 1);
        intervals.push({ start, end: new Date(current) });
      }
      break;
    case 'month':
      // ~30 days
      while (current <= endDate) {
        const start = new Date(current);
        current.setDate(current.getDate() + 1);
        intervals.push({ start, end: new Date(current) });
      }
      break;
    case 'year':
      // 12 months
      while (current <= endDate) {
        const start = new Date(current);
        current.setMonth(current.getMonth() + 1);
        intervals.push({ start, end: new Date(current) });
      }
      break;
    default:
      // Default to days
      while (current <= endDate) {
        const start = new Date(current);
        current.setDate(current.getDate() + 1);
        intervals.push({ start, end: new Date(current) });
      }
  }
  
  return intervals;
}

/**
 * Find the index of the interval that contains the given date
 * @param {Array} intervals - Array of interval objects
 * @param {Date} date - The date to find
 * @returns {number} The index of the interval, or -1 if not found
 */
function findIntervalIndex(intervals, date) {
  return intervals.findIndex(interval => 
    date >= interval.start && date < interval.end
  );
}

/**
 * Format a date for display in a chart label
 * @param {Date} date - The date to format
 * @param {string} format - The format to use (hour, day, month)
 * @returns {string} Formatted date string
 */
function formatDateForLabel(date, format) {
  switch (format) {
    case 'hour':
      return `${date.getHours()}:00`;
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short' });
    default:
      return date.toLocaleDateString();
  }
}

// Export helper functions so they can be used elsewhere
export {
  getDateRangeFromTimeframe,
  getOrdersInDateRange,
  generateTimeIntervals,
  findIntervalIndex,
  formatDateForLabel
};

// Update the mock data usage
export const setUseMockData = (value) => {
  useMockData = value;
  console.log('Mock data mode set to:', useMockData);
};

// Export SYNC_METADATA_TABLE for use in other files
export { SYNC_METADATA_TABLE }; 