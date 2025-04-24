/**
 * Multi-file Customer CSV Import Script
 * 
 * This script imports multiple customer CSV files into DynamoDB.
 * It's designed to handle cases where you have multiple customer data files.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const csv = require('csv-parser');
const { Transform } = require('stream');
const { importFromCsv } = require('./shopifyCsvImport');
const AWS = require('aws-sdk');

// Initialize AWS DynamoDB
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Define table names from environment variables with defaults
const TABLES = {
  CUSTOMERS: process.env.CUSTOMERS_TABLE || 'ShopifyCustomers',
  SYNC_METADATA: process.env.SYNC_METADATA_TABLE || 'ShopifySyncMetadata'
};

/**
 * Transform CSV rows specific to the Shopify customer export format
 * @param {Object} row - CSV row data
 * @returns {Object|null} - Formatted customer for DynamoDB or null if invalid
 */
function transformCustomerRow(row) {
  try {
    // Get the Customer ID - handle the fact that it might have a single quote prefix
    let customerId = row['Customer ID'] || '';
    if (customerId.startsWith("'")) {
      customerId = customerId.substring(1);
    }
    
    // Validate required fields
    if (!customerId) {
      console.warn('Skipping customer row with missing Customer ID');
      return null;
    }
    
    // Prepare default address from CSV fields
    const defaultAddress = {
      company: row['Default Address Company'] || '',
      address1: row['Default Address Address1'] || '',
      address2: row['Default Address Address2'] || '',
      city: row['Default Address City'] || '',
      province: row['Default Address Province Code'] || '',
      country: row['Default Address Country Code'] || '',
      zip: row['Default Address Zip'] || '',
      phone: row['Default Address Phone'] || ''
    };
    
    // Clean phone numbers (remove single quote prefix if present)
    let phone = row['Phone'] || '';
    if (phone.startsWith("'")) {
      phone = phone.substring(1);
    }
    
    let defaultPhone = defaultAddress.phone;
    if (defaultPhone && defaultPhone.startsWith("'")) {
      defaultAddress.phone = defaultPhone.substring(1);
    }
    
    // Format addresses as array with default address
    const addresses = [];
    if (Object.values(defaultAddress).some(val => val)) {
      addresses.push({
        ...defaultAddress,
        default: true
      });
    }
    
    // Parse numeric values
    const totalSpent = parseFloat(row['Total Spent'] || '0.00');
    const totalOrders = parseInt(row['Total Orders'] || '0', 10);
    
    // Transform to DynamoDB format
    return {
      id: customerId.toString(),
      email: row['Email'] || '',
      first_name: row['First Name'] || '',
      last_name: row['Last Name'] || '',
      orders_count: totalOrders,
      total_spent: totalSpent.toFixed(2),
      currency: 'INR', // Assuming INR for Indian customers
      state: 'enabled',
      verified_email: true,
      tax_exempt: row['Tax Exempt'] === 'yes',
      phone: phone,
      created_at: new Date().toISOString(), // Not provided in CSV, using current date
      updated_at: new Date().toISOString(),
      addresses: addresses,
      tags: row['Tags'] ? row['Tags'].split(',').map(tag => tag.trim()) : [],
      note: row['Note'] || '',
      accepts_marketing: row['Accepts Email Marketing'] === 'yes',
      last_order_id: null,
      last_order_date: null,
      synced_at: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error transforming customer row:', err);
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
        const transformedItem = transformCustomerRow(row);
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
 * @param {string} resource - Resource name (customers)
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
 * Import multiple customer CSV files
 * @param {Object} options - Import options
 * @returns {Promise<Object>} - Import results
 */
async function importMultipleCustomerFiles(options = {}) {
  const defaultOptions = {
    customersPattern: 'customer*.csv',
    dataDir: './data',
  };
  
  const config = { ...defaultOptions, ...options };
  console.log('Starting multi-file customer CSV import with options:', config);
  
  const startTime = Date.now();
  const dataDir = path.resolve(config.dataDir);
  
  // Verify data directory exists
  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory ${dataDir} does not exist!`);
    throw new Error(`Data directory ${dataDir} not found`);
  }
  
  // Find all matching customer CSV files
  const pattern = path.join(dataDir, config.customersPattern);
  const customerFiles = glob.sync(pattern);
  
  if (customerFiles.length === 0) {
    console.error(`No customer files found matching pattern: ${pattern}`);
    throw new Error('No customer files found');
  }
  
  console.log(`Found ${customerFiles.length} customer CSV files to import`);
  
  // Record import start
  await updateSyncMetadata({
    syncId: `multi_csv_import_${Date.now()}`,
    status: 'started',
    startedAt: new Date().toISOString(),
    fileCount: customerFiles.length
  });
  
  // Track overall statistics
  const totalStats = {
    files: customerFiles.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    startTime,
    filesCompleted: 0
  };
  
  // Process each file in sequence
  for (let i = 0; i < customerFiles.length; i++) {
    const filePath = customerFiles[i];
    const fileName = path.basename(filePath);
    
    console.log(`\n===== PROCESSING FILE ${i+1}/${customerFiles.length}: ${fileName} =====`);
    
    try {
      // Import this file using our custom import function
      const fileStats = await importCustomCsv(filePath, TABLES.CUSTOMERS);
      
      // Update overall stats
      totalStats.processed += fileStats.processed;
      totalStats.succeeded += fileStats.succeeded;
      totalStats.failed += fileStats.failed;
      totalStats.filesCompleted++;
      
      // Log progress
      console.log(`File ${i+1}/${customerFiles.length} complete. Progress: ${((i+1)/customerFiles.length*100).toFixed(1)}%`);
      console.log(`Running totals - Processed: ${totalStats.processed}, Succeeded: ${totalStats.succeeded}, Failed: ${totalStats.failed}`);
      
      // Update metadata every few files
      if ((i + 1) % 5 === 0 || i === customerFiles.length - 1) {
        await updateSyncMetadata({
          syncId: `multi_csv_import_progress`,
          status: 'in_progress',
          filesCompleted: totalStats.filesCompleted,
          totalFiles: customerFiles.length,
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
  
  // Update the sync timestamp
  await updateLastSyncTimestamp('customers', new Date().toISOString());
  
  // Record import completion
  await updateSyncMetadata({
    syncId: `multi_csv_import_${Date.now()}`,
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
  
  console.log('\n===== MULTI-FILE CUSTOMER CSV IMPORT COMPLETED =====');
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
    if (arg.startsWith('--pattern=')) options.customersPattern = arg.split('=')[1];
    if (arg.startsWith('--data-dir=')) options.dataDir = arg.split('=')[1];
  });
  
  importMultipleCustomerFiles(options)
    .then(results => {
      console.log('Multi-file customer CSV import completed successfully.');
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Multi-file customer CSV import failed:', error);
      process.exit(1);
    });
} else {
  // Export functions when used as a module
  module.exports = {
    importMultipleCustomerFiles
  };
} 