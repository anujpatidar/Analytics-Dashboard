require('dotenv').config();
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const Shopify = require('shopify-api-node');
const AWS = require('aws-sdk');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Shopify API client
const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORE_URL,
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_API_SECRET,
});

// Initialize AWS DynamoDB
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Define table names from environment variables with defaults
const TABLES = {
  ORDERS: process.env.ORDERS_TABLE || 'ShopifyOrders',
  PRODUCTS: process.env.PRODUCTS_TABLE || 'ShopifyProducts',
  CUSTOMERS: process.env.CUSTOMERS_TABLE || 'ShopifyCustomers',
  SYNC_METADATA: process.env.SYNC_METADATA_TABLE || 'ShopifySyncMetadata'
};

// Helper function for consistent response format
const formatResponse = (res, statusCode, data) => {
  return res.status(statusCode).json(data);
};

// API routes
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'week';
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    // Query orders from DynamoDB
    const ordersParams = {
      TableName: TABLES.ORDERS,
      FilterExpression: '#date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date',
      },
      ExpressionAttributeValues: {
        ':startDate': startDate.toISOString().split('T')[0],
        ':endDate': endDate.toISOString().split('T')[0],
      },
    };
    
    const ordersResult = await dynamoDB.scan(ordersParams).promise();
    const ordersInRange = ordersResult.Items;
    
    // Calculate previous period
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    
    const previousStartDate = new Date(previousEndDate);
    switch (timeframe) {
      case 'day':
        previousStartDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'week':
        previousStartDate.setDate(previousEndDate.getDate() - 7);
        break;
      case 'month':
        previousStartDate.setMonth(previousEndDate.getMonth() - 1);
        break;
      case 'year':
        previousStartDate.setFullYear(previousEndDate.getFullYear() - 1);
        break;
    }
    
    const previousOrdersParams = {
      TableName: TABLES.ORDERS,
      FilterExpression: '#date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date',
      },
      ExpressionAttributeValues: {
        ':startDate': previousStartDate.toISOString().split('T')[0],
        ':endDate': previousEndDate.toISOString().split('T')[0],
      },
    };
    
    const previousOrdersResult = await dynamoDB.scan(previousOrdersParams).promise();
    const ordersInPreviousRange = previousOrdersResult.Items;
    
    // Get all products
    const productsParams = {
      TableName: TABLES.PRODUCTS,
    };
    
    const productsResult = await dynamoDB.scan(productsParams).promise();
    const products = productsResult.Items;
    
    // Calculate sales summary
    const totalSales = ordersInRange.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const previousTotalSales = ordersInPreviousRange.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const salesPercentageChange = previousTotalSales > 0
      ? ((totalSales - previousTotalSales) / previousTotalSales) * 100
      : 0;
    
    // Calculate orders summary
    const totalOrders = ordersInRange.length;
    const previousTotalOrders = ordersInPreviousRange.length;
    const ordersPercentageChange = previousTotalOrders > 0
      ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100
      : 0;
    
    // Calculate customer count (unique customers in the period)
    const customerIds = new Set(ordersInRange.map(order => order.customer?.id).filter(Boolean));
    const previousCustomerIds = new Set(ordersInPreviousRange.map(order => order.customer?.id).filter(Boolean));
    const totalCustomers = customerIds.size;
    const previousTotalCustomers = previousCustomerIds.size;
    const customersPercentageChange = previousTotalCustomers > 0
      ? ((totalCustomers - previousTotalCustomers) / previousTotalCustomers) * 100
      : 0;
    
    // Calculate inventory summary
    const lowStockThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;
    
    const lowStockProducts = products.filter(product => {
      return product.variants.some(variant => 
        variant.inventory > 0 && variant.inventory <= lowStockThreshold
      );
    });
    
    const outOfStockProducts = products.filter(product => {
      return product.variants.every(variant => variant.inventory <= 0);
    });
    
    // Calculate top selling products
    const productSales = {};
    ordersInRange.forEach(order => {
      if (order.line_items) {
        order.line_items.forEach(item => {
          const productId = item.product_id.toString();
          if (!productSales[productId]) {
            const product = products.find(p => p.id === productId);
            productSales[productId] = {
              id: productId,
              name: product ? product.title : `Product ${productId}`,
              sales: 0,
            };
          }
          productSales[productId].sales += item.quantity;
        });
      }
    });
    
    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3);
    
    const summaryData = {
      salesSummary: {
        totalSales,
        percentageChange: salesPercentageChange,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
        conversionRate: 3.6, // Sample data, would need analytics
        revenuePerVisitor: 3.2, // Sample data, would need analytics
      },
      ordersSummary: {
        totalOrders,
        percentageChange: ordersPercentageChange,
        abandonedCarts: Math.round(totalOrders * 0.3), // Estimate
        abandonmentRate: 23.4, // Sample data, would need analytics
        returningCustomers: 45.2, // Sample data, would need analytics
      },
      customersSummary: {
        totalCustomers,
        percentageChange: customersPercentageChange,
        newCustomers: Math.round(totalCustomers * 0.25), // Estimate
        activeCustomers: Math.round(totalCustomers * 0.65), // Estimate
        churnRate: 5.3, // Sample data, would need analytics
      },
      inventorySummary: {
        totalProducts: products.length,
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        topSellingProducts,
      }
    };
    
    return formatResponse(res, 200, summaryData);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return formatResponse(res, 500, { error: error.message });
  }
});

