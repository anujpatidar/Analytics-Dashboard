/**
 * Process Order Export Files
 * 
 * This script processes Shopify order export CSV files from a local directory
 * and imports them directly to DynamoDB without requiring S3.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const csv = require('csv-parser');
const AWS = require('aws-sdk');

// Configure AWS from environment variables
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Define table names from environment variables with defaults
const TABLES = {
  ORDERS: process.env.ORDERS_TABLE || 'ShopifyOrders',
  SYNC_METADATA: process.env.SYNC_METADATA_TABLE || 'ShopifySyncMetadata'
};

// Configuration defaults
const config = {
  // Local file settings
  localPath: process.env.ORDER_EXPORTS_PATH || './order_exports',
  filePattern: '*.csv',
  
  // Processing settings
  batchSize: 25, // DynamoDB batch limit
  maxRetries: 5,
  logProgress: true
};

/**
 * Transform CSV row to order object format for DynamoDB
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
        id: customerId.toString() || 'unknown',
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
      synced_at: new Date().toISOString(),
      import_source: 'csv_export'
    };
  } catch (err) {
    console.error('Error transforming order row:', err);
    return null;
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
      syncId: data.syncId || 'latest',
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await dynamoDB.put({
      TableName: TABLES.SYNC_METADATA,
      Item: metadataItem
    }).promise();
    
    if (config.logProgress) {
      console.log('Updated sync metadata:', data);
    }
  } catch (error) {
    console.error('Error updating sync metadata:', error);
    throw error;
  }
}

/**
 * Update the last sync timestamp for orders
 * @param {string} timestamp - ISO timestamp
 * @returns {Promise<void>}
 */
async function updateLastSyncTimestamp(timestamp) {
  try {
    await dynamoDB.put({
      TableName: TABLES.SYNC_METADATA,
      Item: {
        syncId: 'orders_last_sync',
        last_sync: timestamp,
        updatedAt: new Date().toISOString()
      }
    }).promise();
    
    console.log(`Updated last sync timestamp for orders to ${timestamp}`);
  } catch (error) {
    console.error('Error updating last sync timestamp for orders:', error);
  }
}

/**
 * Process a CSV file and import orders to DynamoDB
 * @param {string} filePath - Path to CSV file
 * @param {string} importId - Import ID for tracking
 * @returns {Promise<Object>} - Import stats
 */
