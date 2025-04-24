// Mock Sync Script - Uses local mock data instead of fetching from Shopify API
require('dotenv').config();
const AWS = require('aws-sdk');

// Initialize AWS DynamoDB
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Define table names from environment variables with defaults
const TABLES = {
  ORDERS: process.env.ORDERS_TABLE || 'ShopifyOrders-dev',
  PRODUCTS: process.env.PRODUCTS_TABLE || 'ShopifyProducts-dev',
  CUSTOMERS: process.env.CUSTOMERS_TABLE || 'ShopifyCustomers-dev',
  SYNC_METADATA: process.env.SYNC_METADATA_TABLE || 'ShopifySyncMetadata-dev'
};

async function mockSync() {
  console.log('Starting mock Shopify data sync...');
  
  try {
    await Promise.all([
      syncMockOrders(),
      syncMockProducts(),
      syncMockCustomers(),
    ]);
    
    // Update sync metadata with completion information
    await updateSyncMetadata({
      status: 'completed',
      completedAt: new Date().toISOString(),
      error: null
    });
    
    console.log('Mock Shopify data sync completed successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Mock sync completed successfully',
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('Error syncing mock Shopify data:', error);
    
    // Update sync metadata with error information
    await updateSyncMetadata({
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: error.message
    }).catch(err => {
      console.error('Failed to update sync metadata with error status:', err);
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
}

// Mock data synchronization functions
async function syncMockOrders() {
  console.log('Syncing mock orders...');
  
  // Sample mock orders
  const mockOrders = [
    {
      id: '1001',
      name: '#1001',
      status: 'paid',
      date: '2023-04-23',
      created_at: '2023-04-23T10:00:00Z',
      updated_at: '2023-04-23T10:30:00Z',
      total: '129.99',
      currency: 'USD',
      customer: {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      line_items: [
        {
          id: '10001',
          product_id: '101',
          title: 'Premium T-Shirt',
          quantity: 2,
          price: '29.99',
        },
        {
          id: '10002',
          product_id: '102',
          title: 'Designer Jeans',
          quantity: 1,
          price: '69.99',
        }
      ],
      shipping_address: {
        address1: '123 Main St',
        city: 'New York',
        province: 'NY',
        country: 'USA',
        zip: '10001',
      }
    },
    {
      id: '1002',
      name: '#1002',
      status: 'paid',
      date: '2023-04-22',
      created_at: '2023-04-22T15:45:00Z',
      updated_at: '2023-04-22T16:00:00Z',
      total: '79.95',
      currency: 'USD',
      customer: {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      },
      line_items: [
        {
          id: '10003',
          product_id: '103',
          title: 'Running Shoes',
          quantity: 1,
          price: '79.95',
        }
      ],
      shipping_address: {
        address1: '456 Oak Ave',
        city: 'Los Angeles',
        province: 'CA',
        country: 'USA',
        zip: '90001',
      }
    }
  ];
  
  try {
    // Batch write to DynamoDB (25 items per batch)
    const batchSize = 25;
    for (let i = 0; i < mockOrders.length; i += batchSize) {
      const batch = mockOrders.slice(i, i + batchSize);
      
      // Prepare batch items
      const putRequests = batch.map(order => ({
        PutRequest: {
          Item: order
        }
      }));
      
      // Skip if no items to write
      if (putRequests.length === 0) continue;
      
      // Write to DynamoDB
      await dynamoDB.batchWrite({
        RequestItems: {
          [TABLES.ORDERS]: putRequests
        }
      }).promise();
      
      console.log(`Synced batch of ${putRequests.length} mock orders`);
    }
    
    // Update last sync timestamp
    await updateLastSyncTimestamp('orders', new Date().toISOString());
    
    console.log('Mock orders sync completed');
  } catch (error) {
    console.error('Error syncing mock orders:', error);
    throw error;
  }
}

async function syncMockProducts() {
  console.log('Syncing mock products...');
  
  // Sample mock products
  const mockProducts = [
    {
      id: '101',
      title: 'Premium T-Shirt',
      handle: 'premium-t-shirt',
      description: 'High-quality cotton t-shirt',
      created_at: '2023-01-15T09:00:00Z',
      updated_at: '2023-04-20T14:30:00Z',
      type: 'Apparel',
      tags: ['t-shirt', 'apparel', 'cotton'],
      variants: [
        {
          id: '1011',
          title: 'Small',
          price: '29.99',
          sku: 'TS-S-001',
          inventory: 45,
        },
        {
          id: '1012',
          title: 'Medium',
          price: '29.99',
          sku: 'TS-M-001',
          inventory: 32,
        },
        {
          id: '1013',
          title: 'Large',
          price: '29.99',
          sku: 'TS-L-001',
          inventory: 28,
        }
      ],
      images: [
        {
          id: '10001',
          position: 1,
          src: 'https://example.com/images/t-shirt.jpg',
          alt: 'Premium T-Shirt',
        }
      ]
    },
    {
      id: '102',
      title: 'Designer Jeans',
      handle: 'designer-jeans',
      description: 'Stylish designer jeans',
      created_at: '2023-02-10T11:15:00Z',
      updated_at: '2023-04-18T16:45:00Z',
      type: 'Apparel',
      tags: ['jeans', 'apparel', 'denim'],
      variants: [
        {
          id: '1021',
          title: '30x32',
          price: '69.99',
          sku: 'DJ-30-32',
          inventory: 12,
        },
        {
          id: '1022',
          title: '32x32',
          price: '69.99',
          sku: 'DJ-32-32',
          inventory: 18,
        },
        {
          id: '1023',
          title: '34x32',
          price: '69.99',
          sku: 'DJ-34-32',
          inventory: 15,
        }
      ],
      images: [
        {
          id: '10002',
          position: 1,
          src: 'https://example.com/images/jeans.jpg',
          alt: 'Designer Jeans',
        }
      ]
    },
    {
      id: '103',
      title: 'Running Shoes',
      handle: 'running-shoes',
      description: 'Professional running shoes',
      created_at: '2023-03-05T08:30:00Z',
      updated_at: '2023-04-15T12:20:00Z',
      type: 'Footwear',
      tags: ['shoes', 'footwear', 'running'],
      variants: [
        {
          id: '1031',
          title: 'Size 8',
          price: '79.95',
          sku: 'RS-8',
          inventory: 8,
        },
        {
          id: '1032',
          title: 'Size 9',
          price: '79.95',
          sku: 'RS-9',
          inventory: 14,
        },
        {
          id: '1033',
          title: 'Size 10',
          price: '79.95',
          sku: 'RS-10',
          inventory: 10,
        }
      ],
      images: [
        {
          id: '10003',
          position: 1,
          src: 'https://example.com/images/shoes.jpg',
          alt: 'Running Shoes',
        }
      ]
    }
  ];
  
  try {
    // Batch write to DynamoDB (25 items per batch)
    const batchSize = 25;
    for (let i = 0; i < mockProducts.length; i += batchSize) {
      const batch = mockProducts.slice(i, i + batchSize);
      
      // Prepare batch items
      const putRequests = batch.map(product => ({
        PutRequest: {
          Item: product
        }
      }));
      
      // Skip if no items to write
      if (putRequests.length === 0) continue;
      
      // Write to DynamoDB
      await dynamoDB.batchWrite({
        RequestItems: {
          [TABLES.PRODUCTS]: putRequests
        }
      }).promise();
      
      console.log(`Synced batch of ${putRequests.length} mock products`);
    }
    
    // Update last sync timestamp
    await updateLastSyncTimestamp('products', new Date().toISOString());
    
    console.log('Mock products sync completed');
  } catch (error) {
    console.error('Error syncing mock products:', error);
    throw error;
  }
}

async function syncMockCustomers() {
  console.log('Syncing mock customers...');
  
  // Sample mock customers
  const mockCustomers = [
    {
      id: '1',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      created_at: '2023-01-10T14:20:00Z',
      updated_at: '2023-04-21T09:15:00Z',
      orders_count: 3,
      total_spent: '259.97',
      phone: '555-123-4567',
      addresses: [
        {
          id: '101',
          address1: '123 Main St',
          city: 'New York',
          province: 'NY',
          country: 'USA',
          zip: '10001',
          default: true,
        }
      ],
      tags: ['loyal', 'repeat-customer']
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      created_at: '2023-02-15T11:30:00Z',
      updated_at: '2023-04-22T16:00:00Z',
      orders_count: 1,
      total_spent: '79.95',
      phone: '555-987-6543',
      addresses: [
        {
          id: '201',
          address1: '456 Oak Ave',
          city: 'Los Angeles',
          province: 'CA',
          country: 'USA',
          zip: '90001',
          default: true,
        }
      ],
      tags: ['new-customer']
    },
    {
      id: '3',
      email: 'sam.johnson@example.com',
      first_name: 'Sam',
      last_name: 'Johnson',
      created_at: '2023-03-20T16:45:00Z',
      updated_at: '2023-04-18T13:40:00Z',
      orders_count: 2,
      total_spent: '149.98',
      phone: '555-456-7890',
      addresses: [
        {
          id: '301',
          address1: '789 Pine St',
          city: 'Chicago',
          province: 'IL',
          country: 'USA',
          zip: '60007',
          default: true,
        },
        {
          id: '302',
          address1: '101 Business Ave',
          city: 'Chicago',
          province: 'IL',
          country: 'USA',
          zip: '60008',
          default: false,
        }
      ],
      tags: ['repeat-customer']
    }
  ];
  
  try {
    // Batch write to DynamoDB (25 items per batch)
    const batchSize = 25;
    for (let i = 0; i < mockCustomers.length; i += batchSize) {
      const batch = mockCustomers.slice(i, i + batchSize);
      
      // Prepare batch items
      const putRequests = batch.map(customer => ({
        PutRequest: {
          Item: customer
        }
      }));
      
      // Skip if no items to write
      if (putRequests.length === 0) continue;
      
      // Write to DynamoDB
      await dynamoDB.batchWrite({
        RequestItems: {
          [TABLES.CUSTOMERS]: putRequests
        }
      }).promise();
      
      console.log(`Synced batch of ${putRequests.length} mock customers`);
    }
    
    // Update last sync timestamp
    await updateLastSyncTimestamp('customers', new Date().toISOString());
    
    console.log('Mock customers sync completed');
  } catch (error) {
    console.error('Error syncing mock customers:', error);
    throw error;
  }
}

/**
 * Update sync metadata in DynamoDB
 * @param {Object} data - Metadata to store
 * @returns {Promise<void>}
 */
const updateSyncMetadata = async (data) => {
  try {
    const metadataItem = {
      syncId: 'latest',
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await dynamoDB.put({
      TableName: TABLES.SYNC_METADATA,
      Item: metadataItem
    }).promise();
    
    console.log('Updated sync metadata:', data);
  } catch (error) {
    console.error('Error updating sync metadata:', error);
    throw error;
  }
};

/**
 * Get the last sync timestamp for a resource
 * @param {string} resource - Resource name (orders, products, customers)
 * @returns {Promise<string|null>} - Last sync timestamp or null if not found
 */
const getLastSyncTimestamp = async (resource) => {
  try {
    const result = await dynamoDB.get({
      TableName: TABLES.SYNC_METADATA,
      Key: {
        syncId: `${resource}_last_sync`,
      }
    }).promise();
    
    return result.Item?.last_sync || null;
  } catch (error) {
    console.error(`Error getting last sync timestamp for ${resource}:`, error);
    return null;
  }
};

/**
 * Update the last sync timestamp for a resource
 * @param {string} resource - Resource name (orders, products, customers)
 * @param {string} timestamp - ISO timestamp
 * @returns {Promise<void>}
 */
const updateLastSyncTimestamp = async (resource, timestamp) => {
  try {
    await dynamoDB.put({
      TableName: TABLES.SYNC_METADATA,
      Item: {
        syncId: `${resource}_last_sync`,
        last_sync: timestamp,
        updatedAt: new Date().toISOString()
      }
    }).promise();
    
    console.log(`Updated last sync timestamp for ${resource} to ${timestamp}`);
  } catch (error) {
    console.error(`Error updating last sync timestamp for ${resource}:`, error);
  }
};

// Run the mock sync function
mockSync()
  .then(result => {
    console.log('Mock sync completed with result:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('Mock sync failed:', error);
    process.exit(1);
  }); 