app.get('/api/analytics/sales', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'week';
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    // Query orders from DynamoDB
    const ordersParams = {
      TableName: TABLES.ORDERS,
      FilterExpression: '#date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date',
      },
      ExpressionAttributeValues: {
        ':startDate': startDate.toISOString().split('T')[0],
        ':endDate': endDate.toISOString().split('T')[0],
      },
    };
    
    const ordersResult = await dynamoDB.scan(ordersParams).promise();
    const orders = ordersResult.Items;
    
    // Generate different data based on timeframe
    let labels;
    let dataPoints = {
      revenue: [],
      orders: [],
    };
    
    switch (timeframe) {
      case 'day':
        // Create 24 hour slots
        labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        // Initialize revenue and orders counts for each hour
        for (let i = 0; i < 24; i++) {
          dataPoints.revenue[i] = 0;
          dataPoints.orders[i] = 0;
        }
        // Populate with actual data
        orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          if (orderDate >= startDate && orderDate <= endDate) {
            const hour = orderDate.getHours();
            dataPoints.revenue[hour] += parseFloat(order.total);
            dataPoints.orders[hour]++;
          }
        });
        break;
        
      case 'week':
        // Create 7 day slots
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        // Initialize revenue and orders counts for each day
        for (let i = 0; i < 7; i++) {
          dataPoints.revenue[i] = 0;
          dataPoints.orders[i] = 0;
        }
        // Populate with actual data
        orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          if (orderDate >= startDate && orderDate <= endDate) {
            // Convert to day of week (0 = Sunday, 1 = Monday, etc.)
            // Adjust to make Monday index 0
            const dayOfWeek = (orderDate.getDay() + 6) % 7;
            dataPoints.revenue[dayOfWeek] += parseFloat(order.total);
            dataPoints.orders[dayOfWeek]++;
          }
        });
        break;
        
      case 'month':
        // Create 30 day slots
        labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
        // Initialize revenue and orders counts for each day
        for (let i = 0; i < 30; i++) {
          dataPoints.revenue[i] = 0;
          dataPoints.orders[i] = 0;
        }
        // Populate with actual data
        orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          if (orderDate >= startDate && orderDate <= endDate) {
            // Calculate days since start date (0-indexed)
            const dayIndex = Math.floor((orderDate - startDate) / (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex < 30) {
              dataPoints.revenue[dayIndex] += parseFloat(order.total);
              dataPoints.orders[dayIndex]++;
            }
          }
        });
        break;
        
      case 'year':
      default:
        // Create 12 month slots
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Initialize revenue and orders counts for each month
        for (let i = 0; i < 12; i++) {
          dataPoints.revenue[i] = 0;
          dataPoints.orders[i] = 0;
        }
        // Populate with actual data
        orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          if (orderDate >= startDate && orderDate <= endDate) {
            const month = orderDate.getMonth();
            dataPoints.revenue[month] += parseFloat(order.total);
            dataPoints.orders[month]++;
          }
        });
        break;
    }
    
    // If there's no real data, use sample data for demonstration
    const useSampleData = process.env.USE_SAMPLE_DATA === 'true' || dataPoints.revenue.every(val => val === 0);
    if (useSampleData) {
      switch (timeframe) {
        case 'day':
          dataPoints.revenue = Array.from({ length: 24 }, () => Math.floor(Math.random() * 500) + 200);
          dataPoints.orders = Array.from({ length: 24 }, () => Math.floor(Math.random() * 20) + 5);
          break;
        case 'week':
          dataPoints.revenue = [3200, 4100, 2900, 5600, 4800, 7100, 6300];
          dataPoints.orders = [38, 45, 32, 55, 48, 72, 63];
          break;
        case 'month':
          dataPoints.revenue = Array.from({ length: 30 }, () => Math.floor(Math.random() * 2000) + 2000);
          dataPoints.orders = Array.from({ length: 30 }, () => Math.floor(Math.random() * 30) + 20);
          break;
        case 'year':
          dataPoints.revenue = [32000, 38000, 42000, 36000, 48000, 53000, 57000, 63000, 59000, 67000, 72000, 78000];
          dataPoints.orders = [320, 380, 420, 360, 480, 530, 570, 630, 590, 670, 720, 780];
          break;
      }
    }
    
    const totalRevenue = dataPoints.revenue.reduce((sum, value) => sum + value, 0);
    const totalOrders = dataPoints.orders.reduce((sum, value) => sum + value, 0);
    
    return formatResponse(res, 200, {
      labels,
      datasets: [
        {
          id: 'revenue',
          label: 'Revenue',
          data: dataPoints.revenue,
          color: '#0073B6',
        },
        {
          id: 'orders',
          label: 'Orders',
          data: dataPoints.orders,
          color: '#4CAF50',
        },
      ],
      totalRevenue,
      totalOrders,
      averageRevenue: Math.round(totalRevenue / dataPoints.revenue.length),
      averageOrders: Math.round(totalOrders / dataPoints.orders.length),
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    return formatResponse(res, 500, { error: error.message });
  }
});