async function processOrderCsvFile(filePath, importId) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }
  
  const fileName = path.basename(filePath);
  console.log(`Processing file: ${fileName}`);
  
  // Update progress
  await updateSyncMetadata({
    syncId: importId,
    status: 'processing',
    currentFile: fileName,
    timestamp: new Date().toISOString()
  });
  
  // Process the CSV file
  const orders = [];
  let rowCount = 0;
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        
        try {
          // Transform the row into the expected DynamoDB format
          const order = transformOrderRow(row);
          if (order) {
            orders.push(order);
          }
        } catch (err) {
          console.error(`Error processing row in ${fileName}:`, err);
        }
      })
      .on('end', () => {
        console.log(`Processed ${rowCount} rows from ${fileName}, extracted ${orders.length} valid orders`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`Error reading CSV file ${fileName}:`, err);
        reject(err);
      });
  });
  
  // Deduplicate orders by ID (in case the same order appears multiple times)
  const uniqueOrders = deduplicateOrders(orders);
  if (uniqueOrders.length < orders.length) {
    console.log(`Removed ${orders.length - uniqueOrders.length} duplicate orders`);
  }
  
  // Write orders to DynamoDB in batches
  console.log(`Writing ${uniqueOrders.length} orders from ${fileName} to DynamoDB...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < uniqueOrders.length; i += config.batchSize) {
    const batch = uniqueOrders.slice(i, i + config.batchSize);
    
    // Prepare batch items
    let putRequests = batch.map(order => ({
      PutRequest: {
        Item: order
      }
    }));
    
    // Skip if no items to write
    if (putRequests.length === 0) continue;
    
    // Write to DynamoDB with retries
    let success = false;
    let retries = 0;
    
    while (!success && retries < config.maxRetries) {
      try {
        // Add delay between batches to avoid throttling
        if (retries > 0) {
          const delay = Math.min(100 * Math.pow(2, retries), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await dynamoDB.batchWrite({
          RequestItems: {
            [TABLES.ORDERS]: putRequests
          }
        }).promise();
        
        // Check for unprocessed items
        if (result.UnprocessedItems && 
            result.UnprocessedItems[TABLES.ORDERS] && 
            result.UnprocessedItems[TABLES.ORDERS].length > 0) {
          
          const unprocessedCount = result.UnprocessedItems[TABLES.ORDERS].length;
          console.warn(`Batch partially processed: ${putRequests.length - unprocessedCount} items written, ${unprocessedCount} items unprocessed`);
          
          // Only count the processed items as successful
          successCount += (putRequests.length - unprocessedCount);
          
          // Retry with just the unprocessed items
          putRequests = result.UnprocessedItems[TABLES.ORDERS];
          retries++;
          
          if (retries >= config.maxRetries) {
            console.error(`Failed to process ${unprocessedCount} items after ${config.maxRetries} attempts`);
            errorCount += unprocessedCount;
            success = true; // Exit retry loop but record the errors
          }
        } else {
          // All items processed successfully
          successCount += putRequests.length;
          success = true;
        }
      } catch (error) {
        // Check for duplicate keys error
        if (error.code === 'ValidationException' && error.message.includes('contains duplicates')) {
          console.error('Detected duplicate keys in batch, attempting to fix...');
          
          // Deduplicate the batch further
          const items = putRequests.map(req => req.PutRequest.Item);
          const dedupedItems = deduplicateOrders(items);
          
          if (dedupedItems.length < items.length) {
            console.log(`Removed ${items.length - dedupedItems.length} more duplicates from batch`);
            putRequests = dedupedItems.map(item => ({
              PutRequest: { Item: item }
            }));
            
            // Try again without incrementing retry counter
            continue;
          }
          
          // If we couldn't deduplicate further, try sending items one by one
          console.log('Could not deduplicate further, trying to process items individually');
          let individualSuccessCount = 0;
          
          for (const request of putRequests) {
            try {
              await dynamoDB.put({
                TableName: TABLES.ORDERS,
                Item: request.PutRequest.Item
              }).promise();
              individualSuccessCount++;
            } catch (individualError) {
              console.error(`Error writing individual item: ${individualError.message}`);
              errorCount++;
            }
          }
          
          console.log(`Processed ${individualSuccessCount} items individually`);
          successCount += individualSuccessCount;
          success = true;
          continue;
        }
        
        retries++;
        console.error(`Error writing batch to DynamoDB (attempt ${retries}/${config.maxRetries}):`, error);
        
        if (retries >= config.maxRetries) {
          errorCount += putRequests.length;
          success = true; // Exit retry loop but record the errors
        } else {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retries), 30000);
          console.log(`Retrying after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Log progress every few batches
    if (i % (config.batchSize * 4) === 0 && config.logProgress) {
      console.log(`Progress: ${i} / ${uniqueOrders.length} orders processed`);
    }
  }
  
  console.log(`File ${fileName} import complete: ${successCount} succeeded, ${errorCount} failed`);
  
  return {
    fileName,
    rowCount,
    validOrders: orders.length,
    uniqueOrders: uniqueOrders.length,
    successCount,
    errorCount
  };
}

/**
 * Deduplicate orders by ID
 * @param {Array} orders - Array of order objects
 * @returns {Array} - Deduplicated array of orders
 */
function deduplicateOrders(orders) {
  // Create a map to store orders by ID
  const orderMap = new Map();
  
  // Process each order
  orders.forEach(order => {
    const orderId = order.id;
    
    if (orderMap.has(orderId)) {
      // If we've seen this order ID before, keep the one with more recent updated_at
      const existingOrder = orderMap.get(orderId);
      const existingDate = new Date(existingOrder.updated_at || existingOrder.created_at);
      const newDate = new Date(order.updated_at || order.created_at);
      
      if (newDate > existingDate) {
        // If new order is more recent, replace the existing one
        orderMap.set(orderId, order);
      }
    } else {
      // First time seeing this order ID
      orderMap.set(orderId, order);
    }
  });
  
  // Convert map back to array
  return Array.from(orderMap.values());
}

/**
 * Process all order export files in a directory
 * @returns {Promise<Object>} - Import stats
 */
