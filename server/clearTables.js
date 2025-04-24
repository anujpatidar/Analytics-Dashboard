// Script to clear all DynamoDB tables before a fresh sync
require('dotenv').config();
const AWS = require('aws-sdk');

// Initialize AWS DynamoDB
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamoDBClient = new AWS.DynamoDB();

// Define table names from environment variables with defaults
const TABLES = {
  ORDERS: process.env.ORDERS_TABLE || 'ShopifyOrders-dev',
  PRODUCTS: process.env.PRODUCTS_TABLE || 'ShopifyProducts-dev',
  CUSTOMERS: process.env.CUSTOMERS_TABLE || 'ShopifyCustomers-dev',
  SYNC_METADATA: process.env.SYNC_METADATA_TABLE || 'ShopifySyncMetadata-dev'
};

/**
 * Clear all items from a DynamoDB table
 * @param {string} tableName - DynamoDB table name
 * @returns {Promise<void>}
 */
const clearTable = async (tableName) => {
  try {
    console.log(`Scanning all items from ${tableName}...`);
    
    // Determine the primary key based on the table
    const keyName = tableName === TABLES.SYNC_METADATA ? 'syncId' : 'id';
    
    // Get all items from the table
    const scanResult = await dynamoDB.scan({
      TableName: tableName,
      ProjectionExpression: keyName
    }).promise();
    
    console.log(`Found ${scanResult.Items.length} items in ${tableName}`);
    
    if (scanResult.Items.length === 0) {
      console.log(`Table ${tableName} is already empty.`);
      return;
    }
    
    // Batch delete all items
    const batchSize = 25; // DynamoDB batch write limit
    for (let i = 0; i < scanResult.Items.length; i += batchSize) {
      const batch = scanResult.Items.slice(i, i + batchSize);
      
      // Prepare batch items for deletion
      const deleteRequests = batch.map(item => ({
        DeleteRequest: {
          Key: {
            [keyName]: item[keyName]
          }
        }
      }));
      
      // Skip if no items to delete
      if (deleteRequests.length === 0) continue;
      
      console.log(`Deleting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(scanResult.Items.length/batchSize)} (${deleteRequests.length} items) from ${tableName}...`);
      
      // Delete items from DynamoDB
      await dynamoDB.batchWrite({
        RequestItems: {
          [tableName]: deleteRequests
        }
      }).promise();
      
      console.log(`Deleted batch of ${deleteRequests.length} items from ${tableName}`);
    }
    
    console.log(`Successfully cleared table ${tableName}`);
  } catch (error) {
    console.error(`Error clearing table ${tableName}:`, error);
    throw error;
  }
};

/**
 * Clear all DynamoDB tables
 * @returns {Promise<void>}
 */
const clearAllTables = async () => {
  console.log('Starting to clear all DynamoDB tables...');
  
  try {
    // Clear each table
    await clearTable(TABLES.ORDERS);
    await clearTable(TABLES.PRODUCTS);
    await clearTable(TABLES.CUSTOMERS);
    await clearTable(TABLES.SYNC_METADATA);
    
    console.log('Successfully cleared all DynamoDB tables');
  } catch (error) {
    console.error('Error clearing DynamoDB tables:', error);
    throw error;
  }
};

// Run the clear tables function
clearAllTables()
  .then(() => {
    console.log('All tables cleared successfully. Ready for a fresh sync.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to clear tables:', error);
    process.exit(1);
  }); 