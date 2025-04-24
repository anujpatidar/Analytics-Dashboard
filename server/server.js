require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Shopify = require('shopify-api-node');
const AWS = require('aws-sdk');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

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

// Shopify Webhook Verification function
function verifyShopifyWebhook(req) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const topic = req.headers['x-shopify-topic'];
  const shop = req.headers['x-shopify-shop-domain'];
  
  if (!hmac || !topic || !shop) {
    return false;
  }
  
  const crypto = require('crypto');
  const message = req.rawBody || JSON.stringify(req.body);
  const generated_hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(message)
    .digest('base64');
  
  return hmac === generated_hash;
}

// Capture raw body for webhook verification
app.use('/api/webhooks', express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Shopify webhook endpoints
app.post('/api/webhooks/orders', async (req, res) => {
  try {
    // Verify webhook
    if (!verifyShopifyWebhook(req)) {
      console.log('Invalid webhook signature');
      return res.status(401).send('Invalid webhook signature');
    }
    
    const order = req.body;
    console.log(`Received webhook for order ${order.id}, event: ${req.headers['x-shopify-topic']}`);
    
    // Process order based on the webhook topic
    const topic = req.headers['x-shopify-topic'];
    
    if (useAWS) {
      const params = {
        TableName: process.env.ORDERS_TABLE || 'ShopifyOrders-dev',
        Item: {
          id: order.id.toString(),
          name: order.name,
          status: order.financial_status || 'unknown',
          date: new Date(order.created_at).toISOString().split('T')[0],
          created_at: order.created_at,
          updated_at: order.updated_at,
          total: order.total_price || '0.00',
          currency: order.currency || 'USD',
          customer: order.customer ? {
            id: order.customer.id.toString(),
            name: `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim(),
            email: order.customer.email,
          } : null,
          line_items: order.line_items.map(item => ({
            id: item.id.toString(),
            product_id: item.product_id.toString(),
            title: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
          shipping_address: order.shipping_address ? {
            address1: order.shipping_address.address1,
            city: order.shipping_address.city,
            province: order.shipping_address.province,
            country: order.shipping_address.country,
            zip: order.shipping_address.zip,
          } : null,
        }
      };
      
      if (topic === 'orders/deleted') {
        // Delete order from DynamoDB
        await dynamoDB.delete({
          TableName: process.env.ORDERS_TABLE || 'ShopifyOrders-dev',
          Key: {
            id: order.id.toString()
          }
        }).promise();
        
        console.log(`Order ${order.id} deleted from DynamoDB`);
      } else {
        // Create or update order in DynamoDB
        await dynamoDB.put(params).promise();
        console.log(`Order ${order.id} saved to DynamoDB`);
      }
      
      // Update cache
      if (cachedData.orders) {
        if (topic === 'orders/deleted') {
          cachedData.orders = cachedData.orders.filter(o => o.id.toString() !== order.id.toString());
        } else {
          const orderIndex = cachedData.orders.findIndex(o => o.id.toString() === order.id.toString());
          if (orderIndex >= 0) {
            cachedData.orders[orderIndex] = order;
          } else {
            cachedData.orders.push(order);
          }
        }
      }
    }
    
    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing order webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

app.post('/api/webhooks/products', async (req, res) => {
  try {
    // Verify webhook
    if (!verifyShopifyWebhook(req)) {
      console.log('Invalid webhook signature');
      return res.status(401).send('Invalid webhook signature');
    }
    
    const product = req.body;
    console.log(`Received webhook for product ${product.id}, event: ${req.headers['x-shopify-topic']}`);
    
    // Process product based on the webhook topic
    const topic = req.headers['x-shopify-topic'];
    
    if (useAWS) {
      if (topic === 'products/delete') {
        // Delete product from DynamoDB
        await dynamoDB.delete({
          TableName: process.env.PRODUCTS_TABLE || 'ShopifyProducts-dev',
          Key: {
            id: product.id.toString()
          }
        }).promise();
        
        console.log(`Product ${product.id} deleted from DynamoDB`);
      } else {
        // Create or update product in DynamoDB
        const params = {
          TableName: process.env.PRODUCTS_TABLE || 'ShopifyProducts-dev',
          Item: {
            id: product.id.toString(),
            title: product.title,
            handle: product.handle,
            description: product.body_html || '',
            created_at: product.created_at,
            updated_at: product.updated_at,
            type: product.product_type || '',
            tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
            variants: product.variants.map(variant => ({
              id: variant.id.toString(),
              title: variant.title,
              price: variant.price,
              sku: variant.sku || '',
              inventory: variant.inventory_quantity || 0,
            })),
            images: product.images ? product.images.map(image => ({
              id: image.id.toString(),
              position: image.position,
              src: image.src,
              alt: image.alt || '',
            })) : [],
          }
        };
        
        await dynamoDB.put(params).promise();
        console.log(`Product ${product.id} saved to DynamoDB`);
      }
      
      // Update cache
      if (cachedData.products) {
        if (topic === 'products/delete') {
          cachedData.products = cachedData.products.filter(p => p.id.toString() !== product.id.toString());
        } else {
          const productIndex = cachedData.products.findIndex(p => p.id.toString() === product.id.toString());
          if (productIndex >= 0) {
            cachedData.products[productIndex] = product;
          } else {
            cachedData.products.push(product);
          }
        }
      }
    }
    
    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing product webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

app.post('/api/webhooks/customers', async (req, res) => {
  try {
    // Verify webhook
    if (!verifyShopifyWebhook(req)) {
      console.log('Invalid webhook signature');
      return res.status(401).send('Invalid webhook signature');
    }
    
    const customer = req.body;
    console.log(`Received webhook for customer ${customer.id}, event: ${req.headers['x-shopify-topic']}`);
    
    // Process customer based on the webhook topic
    const topic = req.headers['x-shopify-topic'];
    
    if (useAWS) {
      if (topic === 'customers/delete') {
        // Delete customer from DynamoDB
        await dynamoDB.delete({
          TableName: process.env.CUSTOMERS_TABLE || 'ShopifyCustomers-dev',
          Key: {
            id: customer.id.toString()
          }
        }).promise();
        
        console.log(`Customer ${customer.id} deleted from DynamoDB`);
      } else {
        // Create or update customer in DynamoDB
        const params = {
          TableName: process.env.CUSTOMERS_TABLE || 'ShopifyCustomers-dev',
          Item: {
            id: customer.id.toString(),
            email: customer.email,
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            created_at: customer.created_at,
            updated_at: customer.updated_at,
            orders_count: customer.orders_count || 0,
            total_spent: customer.total_spent || '0.00',
            phone: customer.phone || '',
            addresses: customer.addresses ? customer.addresses.map(address => ({
              id: address.id.toString(),
              address1: address.address1 || '',
              city: address.city || '',
              province: address.province || '',
              country: address.country || '',
              zip: address.zip || '',
              default: address.default || false,
            })) : [],
            tags: customer.tags ? customer.tags.split(',').map(tag => tag.trim()) : [],
          }
        };
        
        await dynamoDB.put(params).promise();
        console.log(`Customer ${customer.id} saved to DynamoDB`);
      }
      
      // Update cache
      if (cachedData.customers) {
        if (topic === 'customers/delete') {
          cachedData.customers = cachedData.customers.filter(c => c.id.toString() !== customer.id.toString());
        } else {
          const customerIndex = cachedData.customers.findIndex(c => c.id.toString() === customer.id.toString());
          if (customerIndex >= 0) {
            cachedData.customers[customerIndex] = customer;
          } else {
            cachedData.customers.push(customer);
          }
        }
      }
    }
    
    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing customer webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

// API endpoint to register Shopify webhooks
app.post('/api/webhooks/register', async (req, res) => {
  try {
    // Get the server's public URL (replace with your actual URL in production)
    const baseUrl = req.protocol + '://' + req.get('host');
    
    // Register webhooks for orders
    await shopify.webhook.create({
      topic: 'orders/create',
      address: `${baseUrl}/api/webhooks/orders`,
      format: 'json'
    });
    
    await shopify.webhook.create({
      topic: 'orders/updated',
      address: `${baseUrl}/api/webhooks/orders`,
      format: 'json'
    });
    
    await shopify.webhook.create({
      topic: 'orders/deleted',
      address: `${baseUrl}/api/webhooks/orders`,
      format: 'json'
    });
    
    // Register webhooks for products
    await shopify.webhook.create({
      topic: 'products/create',
      address: `${baseUrl}/api/webhooks/products`,
      format: 'json'
    });
    
    await shopify.webhook.create({
      topic: 'products/update',
      address: `${baseUrl}/api/webhooks/products`,
      format: 'json'
    });
    
    await shopify.webhook.create({
      topic: 'products/delete',
      address: `${baseUrl}/api/webhooks/products`,
      format: 'json'
    });
    
    // Register webhooks for customers
    await shopify.webhook.create({
      topic: 'customers/create',
      address: `${baseUrl}/api/webhooks/customers`,
      format: 'json'
    });
    
    await shopify.webhook.create({
      topic: 'customers/update',
      address: `${baseUrl}/api/webhooks/customers`,
      format: 'json'
    });
    
    await shopify.webhook.create({
      topic: 'customers/delete',
      address: `${baseUrl}/api/webhooks/customers`,
      format: 'json'
    });
    
    res.status(200).json({ message: 'Webhooks registered successfully' });
  } catch (error) {
    console.error('Error registering webhooks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if AWS credentials are provided
const useAWS = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

// Initialize AWS DynamoDB if credentials are provided
let dynamoDB;
if (useAWS) {
  AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}

// In-memory cache for demo purposes (replace with DynamoDB in production)
let cachedData = {
  orders: null,
  products: null,
  customers: null,
  lastUpdated: null,
};

// API routes
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'week';
    
    // If we haven't cached data yet or it's been more than 30 minutes
    if (!cachedData.lastUpdated || 
        new Date() - cachedData.lastUpdated > 30 * 60 * 1000) {
      await syncShopifyData();
    }
    
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
    
    // Filter orders within the date range
    const ordersInRange = cachedData.orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
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
    
    const ordersInPreviousRange = cachedData.orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= previousStartDate && orderDate <= previousEndDate;
    });
    
    // Calculate sales summary
    const totalSales = ordersInRange.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
    const previousTotalSales = ordersInPreviousRange.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
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
    const productsInStock = cachedData.products.filter(product => {
      return product.variants.some(variant => variant.inventory_quantity > 0);
    });
    
    const lowStockThreshold = 5;
    const lowStockProducts = cachedData.products.filter(product => {
      return product.variants.some(variant => 
        variant.inventory_quantity > 0 && variant.inventory_quantity <= lowStockThreshold
      );
    });
    
    const outOfStockProducts = cachedData.products.filter(product => {
      return product.variants.every(variant => variant.inventory_quantity <= 0);
    });
    
    // Calculate top selling products
    const productSales = {};
    ordersInRange.forEach(order => {
      order.line_items.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            id: item.product_id,
            name: item.name.split(' - ')[0], // Remove variant info
            sales: 0,
          };
        }
        productSales[item.product_id].sales += item.quantity;
      });
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
        totalProducts: cachedData.products.length,
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        topSellingProducts,
      }
    };
    
    res.json(summaryData);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/sales', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'week';
    
    // If we haven't cached data yet or it's been more than 30 minutes
    if (!cachedData.lastUpdated || 
        new Date() - cachedData.lastUpdated > 30 * 60 * 1000) {
      await syncShopifyData();
    }
    
    // Generate different data based on timeframe
    let labels;
    let dataPoints = {
      revenue: [],
      orders: [],
    };
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        // Create 24 hour slots
        labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        // Initialize revenue and orders counts for each hour
        for (let i = 0; i < 24; i++) {
          dataPoints.revenue[i] = 0;
          dataPoints.orders[i] = 0;
        }
        // Populate with actual data
        cachedData.orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          if (orderDate >= startDate && orderDate <= endDate) {
            const hour = orderDate.getHours();
            dataPoints.revenue[hour] += parseFloat(order.total_price);
            dataPoints.orders[hour]++;
          }
        });
        break;
        
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        // Create 7 day slots
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        // Initialize revenue and orders counts for each day
        for (let i = 0; i < 7; i++) {
          dataPoints.revenue[i] = 0;
          dataPoints.orders[i] = 0;
        }
        // Populate with actual data
        cachedData.orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          if (orderDate >= startDate && orderDate <= endDate) {
            // Convert to day of week (0 = Sunday, 1 = Monday, etc.)
            // Adjust to make Monday index 0
            const dayOfWeek = (orderDate.getDay() + 6) % 7;
            dataPoints.revenue[dayOfWeek] += parseFloat(order.total_price);
            dataPoints.orders[dayOfWeek]++;
          }
        });
        break;
        
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        // Create 30 day slots
        labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
        // Initialize revenue and orders counts for each day
        for (let i = 0; i < 30; i++) {
          dataPoints.revenue[i] = 0;
          dataPoints.orders[i] = 0;
        }
        // Populate with actual data
        cachedData.orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          if (orderDate >= startDate && orderDate <= endDate) {
            // Calculate days since start date (0-indexed)
            const dayIndex = Math.floor((orderDate - startDate) / (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex < 30) {
              dataPoints.revenue[dayIndex] += parseFloat(order.total_price);
              dataPoints.orders[dayIndex]++;
            }
          }
        });
        break;
        
      case 'year':
      default:
        startDate.setFullYear(endDate.getFullYear() - 1);
        // Create 12 month slots
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Initialize revenue and orders counts for each month
        for (let i = 0; i < 12; i++) {
          dataPoints.revenue[i] = 0;
          dataPoints.orders[i] = 0;
        }
        // Populate with actual data
        cachedData.orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          if (orderDate >= startDate && orderDate <= endDate) {
            const month = orderDate.getMonth();
            dataPoints.revenue[month] += parseFloat(order.total_price);
            dataPoints.orders[month]++;
          }
        });
        break;
    }
    
    // If there's no real data, use sample data for demonstration
    if (dataPoints.revenue.every(val => val === 0)) {
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
    
    res.json({
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
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/recent', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    // If we haven't cached data yet or it's been more than 30 minutes
    if (!cachedData.lastUpdated || 
        new Date() - cachedData.lastUpdated > 30 * 60 * 1000) {
      await syncShopifyData();
    }
    
    // Sort orders by date (newest first)
    const sortedOrders = [...cachedData.orders].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    
    // Paginate
    const start = (page - 1) * pageSize;
    const paginatedOrders = sortedOrders.slice(start, start + pageSize);
    
    // Transform to the format expected by the frontend
    const orders = paginatedOrders.map(order => ({
      id: order.name, // Order name (e.g., "#1001")
      customer: order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Guest',
      date: order.created_at,
      total: parseFloat(order.total_price),
      status: order.financial_status.charAt(0).toUpperCase() + order.financial_status.slice(1),
      items: order.line_items.length,
      paymentMethod: order.payment_gateway_names[0] || 'Unknown',
    }));
    
    res.json({
      orders,
      total: sortedOrders.length,
      page,
      pageSize,
      totalPages: Math.ceil(sortedOrders.length / pageSize),
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Function to sync data from Shopify
async function syncShopifyData() {
  try {
    console.log('Syncing data from Shopify...');
    
    // Fetch orders
    const orders = await shopify.order.list({ limit: 250, status: 'any' });
    
    // Fetch products
    const products = await shopify.product.list({ limit: 250 });
    
    // Fetch customers
    const customers = await shopify.customer.list({ limit: 250 });
    
    // Update cached data
    cachedData.orders = orders;
    cachedData.products = products;
    cachedData.customers = customers;
    cachedData.lastUpdated = new Date();
    
    console.log('Shopify data sync completed successfully.');
    
    // If AWS is configured, store data in DynamoDB
    if (useAWS) {
      await storeDataInDynamoDB(orders, products, customers);
    }
  } catch (error) {
    console.error('Error syncing data from Shopify:', error);
    throw error;
  }
}

// Function to store data in DynamoDB
async function storeDataInDynamoDB(orders, products, customers) {
  if (!dynamoDB) return;
  
  try {
    console.log('Storing data in DynamoDB...');
    
    // Process and store orders
    const orderPromises = orders.map(order => {
      const params = {
        TableName: 'ShopifyOrders',
        Item: {
          id: order.id.toString(),
          date: new Date(order.created_at).toISOString().split('T')[0],
          name: order.name,
          customer: order.customer ? {
            id: order.customer.id,
            name: `${order.customer.first_name} ${order.customer.last_name}`,
            email: order.customer.email,
          } : null,
          total: order.total_price,
          subtotal: order.subtotal_price,
          tax: order.total_tax,
          currency: order.currency,
          status: order.financial_status,
          fulfillmentStatus: order.fulfillment_status || 'unfulfilled',
          items: order.line_items.length,
          created_at: order.created_at,
        },
      };
      
      return dynamoDB.put(params).promise();
    });
    
    // Process and store products
    const productPromises = products.map(product => {
      const params = {
        TableName: 'ShopifyProducts',
        Item: {
          id: product.id.toString(),
          title: product.title,
          handle: product.handle,
          description: product.body_html,
          type: product.product_type,
          vendor: product.vendor,
          status: product.status,
          variants: product.variants.map(variant => ({
            id: variant.id.toString(),
            title: variant.title,
            price: variant.price,
            sku: variant.sku,
            inventory: variant.inventory_quantity,
          })),
          created_at: product.created_at,
          updated_at: product.updated_at,
        },
      };
      
      return dynamoDB.put(params).promise();
    });
    
    // Process and store customers
    const customerPromises = customers.map(customer => {
      const params = {
        TableName: 'ShopifyCustomers',
        Item: {
          id: customer.id.toString(),
          firstName: customer.first_name,
          lastName: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          ordersCount: customer.orders_count,
          totalSpent: customer.total_spent,
          created_at: customer.created_at,
          updated_at: customer.updated_at,
        },
      };
      
      return dynamoDB.put(params).promise();
    });
    
    // Execute all promises
    await Promise.all([
      ...orderPromises,
      ...productPromises,
      ...customerPromises,
    ]);
    
    console.log('Data stored successfully in DynamoDB.');
  } catch (error) {
    console.error('Error storing data in DynamoDB:', error);
    throw error;
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initial data sync
setTimeout(() => {
  syncShopifyData().catch(console.error);
}, 2000);

// Set up a timer to sync data every 30 minutes
setInterval(() => {
  syncShopifyData().catch(console.error);
}, 30 * 60 * 1000); 