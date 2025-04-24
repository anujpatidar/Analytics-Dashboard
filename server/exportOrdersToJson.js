/**
 * Order CSV to JSON Exporter
 * 
 * This script processes multiple Shopify order CSV files and converts them to JSON format
 * for easier data handling and eventual import to a database.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const csv = require('csv-parser');

/**
 * Transform CSV rows specific to the Shopify order export format
 * @param {Object} row - CSV row data
 * @returns {Object|null} - Formatted order or null if invalid
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
    
    // Transform to desired format
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
 * Import from CSV file and save as JSON
 * @param {string} csvFilePath - Path to CSV file
 * @param {string} outputDir - Output directory for JSON files
 * @returns {Promise<Object>} - Import stats
 */
function processOrderCsvToJson(csvFilePath, outputDir) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csvFilePath)) {
      reject(new Error(`CSV file not found: ${csvFilePath}`));
      return;
    }
    
    // Make sure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const fileName = path.basename(csvFilePath, '.csv');
    const jsonOutputPath = path.join(outputDir, `${fileName}.json`);
    
    console.log(`Processing ${csvFilePath} to ${jsonOutputPath}`);
    const startTime = Date.now();
    
    let totalProcessed = 0;
    let validOrders = [];
    let errors = 0;
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        totalProcessed++;
        
        // Transform the row
        try {
          const transformedItem = transformOrderRow(row);
          if (transformedItem) {
            validOrders.push(transformedItem);
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`Error processing row ${totalProcessed}:`, error);
          errors++;
        }
      })
      .on('end', () => {
        // Write the output JSON file
        fs.writeFileSync(jsonOutputPath, JSON.stringify(validOrders, null, 2));
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`Processing completed for ${csvFilePath}`);
        console.log(`Processed ${totalProcessed} rows, created ${validOrders.length} valid order records`);
        console.log(`Errors: ${errors}, Time taken: ${duration.toFixed(2)} seconds`);
        
        resolve({
          processed: totalProcessed,
          valid: validOrders.length,
          errors: errors,
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
 * Process multiple order CSV files to JSON
 * @param {Object} options - Options
 * @returns {Promise<Object>} - Results
 */
async function processMultipleOrderFiles(options = {}) {
  const defaultOptions = {
    ordersPattern: 'order*.csv',
    dataDir: './data',
    outputDir: './output/orders',
    outputFormat: 'json'
  };
  
  const config = { ...defaultOptions, ...options };
  console.log('Starting multi-file order CSV to JSON conversion with options:', config);
  
  const startTime = Date.now();
  const dataDir = path.resolve(config.dataDir);
  const outputDir = path.resolve(config.outputDir);
  
  // Verify data directory exists
  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory ${dataDir} does not exist!`);
    throw new Error(`Data directory ${dataDir} not found`);
  }
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    console.log(`Creating output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Find all matching order CSV files
  const pattern = path.join(dataDir, config.ordersPattern);
  const orderFiles = glob.sync(pattern);
  
  if (orderFiles.length === 0) {
    console.error(`No order files found matching pattern: ${pattern}`);
    throw new Error('No order files found');
  }
  
  console.log(`Found ${orderFiles.length} order CSV files to process`);
  
  // Track overall statistics
  const totalStats = {
    files: orderFiles.length,
    processed: 0,
    valid: 0,
    errors: 0,
    filesCompleted: 0
  };
  
  // Process each file in sequence
  for (let i = 0; i < orderFiles.length; i++) {
    const filePath = orderFiles[i];
    const fileName = path.basename(filePath);
    
    console.log(`\n===== PROCESSING FILE ${i+1}/${orderFiles.length}: ${fileName} =====`);
    
    try {
      // Process this file and save as JSON
      const fileStats = await processOrderCsvToJson(filePath, outputDir);
      
      // Update overall stats
      totalStats.processed += fileStats.processed;
      totalStats.valid += fileStats.valid;
      totalStats.errors += fileStats.errors;
      totalStats.filesCompleted++;
      
      // Log progress
      console.log(`File ${i+1}/${orderFiles.length} complete. Progress: ${((i+1)/orderFiles.length*100).toFixed(1)}%`);
      console.log(`Running totals - Processed: ${totalStats.processed}, Valid: ${totalStats.valid}, Errors: ${totalStats.errors}`);
    } catch (error) {
      console.error(`Error processing file ${fileName}:`, error);
      totalStats.filesCompleted++;
      // Continue with next file
    }
  }
  
  // Calculate final stats
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('\n===== CSV TO JSON CONVERSION COMPLETED =====');
  console.log(`Processed ${totalStats.files} files with ${totalStats.processed} total records in ${duration.toFixed(2)} seconds`);
  console.log(`Valid records: ${totalStats.valid}, Errors: ${totalStats.errors}`);
  console.log(`Output saved to: ${outputDir}`);
  
  // Write summary file
  const summaryPath = path.join(outputDir, '_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    completed_at: new Date().toISOString(),
    stats: {
      ...totalStats,
      duration
    }
  }, null, 2));
  
  return {
    totalStats: {
      ...totalStats,
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
    if (arg.startsWith('--output-dir=')) options.outputDir = arg.split('=')[1];
  });
  
  processMultipleOrderFiles(options)
    .then(results => {
      console.log('CSV to JSON conversion completed successfully.');
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('CSV to JSON conversion failed:', error);
      process.exit(1);
    });
} else {
  // Export functions when used as a module
  module.exports = {
    processMultipleOrderFiles,
    processOrderCsvToJson,
    transformOrderRow
  };
} 