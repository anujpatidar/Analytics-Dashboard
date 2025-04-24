const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Handler for API requests routed through API Gateway
 * @param {Object} event - API Gateway Lambda proxy event
 * @param {Object} context - Lambda context
 * @returns {Promise<Object>} API Gateway response object
 */
exports.handler = async (event, context) => {
  console.log('API Lambda invoked', { 
    path: event.path,
    method: event.httpMethod,
    queryParams: event.queryStringParameters
  });
  
  try {
    // Parse the request path and method
    const path = event.path;
    const method = event.httpMethod;
    
    // Route the request to the appropriate handler
    if (path === '/orders' && method === 'GET') {
      return await getOrders(event.queryStringParameters);
    } else if (path === '/products' && method === 'GET') {
      return await getProducts(event.queryStringParameters);
    } else if (path === '/customers' && method === 'GET') {
      return await getCustomers(event.queryStringParameters);
    } else if (path === '/dashboard/summary' && method === 'GET') {
      return await getDashboardSummary();
    } else if (path === '/sync/status' && method === 'GET') {
      return await getSyncStatus();
    } else {
      return formatResponse(404, { error: 'Route not found' });
    }
  } catch (error) {
    console.error('Error processing API request', error);
    return formatResponse(500, { 
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Format standard API response with consistent headers and structure
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data to return
 * @returns {Object} Formatted API response
 */
function formatResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
    },
    body: JSON.stringify(data)
  };
}

/**
 * Get orders with optional filtering and pagination
 * @param {Object} queryParams - Query parameters from the request
 * @returns {Promise<Object>} API Gateway response object
 */
async function getOrders(queryParams = {}) {
  const { limit = 20, startKey, dateFrom, dateTo } = queryParams;
  const params = {
    TableName: process.env.ORDERS_TABLE || 'ShopifyOrders',
    Limit: parseInt(limit)
  };

  // Add pagination support
  if (startKey) {
    params.ExclusiveStartKey = JSON.parse(Buffer.from(startKey, 'base64').toString());
  }

  // Add date filtering if provided
  if (dateFrom || dateTo) {
    params.FilterExpression = '';
    params.ExpressionAttributeValues = {};
    params.ExpressionAttributeNames = { '#date': 'date' };
    
    if (dateFrom) {
      params.FilterExpression += '#date >= :dateFrom';
      params.ExpressionAttributeValues[':dateFrom'] = dateFrom;
    }
    
    if (dateTo) {
      if (params.FilterExpression) {
        params.FilterExpression += ' AND ';
      }
      params.FilterExpression += '#date <= :dateTo';
      params.ExpressionAttributeValues[':dateTo'] = dateTo;
    }
  }

  const result = await dynamoDB.scan(params).promise();
  
  // Generate next page token if there are more results
  let nextToken = null;
  if (result.LastEvaluatedKey) {
    nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
  }

  return formatResponse(200, {
    orders: result.Items,
    count: result.Count,
    nextToken
  });
}

/**
 * Get products with optional filtering and pagination
 * @param {Object} queryParams - Query parameters from the request
 * @returns {Promise<Object>} API Gateway response object
 */
async function getProducts(queryParams = {}) {
  const { limit = 20, startKey } = queryParams;
  const params = {
    TableName: process.env.PRODUCTS_TABLE || 'ShopifyProducts',
    Limit: parseInt(limit)
  };

  if (startKey) {
    params.ExclusiveStartKey = JSON.parse(Buffer.from(startKey, 'base64').toString());
  }

  const result = await dynamoDB.scan(params).promise();
  
  let nextToken = null;
  if (result.LastEvaluatedKey) {
    nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
  }

  return formatResponse(200, {
    products: result.Items,
    count: result.Count,
    nextToken
  });
}

/**
 * Get customers with optional filtering and pagination
 * @param {Object} queryParams - Query parameters from the request
 * @returns {Promise<Object>} API Gateway response object
 */
async function getCustomers(queryParams = {}) {
  const { limit = 20, startKey } = queryParams;
  const params = {
    TableName: process.env.CUSTOMERS_TABLE || 'ShopifyCustomers',
    Limit: parseInt(limit)
  };

  if (startKey) {
    params.ExclusiveStartKey = JSON.parse(Buffer.from(startKey, 'base64').toString());
  }

  const result = await dynamoDB.scan(params).promise();
  
  let nextToken = null;
  if (result.LastEvaluatedKey) {
    nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
  }

  return formatResponse(200, {
    customers: result.Items,
    count: result.Count,
    nextToken
  });
}

/**
 * Get dashboard summary metrics
 * @returns {Promise<Object>} API Gateway response object with dashboard summary data
 */
async function getDashboardSummary() {
  // Get the latest sync metadata
  const syncMetadata = await dynamoDB.get({
    TableName: process.env.SYNC_METADATA_TABLE || 'ShopifySyncMetadata',
    Key: {
      syncId: 'latest'
    }
  }).promise();

  // Get order summary - count orders and calculate revenue
  const ordersParams = {
    TableName: process.env.ORDERS_TABLE || 'ShopifyOrders',
    Select: 'COUNT'
  };
  const ordersCount = await dynamoDB.scan(ordersParams).promise();
  
  // Scan for total revenue (in a real app you might use a more efficient approach)
  const revenueParams = {
    TableName: process.env.ORDERS_TABLE || 'ShopifyOrders',
    ProjectionExpression: 'total'
  };
  const revenueData = await dynamoDB.scan(revenueParams).promise();
  const totalRevenue = revenueData.Items.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
  
  // Get product count
  const productsParams = {
    TableName: process.env.PRODUCTS_TABLE || 'ShopifyProducts',
    Select: 'COUNT'
  };
  const productsCount = await dynamoDB.scan(productsParams).promise();
  
  // Get customer count
  const customersParams = {
    TableName: process.env.CUSTOMERS_TABLE || 'ShopifyCustomers',
    Select: 'COUNT'
  };
  const customersCount = await dynamoDB.scan(customersParams).promise();
  
  return formatResponse(200, {
    summary: {
      totalOrders: ordersCount.Count,
      totalRevenue,
      totalProducts: productsCount.Count,
      totalCustomers: customersCount.Count,
      lastSyncTime: syncMetadata.Item ? syncMetadata.Item.completedAt : null
    }
  });
}

/**
 * Get sync status from the metadata table
 * @returns {Promise<Object>} API Gateway response with sync status
 */
async function getSyncStatus() {
  const result = await dynamoDB.get({
    TableName: process.env.SYNC_METADATA_TABLE || 'ShopifySyncMetadata',
    Key: {
      syncId: 'latest'
    }
  }).promise();
  
  return formatResponse(200, {
    syncStatus: result.Item || { status: 'never_run' }
  });
} 