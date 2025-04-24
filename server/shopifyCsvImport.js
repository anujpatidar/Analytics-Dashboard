/**
 * Shopify CSV Import Script
 * 
 * This script allows bulk importing of Shopify data from CSV files into DynamoDB tables.
 * Use this for initial data seeding instead of the standard sync process when dealing with large datasets.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const AWS = require('aws-sdk');
const { Transform } = require('stream');

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

/**
 * Process a chunk of data and write to DynamoDB in batches
 * @param {Array} items - Items to write to DynamoDB
 * @param {string} tableName - DynamoDB table name
 * @returns {Promise<Object>} - Success and error counts
 */
async function writeBatchToDynamoDB(items, tableName) {
  if (!items || items.length === 0) return { successCount: 0, errorCount: 0 };
  
  const batchSize = 25; // DynamoDB max batch size
  let successCount = 0;
  let errorCount = 0;
  
  // Process in batches of 25 items (DynamoDB batch limit)
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const putRequests = batch.map(item => ({
      PutRequest: {
        Item: item
      }
    }));
    
    // Skip if no items to write
    if (putRequests.length === 0) continue;
    
    console.log(`Writing batch of ${putRequests.length} items to ${tableName}...`);
    
    // Write to DynamoDB with retries
    let success = false;
    let retries = 0;
    const maxRetries = 5;
    
    while (!success && retries < maxRetries) {
      try {
        // Add delay between batches to avoid throttling
        if (retries > 0) {
          const delay = Math.min(100 * Math.pow(2, retries), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await dynamoDB.batchWrite({
          RequestItems: {
            [tableName]: putRequests
          }
        }).promise();
        
        // Check for unprocessed items
        if (result.UnprocessedItems && 
            result.UnprocessedItems[tableName] && 
            result.UnprocessedItems[tableName].length > 0) {
          
          const unprocessedCount = result.UnprocessedItems[tableName].length;
          console.warn(`Batch partially processed: ${putRequests.length - unprocessedCount} items written, ${unprocessedCount} items unprocessed`);
          
          // Only count the processed items as successful
          successCount += (putRequests.length - unprocessedCount);
          
          // Retry with just the unprocessed items
          putRequests = result.UnprocessedItems[tableName];
          retries++;
          
          if (retries >= maxRetries) {
            console.error(`Failed to process ${unprocessedCount} items after ${maxRetries} attempts`);
            errorCount += unprocessedCount;
            success = true; // Exit retry loop but record the errors
          }
        } else {
          // All items processed successfully
          successCount += putRequests.length;
          success = true;
        }
      } catch (error) {
        retries++;
        
        if (error.code === 'ProvisionedThroughputExceededException') {
          console.warn(`DynamoDB throughput exceeded. Attempt ${retries}/${maxRetries}`);
          // Longer wait for throughput errors
          await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retries - 1)));
        } else {
          console.error(`Error writing batch to DynamoDB (attempt ${retries}/${maxRetries}):`, error);
          
          if (retries < maxRetries) {
            // Exponential backoff for other errors
            const delay = Math.pow(2, retries) * 200;
            console.log(`Retrying after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            errorCount += putRequests.length;
            console.error(`Failed to write batch after ${maxRetries} attempts`);
            success = true; // Exit retry loop
          }
        }
      }
    }
  }
  
  return { successCount, errorCount };
}

/**
 * Transform CSV rows to proper DynamoDB format for orders
 * @param {Object} row - CSV row data
 * @returns {Object|null} - Formatted order for DynamoDB or null if invalid
 */
function transformOrderRow(row) {
  try {
    // Validate required fields
    if (!row.id) {
      console.warn('Skipping order row with missing ID');
      return null;
    }
    
    const order = {
      id: row.id.toString(),
      name: row.name || `Order #${row.id}`,
      status: row.financial_status || 'unknown',
      fulfillment_status: row.fulfillment_status || 'unfulfilled',
      date: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
      total: row.total_price || '0.00',
      subtotal: row.subtotal_price || '0.00',
      tax: row.total_tax || '0.00',
      currency: row.currency || 'USD',
      synced_at: new Date().toISOString()
    };
    
    // Handle customer info if present
    if (row.customer_id) {
      order.customer = {
        id: row.customer_id.toString(),
        name: row.customer_name || 'Unknown',
        email: row.customer_email || '',
      };
    }
    
    // Parse line items if they are in JSON format
    if (row.line_items && row.line_items.startsWith('[')) {
      try {
        order.line_items = JSON.parse(row.line_items);
      } catch (e) {
        console.warn(`Could not parse line items for order ${row.id}: ${e.message}`);
        order.line_items = [];
      }
    } else {
      order.line_items = [];
    }
    
    // Parse shipping address if in JSON format
    if (row.shipping_address && row.shipping_address.startsWith('{')) {
      try {
        order.shipping_address = JSON.parse(row.shipping_address);
      } catch (e) {
        console.warn(`Could not parse shipping address for order ${row.id}: ${e.message}`);
      }
    }
    
    // Parse billing address if in JSON format
    if (row.billing_address && row.billing_address.startsWith('{')) {
      try {
        order.billing_address = JSON.parse(row.billing_address);
      } catch (e) {
        console.warn(`Could not parse billing address for order ${row.id}: ${e.message}`);
      }
    }
    
    // Parse tags and discount codes
    if (row.tags) {
      order.tags = row.tags.split(',').map(tag => tag.trim());
    }
    
    if (row.discount_codes && row.discount_codes.startsWith('[')) {
      try {
        order.discount_codes = JSON.parse(row.discount_codes);
      } catch (e) {
        console.warn(`Could not parse discount codes for order ${row.id}: ${e.message}`);
        order.discount_codes = [];
      }
    } else {
      order.discount_codes = [];
    }
    
    return order;
  } catch (err) {
    console.error('Error transforming order row:', err);
    console.log('Problematic row:', row);
    return null;
  }
}

/**
 * Transform CSV rows to proper DynamoDB format for products
 * @param {Object} row - CSV row data
 * @returns {Object|null} - Formatted product for DynamoDB or null if invalid
 */
function transformProductRow(row) {
  try {
    // Validate required fields
    if (!row.id) {
      console.warn('Skipping product row with missing ID');
      return null;
    }
    
    const product = {
      id: row.id.toString(),
      title: row.title || 'Unnamed Product',
      handle: row.handle || '',
      description: row.body_html || '',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
      type: row.product_type || '',
      vendor: row.vendor || '',
      status: row.status || 'active',
      synced_at: new Date().toISOString()
    };
    
    // Parse tags
    if (row.tags) {
      product.tags = row.tags.split(',').map(tag => tag.trim());
    } else {
      product.tags = [];
    }
    
    // Parse variants if in JSON format
    if (row.variants && row.variants.startsWith('[')) {
      try {
        product.variants = JSON.parse(row.variants);
      } catch (e) {
        console.warn(`Could not parse variants for product ${row.id}: ${e.message}`);
        product.variants = [];
      }
    } else {
      product.variants = [];
    }
    
    // Parse options if in JSON format
    if (row.options && row.options.startsWith('[')) {
      try {
        product.options = JSON.parse(row.options);
      } catch (e) {
        console.warn(`Could not parse options for product ${row.id}: ${e.message}`);
        product.options = [];
      }
    } else {
      product.options = [];
    }
    
    // Parse images if in JSON format
    if (row.images && row.images.startsWith('[')) {
      try {
        product.images = JSON.parse(row.images);
      } catch (e) {
        console.warn(`Could not parse images for product ${row.id}: ${e.message}`);
        product.images = [];
      }
    } else {
      product.images = [];
    }
    
    return product;
  } catch (err) {
    console.error('Error transforming product row:', err);
    console.log('Problematic row:', row);
    return null;
  }
}

/**
 * Transform CSV rows to proper DynamoDB format for customers
 * @param {Object} row - CSV row data
 * @returns {Object|null} - Formatted customer for DynamoDB or null if invalid
 */
function transformCustomerRow(row) {
  try {
    // Validate required fields
    if (!row.id) {
      console.warn('Skipping customer row with missing ID');
      return null;
    }
    
    const customer = {
      id: row.id.toString(),
      email: row.email || '',
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
      orders_count: parseInt(row.orders_count || '0', 10),
      total_spent: row.total_spent || '0.00',
      phone: row.phone || '',
      state: row.state || 'enabled',
      note: row.note || '',
      tax_exempt: row.tax_exempt === 'true' || row.tax_exempt === true,
      verified_email: row.verified_email === 'true' || row.verified_email === true,
      synced_at: new Date().toISOString()
    };
    
    // Parse tags
    if (row.tags) {
      customer.tags = row.tags.split(',').map(tag => tag.trim());
    } else {
      customer.tags = [];
    }
    
    // Parse addresses if in JSON format
    if (row.addresses && row.addresses.startsWith('[')) {
      try {
        customer.addresses = JSON.parse(row.addresses);
      } catch (e) {
        console.warn(`Could not parse addresses for customer ${row.id}: ${e.message}`);
        customer.addresses = [];
      }
    } else {
      customer.addresses = [];
    }
    
    if (row.last_order_id) {
      customer.last_order_id = row.last_order_id.toString();
    }
    
    if (row.last_order_date) {
      customer.last_order_date = row.last_order_date;
    }
    
    return customer;
  } catch (err) {
    console.error('Error transforming customer row:', err);
    console.log('Problematic row:', row);
    return null;
  }
}

/**
 * Transformer to chunk CSV data to avoid memory issues with large files
 */
class ChunkTransformer extends Transform {
  constructor(options) {
    super({ objectMode: true });
    this.chunks = [];
    this.chunkSize = options.chunkSize || 100;
    this.transform = options.transform;
  }
  
  _transform(row, encoding, callback) {
    // Transform the row data
    const transformedRow = this.transform(row);
    
    if (transformedRow) {
      this.chunks.push(transformedRow);
    }
    
    // When we reach chunk size, emit the chunk and reset
    if (this.chunks.length >= this.chunkSize) {
      this.push(this.chunks);
      this.chunks = [];
    }
    
    callback();
  }
  
  _flush(callback) {
    // Emit any remaining chunks
    if (this.chunks.length > 0) {
      this.push(this.chunks);
    }
    callback();
  }
}

/**
 * Import data from a CSV file into DynamoDB
 * @param {string} csvFilePath - Path to CSV file
 * @param {string} tableName - DynamoDB table name to import into
 * @param {Function} transformFn - Function to transform CSV row to DynamoDB item
 * @returns {Promise<Object>} - Import stats
 */
async function importFromCsv(csvFilePath, tableName, transformFn) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csvFilePath)) {
      reject(new Error(`CSV file not found: ${csvFilePath}`));
      return;
    }
    
    console.log(`Starting import from ${csvFilePath} to ${tableName}`);
    const startTime = Date.now();
    
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    
    const chunkTransformer = new ChunkTransformer({
      chunkSize: 100,  // Process 100 rows at a time
      transform: transformFn
    });
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .pipe(chunkTransformer)
      .on('data', async (chunk) => {
        // Pause the stream until this chunk is processed
        chunkTransformer.pause();
        
        try {
          const { successCount, errorCount } = await writeBatchToDynamoDB(chunk, tableName);
          totalSuccess += successCount;
          totalErrors += errorCount;
          totalProcessed += chunk.length;
          
          // Log progress
          console.log(`Processed ${totalProcessed} items (${totalSuccess} succeeded, ${totalErrors} failed)`);
        } catch (error) {
          console.error('Error processing chunk:', error);
          totalErrors += chunk.length;
        }
        
        // Resume the stream
        chunkTransformer.resume();
      })
      .on('end', async () => {
        const duration = (Date.now() - startTime) / 1000;
        console.log(`Import completed for ${tableName}`);
        console.log(`Processed ${totalProcessed} items in ${duration.toFixed(2)} seconds`);
        console.log(`Success: ${totalSuccess}, Errors: ${totalErrors}`);
        
        // Update the sync timestamp
        const resourceType = tableName.replace('Shopify', '').toLowerCase();
        await updateLastSyncTimestamp(resourceType, new Date().toISOString());
        
        resolve({
          processed: totalProcessed,
          succeeded: totalSuccess,
          failed: totalErrors,
          duration
        });
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

/**
 * Update the last sync timestamp for a resource
 * @param {string} resource - Resource name (orders, products, customers)
 * @param {string} timestamp - ISO timestamp
 * @returns {Promise<void>}
 */
async function updateLastSyncTimestamp(resource, timestamp) {
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
}

/**
 * Update sync metadata in DynamoDB
 * @param {Object} data - Metadata to store
 * @returns {Promise<void>}
 */
async function updateSyncMetadata(data) {
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
}

/**
 * Main function to import all data from CSV files
 * @param {Object} options - Import options
 * @returns {Promise<Object>} - Import results
 */
async function importAllFromCsv(options = {}) {
  const defaultOptions = {
    ordersFile: 'orders.csv',
    productsFile: 'products.csv',
    customersFile: 'customers.csv',
    dataDir: './data',
    skipOrders: false,
    skipProducts: false,
    skipCustomers: false
  };
  
  const config = { ...defaultOptions, ...options };
  console.log('Starting CSV import with options:', config);
  
  const startTime = Date.now();
  
  // Ensure data directory exists
  const dataDir = path.resolve(config.dataDir);
  if (!fs.existsSync(dataDir)) {
    console.warn(`Data directory ${dataDir} does not exist. Creating it.`);
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Track results for each resource
  const results = {
    orders: { processed: 0, succeeded: 0, failed: 0, duration: 0, skipped: config.skipOrders },
    products: { processed: 0, succeeded: 0, failed: 0, duration: 0, skipped: config.skipProducts },
    customers: { processed: 0, succeeded: 0, failed: 0, duration: 0, skipped: config.skipCustomers }
  };
  
  try {
    // Record import start
    await updateSyncMetadata({
      syncId: `csv_import_${Date.now()}`,
      status: 'started',
      startedAt: new Date().toISOString(),
    });
    
    // Import products if not skipped
    if (!config.skipProducts) {
      const productsPath = path.join(dataDir, config.productsFile);
      if (fs.existsSync(productsPath)) {
        console.log(`\n===== IMPORTING PRODUCTS FROM ${productsPath} =====`);
        results.products = await importFromCsv(productsPath, TABLES.PRODUCTS, transformProductRow);
      } else {
        console.warn(`Products file not found: ${productsPath}`);
        results.products.skipped = true;
      }
    }
    
    // Import customers if not skipped
    if (!config.skipCustomers) {
      const customersPath = path.join(dataDir, config.customersFile);
      if (fs.existsSync(customersPath)) {
        console.log(`\n===== IMPORTING CUSTOMERS FROM ${customersPath} =====`);
        results.customers = await importFromCsv(customersPath, TABLES.CUSTOMERS, transformCustomerRow);
      } else {
        console.warn(`Customers file not found: ${customersPath}`);
        results.customers.skipped = true;
      }
    }
    
    // Import orders if not skipped
    if (!config.skipOrders) {
      const ordersPath = path.join(dataDir, config.ordersFile);
      if (fs.existsSync(ordersPath)) {
        console.log(`\n===== IMPORTING ORDERS FROM ${ordersPath} =====`);
        results.orders = await importFromCsv(ordersPath, TABLES.ORDERS, transformOrderRow);
      } else {
        console.warn(`Orders file not found: ${ordersPath}`);
        results.orders.skipped = true;
      }
    }
    
    // Calculate total stats
    const totalProcessed = results.orders.processed + results.products.processed + results.customers.processed;
    const totalSucceeded = results.orders.succeeded + results.products.succeeded + results.customers.succeeded;
    const totalFailed = results.orders.failed + results.products.failed + results.customers.failed;
    const totalDuration = (Date.now() - startTime) / 1000;
    
    // Record import completion
    await updateSyncMetadata({
      syncId: `csv_import_${Date.now()}`,
      status: 'completed',
      completedAt: new Date().toISOString(),
      results,
      totalStats: {
        processed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalFailed,
        duration: totalDuration
      }
    });
    
    console.log('\n===== CSV IMPORT COMPLETED =====');
    console.log(`Total processed: ${totalProcessed} items in ${totalDuration.toFixed(2)} seconds`);
    console.log(`Total succeeded: ${totalSucceeded}, Total failed: ${totalFailed}`);
    
    return {
      results,
      totalStats: {
        processed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalFailed,
        duration: totalDuration
      }
    };
  } catch (error) {
    console.error('Error during CSV import:', error);
    
    // Record import failure
    await updateSyncMetadata({
      syncId: `csv_import_${Date.now()}`,
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: error.message,
      results
    }).catch(err => {
      console.error('Failed to update sync metadata with error status:', err);
    });
    
    throw error;
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg === '--skip-orders') options.skipOrders = true;
    if (arg === '--skip-products') options.skipProducts = true;
    if (arg === '--skip-customers') options.skipCustomers = true;
    if (arg.startsWith('--orders=')) options.ordersFile = arg.split('=')[1];
    if (arg.startsWith('--products=')) options.productsFile = arg.split('=')[1];
    if (arg.startsWith('--customers=')) options.customersFile = arg.split('=')[1];
    if (arg.startsWith('--data-dir=')) options.dataDir = arg.split('=')[1];
  });
  
  importAllFromCsv(options)
    .then(() => {
      console.log('CSV import completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('CSV import failed:', error);
      process.exit(1);
    });
} else {
  // Export functions when used as a module
  module.exports = {
    importAllFromCsv,
    importFromCsv,
    transformOrderRow,
    transformProductRow,
    transformCustomerRow
  };
} 