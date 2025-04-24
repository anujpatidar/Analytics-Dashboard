/**
 * Multi-file Order CSV Import Script
 * 
 * This script imports multiple order CSV files into DynamoDB.
 * It's designed to handle cases where you have multiple order data files.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const csv = require('csv-parser');
const AWS = require('aws-sdk');

// Explicitly set AWS credentials from environment variables
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Verify AWS credentials are available
console.log('AWS Region:', process.env.AWS_REGION);
console.log('AWS Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '**********' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'NOT SET');
console.log('AWS Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? '**********' : 'NOT SET');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Define table names from environment variables with defaults
const TABLES = {
  ORDERS: process.env.ORDERS_TABLE || 'ShopifyOrders',
  SYNC_METADATA: process.env.SYNC_METADATA_TABLE || 'ShopifySyncMetadata'
};

console.log('Using DynamoDB tables:', TABLES);

/**
 * Transform CSV rows specific to the Shopify order export format
 * @param {Object} row - CSV row data
 * @returns {Object|null} - Formatted order for DynamoDB or null if invalid
 */
function transformOrderRow(row) {
  try {
    // Get the Order ID - handle the fact that it might have a single quote prefix
    let orderId = row['Order ID'] || row['Name'] || row['Id'] || '';
    if (orderId.startsWith("'")) {
      orderId = orderId.substring(1);
    }
    
    // Validate required fields
    if (!orderId) {
      console.warn('Skipping order row with missing Order ID');
      return null;
    }
    
    // Extract customer information
    const customerId = row['Customer ID'] || row['Customer Id'] || '';
    const customerName = `${row['Shipping Name'] || row['Billing Name'] || ''}`.trim();
    const customerEmail = row['Email'] || '';
    
    // Extract shipping and billing address
    const shippingAddress = {
      name: row['Shipping Name'] || '',
      company: row['Shipping Company'] || '',
      address1: row['Shipping Street'] || row['Shipping Address1'] || '',
      address2: row['Shipping Address2'] || '',
      city: row['Shipping City'] || '',
      province: row['Shipping Province'] || row['Shipping Region'] || '',
      country: row['Shipping Country'] || '',
      zip: row['Shipping Zip'] || row['Shipping Postal Code'] || '',
      phone: row['Shipping Phone'] || ''
    };
    
    const billingAddress = {
      name: row['Billing Name'] || '',
      company: row['Billing Company'] || '',
      address1: row['Billing Street'] || row['Billing Address1'] || '',
      address2: row['Billing Address2'] || '',
      city: row['Billing City'] || '',
      province: row['Billing Province'] || row['Billing Region'] || '',
      country: row['Billing Country'] || '',
      zip: row['Billing Zip'] || row['Billing Postal Code'] || '',
      phone: row['Billing Phone'] || ''
    };
    
    // Parse line items if available
    let lineItems = [];
    try {
      // Check if we have direct line item details
      if (row['Lineitem name']) {
        // This is a format where each row represents one line item
        lineItems.push({
          id: row['Lineitem id'] || `item-${Date.now()}-${Math.random()}`,
          product_id: row['Lineitem product id'] || null,
          variant_id: row['Lineitem variant id'] || null,
          title: row['Lineitem name'] || 'Unknown Product',
          quantity: parseInt(row['Lineitem quantity'] || '1', 10),
          price: row['Lineitem price'] || '0.00',
          sku: row['Lineitem sku'] || '',
          requires_shipping: row['Lineitem requires shipping'] === 'true'
        });
      }
    } catch (err) {
      console.warn(`Could not parse line items for order ${orderId}: ${err.message}`);
      lineItems = [];
    }
    
    // Parse numeric values
    const total = parseFloat(row['Total'] || row['Paid Amount'] || '0.00');
    const subtotal = parseFloat(row['Subtotal'] || '0.00');
    const tax = parseFloat(row['Taxes'] || row['Tax'] || '0.00');
    
    // Get order dates
    let createdAt = row['Created at'] || row['Created At'] || '';
    if (!createdAt) {
      createdAt = new Date().toISOString();
    }
    
    // Extract the date part for easy querying
    const date = createdAt.split('T')[0];
    
    // Transform to DynamoDB format
    return {
      id: orderId.toString(),
      name: row['Name'] || `Order #${orderId}`,
      status: row['Financial Status'] || row['Status'] || 'unknown',
      fulfillment_status: row['Fulfillment Status'] || 'unfulfilled',
      date: date,
      created_at: createdAt,
      updated_at: row['Updated at'] || row['Updated At'] || createdAt,
      total: total.toFixed(2),
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      currency: row['Currency'] || 'INR', // Assuming INR for Indian orders
      customer: {
        id: customerId.toString() || null,
        name: customerName || 'Unknown',
        email: customerEmail || '',
      },
      line_items: lineItems,
      shipping_address: Object.values(shippingAddress).some(v => v) ? shippingAddress : null,
      billing_address: Object.values(billingAddress).some(v => v) ? billingAddress : null,
      tags: row['Tags'] ? row['Tags'].split(',').map(tag => tag.trim()) : [],
      discount_codes: row['Discount Codes'] ? row['Discount Codes'].split(',').map(code => ({ code: code.trim() })) : [],
      note: row['Notes'] || '',
      cancelled_at: row['Cancelled at'] || null,
      processed_at: row['Processed at'] || null,
      synced_at: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error transforming order row:', err);
    console.log('Problematic row:', JSON.stringify(row));
    return null;
  }
}

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
    
    let putRequests = batch.map(item => ({
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
 * Import from CSV file with custom transformation
 * @param {string} csvFilePath - Path to CSV file
 * @param {string} tableName - DynamoDB table name
 * @returns {Promise<Object>} - Import stats
 */
function importCustomCsv(csvFilePath, tableName) {
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
    let itemBuffer = [];
    const flushSize = 100;  // Process 100 items at a time
    
    // Create a stream transformer to process chunks of data
    const processChunk = async () => {
      if (itemBuffer.length === 0) return;
      
      const itemsToProcess = [...itemBuffer];
      itemBuffer = [];
      
      try {
        const { successCount, errorCount } = await writeBatchToDynamoDB(itemsToProcess, tableName);
        totalSuccess += successCount;
        totalErrors += errorCount;
        
        // Log progress
        console.log(`Processed batch: ${successCount} succeeded, ${errorCount} failed (Total: ${totalProcessed} processed so far)`);
      } catch (error) {
        console.error('Error processing chunk:', error);
        totalErrors += itemsToProcess.length;
      }
    };
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', async (row) => {
        totalProcessed++;
        
        // Transform the row
        const transformedItem = transformOrderRow(row);
        if (transformedItem) {
          itemBuffer.push(transformedItem);
          
          // Process in chunks to avoid memory issues
          if (itemBuffer.length >= flushSize) {
            await processChunk();
          }
        }
      })
      .on('end', async () => {
        // Process any remaining items
        await processChunk();
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`Import completed for ${tableName}`);
        console.log(`Processed ${totalProcessed} items in ${duration.toFixed(2)} seconds`);
        console.log(`Success: ${totalSuccess}, Errors: ${totalErrors}`);
        
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
 * Update the last sync timestamp for a resource
 * @param {string} resource - Resource name (orders)
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
 * Test the DynamoDB connection
 * @returns {Promise<boolean>} - True if connection works
 */
async function testDynamoDBConnection() {
  try {
    console.log('Testing DynamoDB connection...');
    
    // Try a simple operation to test the connection
    const result = await dynamoDB.scan({
      TableName: TABLES.SYNC_METADATA,
      Limit: 1
    }).promise();
    
    console.log('DynamoDB connection successful!');
    return true;
  } catch (error) {
    console.error('DynamoDB connection test failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

/**
 * Import multiple order CSV files
 * @param {Object} options - Import options
 * @returns {Promise<Object>} - Import results
 */
async function importMultipleOrderFiles(options = {}) {
  const defaultOptions = {
    ordersPattern: 'order*.csv',
    dataDir: './data',
  };
  
  const config = { ...defaultOptions, ...options };
  console.log('Starting multi-file order CSV import with options:', config);
  
  // Test DynamoDB connection before proceeding
  const connectionSuccessful = await testDynamoDBConnection();
  if (!connectionSuccessful) {
    throw new Error('Unable to connect to DynamoDB. Please check your AWS credentials and network connection.');
  }
  
  const startTime = Date.now();
  const dataDir = path.resolve(config.dataDir);
  
  // Verify data directory exists
  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory ${dataDir} does not exist!`);
    throw new Error(`Data directory ${dataDir} not found`);
  }
  
  // Find all matching order CSV files
  const pattern = path.join(dataDir, config.ordersPattern);
  const orderFiles = glob.sync(pattern);
  
  if (orderFiles.length === 0) {
    console.error(`No order files found matching pattern: ${pattern}`);
    throw new Error('No order files found');
  }
  
  console.log(`Found ${orderFiles.length} order CSV files to import`);
  
  // Record import start
  await updateSyncMetadata({
    syncId: `multi_csv_import_orders_${Date.now()}`,
    status: 'started',
    startedAt: new Date().toISOString(),
    fileCount: orderFiles.length
  });
  
  // Track overall statistics
  const totalStats = {
    files: orderFiles.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    startTime,
    filesCompleted: 0
  };
  
  // Process each file in sequence
  for (let i = 0; i < orderFiles.length; i++) {
    const filePath = orderFiles[i];
    const fileName = path.basename(filePath);
    
    console.log(`\n===== PROCESSING FILE ${i+1}/${orderFiles.length}: ${fileName} =====`);
    
    try {
      // Import this file using our custom import function
      const fileStats = await importCustomCsv(filePath, TABLES.ORDERS);
      
      // Update overall stats
      totalStats.processed += fileStats.processed;
      totalStats.succeeded += fileStats.succeeded;
      totalStats.failed += fileStats.failed;
      totalStats.filesCompleted++;
      
      // Log progress
      console.log(`File ${i+1}/${orderFiles.length} complete. Progress: ${((i+1)/orderFiles.length*100).toFixed(1)}%`);
      console.log(`Running totals - Processed: ${totalStats.processed}, Succeeded: ${totalStats.succeeded}, Failed: ${totalStats.failed}`);
      
      // Update metadata every few files
      if ((i + 1) % 5 === 0 || i === orderFiles.length - 1) {
        await updateSyncMetadata({
          syncId: `multi_csv_import_orders_progress`,
          status: 'in_progress',
          filesCompleted: totalStats.filesCompleted,
          totalFiles: orderFiles.length,
          itemsProcessed: totalStats.processed,
          itemsSucceeded: totalStats.succeeded,
          itemsFailed: totalStats.failed,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`Error processing file ${fileName}:`, error);
      totalStats.filesCompleted++;
      // Continue with next file
    }
  }
  
  // Calculate final stats
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Update the last sync timestamp
  await updateLastSyncTimestamp('orders', new Date().toISOString());
  
  // Record import completion
  await updateSyncMetadata({
    syncId: `multi_csv_import_orders_${Date.now()}`,
    status: 'completed',
    completedAt: new Date().toISOString(),
    totalStats: {
      files: totalStats.files,
      filesCompleted: totalStats.filesCompleted,
      processed: totalStats.processed,
      succeeded: totalStats.succeeded,
      failed: totalStats.failed,
      duration
    }
  });
  
  console.log('\n===== MULTI-FILE ORDER CSV IMPORT COMPLETED =====');
  console.log(`Processed ${totalStats.files} files with ${totalStats.processed} total records in ${duration.toFixed(2)} seconds`);
  console.log(`Total succeeded: ${totalStats.succeeded}, Total failed: ${totalStats.failed}`);
  
  return {
    totalStats: {
      files: totalStats.files,
      filesCompleted: totalStats.filesCompleted,
      processed: totalStats.processed,
      succeeded: totalStats.succeeded,
      failed: totalStats.failed,
      duration
    }
  };
}

// If this file is run directly (not imported)
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--pattern=')) options.ordersPattern = arg.split('=')[1];
    if (arg.startsWith('--data-dir=')) options.dataDir = arg.split('=')[1];
  });
  
  importMultipleOrderFiles(options)
    .then(results => {
      console.log('Multi-file order CSV import completed successfully.');
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Multi-file order CSV import failed:', error);
      process.exit(1);
    });
} else {
  // Export functions when used as a module
  module.exports = {
    importMultipleOrderFiles
  };
} 