app.get('/api/orders/recent', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    // Query orders from DynamoDB
    const params = {
      TableName: TABLES.ORDERS,
    };
    
    const result = await dynamoDB.scan(params).promise();
    const allOrders = result.Items;
    
    // Sort orders by date (newest first)
    const sortedOrders = [...allOrders].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    
    // Paginate
    const start = (page - 1) * pageSize;
    const paginatedOrders = sortedOrders.slice(start, start + pageSize);
    
    // Transform to the format expected by the frontend
    const orders = paginatedOrders.map(order => ({
      id: order.name, // Order name (e.g., "#1001")
      customer: order.customer ? `${order.customer.name}` : 'Guest',
      date: order.created_at,
      total: parseFloat(order.total),
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      items: order.items,
      paymentMethod: order.payment_method || 'Credit Card', // Use payment method from order or default
    }));
    
    return formatResponse(res, 200, {
      orders,
      total: sortedOrders.length,
      page,
      pageSize,
      totalPages: Math.ceil(sortedOrders.length / pageSize),
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return formatResponse(res, 500, { error: error.message });
  }
});

// Get sync status endpoint
app.get('/api/sync/status', async (req, res) => {
  try {
    const result = await dynamoDB.get({
      TableName: TABLES.SYNC_METADATA,
      Key: {
        syncId: 'latest'
      }
    }).promise();
    
    return formatResponse(res, 200, {
      syncStatus: result.Item || { status: 'never_run' }
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return formatResponse(res, 500, { error: error.message });
  }
});

// Handle 404
app.use((req, res) => {
  return formatResponse(res, 404, { error: 'Not found' });
});

// Handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  return formatResponse(res, 500, { error: err.message });
});

// Create lambda handler
module.exports.handler = serverless(app); 