async function processAllOrderFiles() {
  console.log('Starting batch import of order export files from local directory');
  console.log('Configuration:', config);
  
  try {
    // Create a single import ID for this entire process
    const importId = `local_import_${Date.now()}`;
    console.log(`Starting import with ID: ${importId}`);
    
    // Mark import as started in metadata
    await updateSyncMetadata({
      syncId: importId,
      status: 'started',
      startedAt: new Date().toISOString(),
      type: 'local_order_import'
    });
    
    // Find all matching files
    const localPath = path.resolve(config.localPath);
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local path ${localPath} does not exist.`);
    }
    
    const pattern = path.join(localPath, config.filePattern);
    const files = glob.sync(pattern);
    
    if (files.length === 0) {
      console.log(`No files found matching pattern: ${pattern}`);
      
      await updateSyncMetadata({
        syncId: importId,
        status: 'completed',
        completedAt: new Date().toISOString(),
        filesFound: 0,
        message: 'No files found to import'
      });
      
      return {
        filesFound: 0,
        message: 'No files found to import'
      };
    }
    
    console.log(`Found ${files.length} files to process.`);
    
    // Update metadata with file count
    await updateSyncMetadata({
      syncId: importId,
      status: 'in_progress',
      filesFound: files.length,
      timestamp: new Date().toISOString()
    });
    
    // Process stats
    let totalRowsProcessed = 0;
    let totalOrdersFound = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    let filesProcessed = 0;
    const fileResults = [];
    
    // Process files one by one
    for (const filePath of files) {
      try {
        const result = await processOrderCsvFile(filePath, importId);
        fileResults.push(result);
        
        // Update totals
        totalRowsProcessed += result.rowCount;
        totalOrdersFound += result.validOrders;
        totalSuccess += result.successCount;
        totalErrors += result.errorCount;
        filesProcessed++;
        
        // Update progress every 5 files
        if (filesProcessed % 5 === 0 || filesProcessed === files.length) {
          await updateSyncMetadata({
            syncId: importId,
            status: 'in_progress',
            filesProcessed,
            totalFiles: files.length,
            rowsProcessed: totalRowsProcessed,
            ordersFound: totalOrdersFound,
            ordersImported: totalSuccess,
            errors: totalErrors,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        // Continue with next file
      }
    }
    
    // Update the last sync timestamp for orders
    await updateLastSyncTimestamp(new Date().toISOString());
    
    // Final update to metadata
    await updateSyncMetadata({
      syncId: importId,
      status: 'completed',
      completedAt: new Date().toISOString(),
      filesProcessed,
      totalFiles: files.length,
      rowsProcessed: totalRowsProcessed,
      ordersFound: totalOrdersFound,
      ordersImported: totalSuccess,
      errors: totalErrors
    });
    
    console.log(`===== ORDER EXPORT IMPORT COMPLETED =====`);
    console.log(`Processed ${filesProcessed} files with ${totalRowsProcessed} total rows`);
    console.log(`Found ${totalOrdersFound} valid orders, imported ${totalSuccess} with ${totalErrors} errors`);
    
    return {
      importId,
      filesProcessed,
      totalFiles: files.length,
      rowsProcessed: totalRowsProcessed,
      ordersFound: totalOrdersFound,
      ordersImported: totalSuccess,
      errors: totalErrors,
      fileResults
    };
    
  } catch (error) {
    console.error('Error processing order export files:', error);
    
    try {
      await updateSyncMetadata({
        syncId: `import_error_${Date.now()}`,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } catch (metadataError) {
      console.error('Failed to update error metadata:', metadataError);
    }
    
    throw error;
  }
}

// Run the script if executed directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    
    if (key === '--path') config.localPath = value;
    if (key === '--pattern') config.filePattern = value;
    if (key === '--batch-size') config.batchSize = parseInt(value, 10);
    if (key === '--retries') config.maxRetries = parseInt(value, 10);
    if (key === '--log') config.logProgress = value.toLowerCase() === 'true';
  });
  
  // Test DynamoDB connection first
  dynamoDB.scan({
    TableName: TABLES.SYNC_METADATA,
    Limit: 1
  }).promise()
    .then(() => {
      console.log('DynamoDB connection successful, starting import...');
      return processAllOrderFiles();
    })
    .then(results => {
      console.log('Order export file import process completed successfully.');
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Error in import process:', error);
      process.exit(1);
    });
} else {
  // Export for use as module
  module.exports = {
    processAllOrderFiles,
    processOrderCsvFile,
    transformOrderRow
  };
} 