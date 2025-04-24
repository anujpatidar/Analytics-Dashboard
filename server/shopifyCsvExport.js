/**
 * Shopify CSV Export Script
 * 
 * This script exports data from Shopify to CSV files for bulk import.
 * Use this for initial data export to be used with shopifyCsvImport.js.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Shopify = require('shopify-api-node');
const { createObjectCsvWriter } = require('csv-writer');
const { mkdirp } = require('mkdirp');

// Initialize Shopify API client using access token authentication
const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORE_URL,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN
});

/**
 * Fetch all data from a Shopify resource with pagination handling
 * @param {string} resource - Shopify resource (e.g., 'product', 'order', 'customer')
 * @param {Object} queryParams - Initial query parameters
 * @returns {Promise<Array>} - Array of all items
 */
async function fetchAllFromShopify(resource, queryParams = {}) {
  if (!shopify[resource] || typeof shopify[resource].list !== 'function') {
    throw new Error(`Invalid Shopify resource: ${resource}`);
  }
  
  const items = [];
  let hasNextPage = true;
  let params = { ...queryParams, limit: 250 };
  let pageCount = 0;
  let totalRetrieved = 0;
  
  console.log(`Starting to fetch all ${resource}s...`);
  
  while (hasNextPage) {
    pageCount++;
    try {
      console.log(`Fetching ${resource} batch page ${pageCount}...`);
      
      // Add a small delay to avoid rate limits if not the first page
      if (pageCount > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const result = await shopify[resource].list(params);
      
      if (result && Array.isArray(result) && result.length > 0) {
        items.push(...result);
        totalRetrieved += result.length;
        
        console.log(`Retrieved ${result.length} ${resource}s (total: ${totalRetrieved})`);
        
        if (result.length < 250) {
          console.log(`Received fewer than requested limit, end of pagination reached for ${resource}s`);
          hasNextPage = false;
        } else if (result.nextPageParameters) {
          // Update params for next page
          params = { ...result.nextPageParameters };
          console.log(`Moving to next page of ${resource}s with pagination token`);
        } else {
          console.log(`No pagination info returned but received full page of ${resource}s`);
          hasNextPage = false;
        }
      } else {
        console.log(`No more ${resource}s to fetch`);
        hasNextPage = false;
      }
    } catch (error) {
      // Check for rate limiting errors
      if (error.statusCode === 429) {
        const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '10', 10);
        console.log(`Rate limited by Shopify API. Waiting ${retryAfter} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        console.error(`Error fetching ${resource} batch:`, error);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // After 3 retries on the same page, give up
        if (pageCount % 3 === 0) {
          console.error(`Multiple errors encountered, continuing with ${resource}s fetched so far`);
          hasNextPage = false;
        }
      }
    }
  }
  
  console.log(`Successfully fetched ${items.length} ${resource}s in total`);
  
  return items;
}

/**
 * Transform product object for CSV export
 * @param {Object} product - Shopify product
 * @returns {Object} - Transformed product
 */
function transformProductForCsv(product) {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    body_html: product.body_html,
    vendor: product.vendor,
    product_type: product.product_type,
    created_at: product.created_at,
    updated_at: product.updated_at,
    published_at: product.published_at,
    status: product.status,
    tags: product.tags,
    variants: JSON.stringify(product.variants || []),
    options: JSON.stringify(product.options || []),
    images: JSON.stringify(product.images || [])
  };
}

/**
 * Transform order object for CSV export
 * @param {Object} order - Shopify order
 * @returns {Object} - Transformed order
 */
function transformOrderForCsv(order) {
  return {
    id: order.id,
    name: order.name,
    email: order.email,
    financial_status: order.financial_status,
    fulfillment_status: order.fulfillment_status,
    created_at: order.created_at,
    updated_at: order.updated_at,
    processed_at: order.processed_at,
    currency: order.currency,
    total_price: order.total_price,
    subtotal_price: order.subtotal_price,
    total_tax: order.total_tax,
    taxes_included: order.taxes_included ? 'true' : 'false',
    customer_id: order.customer ? order.customer.id : '',
    customer_name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : '',
    customer_email: order.customer ? order.customer.email : '',
    shipping_address: JSON.stringify(order.shipping_address || {}),
    billing_address: JSON.stringify(order.billing_address || {}),
    line_items: JSON.stringify(order.line_items || []),
    discount_codes: JSON.stringify(order.discount_codes || []),
    note: order.note,
    tags: order.tags,
    cancelled_at: order.cancelled_at
  };
}

/**
 * Transform customer object for CSV export
 * @param {Object} customer - Shopify customer
 * @returns {Object} - Transformed customer
 */
function transformCustomerForCsv(customer) {
  return {
    id: customer.id,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
    orders_count: customer.orders_count,
    total_spent: customer.total_spent,
    currency: customer.currency,
    state: customer.state,
    verified_email: customer.verified_email ? 'true' : 'false',
    tax_exempt: customer.tax_exempt ? 'true' : 'false',
    phone: customer.phone,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
    addresses: JSON.stringify(customer.addresses || []),
    tags: customer.tags,
    note: customer.note,
    accepts_marketing: customer.accepts_marketing ? 'true' : 'false',
    last_order_id: customer.last_order_id,
    last_order_date: customer.last_order_name
  };
}

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filePath - Path to CSV file
 * @param {Array} headers - CSV headers
 * @returns {Promise<void>}
 */
async function exportToCsv(data, filePath, headers) {
  if (!data || data.length === 0) {
    console.log('No data to export');
    return;
  }
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  await mkdirp(dir);
  
  // Create CSV writer
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers.map(header => ({ id: header, title: header }))
  });
  
  console.log(`Writing ${data.length} records to ${filePath}...`);
  
  // Write data to CSV
  await csvWriter.writeRecords(data);
  
  console.log(`Successfully exported data to ${filePath}`);
}

/**
 * Export products to CSV
 * @param {string} outputPath - Path to output file
 * @returns {Promise<void>}
 */
async function exportProductsToCsv(outputPath) {
  console.log('Exporting products...');
  
  try {
    // Fetch all products
    const products = await fetchAllFromShopify('product');
    
    // Transform products for CSV
    const transformedProducts = products.map(transformProductForCsv);
    
    // Define headers
    const headers = [
      'id',
      'title',
      'handle',
      'body_html',
      'vendor',
      'product_type',
      'created_at',
      'updated_at',
      'published_at',
      'status',
      'tags',
      'variants',
      'options',
      'images'
    ];
    
    // Export to CSV
    await exportToCsv(transformedProducts, outputPath, headers);
    
    return {
      count: transformedProducts.length,
      path: outputPath
    };
  } catch (error) {
    console.error('Error exporting products:', error);
    throw error;
  }
}

/**
 * Export orders to CSV
 * @param {string} outputPath - Path to output file
 * @returns {Promise<void>}
 */
async function exportOrdersToCsv(outputPath) {
  console.log('Exporting orders...');
  
  try {
    // Fetch all orders with status any
    const orders = await fetchAllFromShopify('order', { status: 'any' });
    
    // Transform orders for CSV
    const transformedOrders = orders.map(transformOrderForCsv);
    
    // Define headers
    const headers = [
      'id',
      'name',
      'email',
      'financial_status',
      'fulfillment_status',
      'created_at',
      'updated_at',
      'processed_at',
      'currency',
      'total_price',
      'subtotal_price',
      'total_tax',
      'taxes_included',
      'customer_id',
      'customer_name',
      'customer_email',
      'shipping_address',
      'billing_address',
      'line_items',
      'discount_codes',
      'note',
      'tags',
      'cancelled_at'
    ];
    
    // Export to CSV
    await exportToCsv(transformedOrders, outputPath, headers);
    
    return {
      count: transformedOrders.length,
      path: outputPath
    };
  } catch (error) {
    console.error('Error exporting orders:', error);
    throw error;
  }
}

/**
 * Export customers to CSV
 * @param {string} outputPath - Path to output file
 * @returns {Promise<void>}
 */
async function exportCustomersToCsv(outputPath) {
  console.log('Exporting customers...');
  
  try {
    // Fetch all customers
    const customers = await fetchAllFromShopify('customer');
    
    // Transform customers for CSV
    const transformedCustomers = customers.map(transformCustomerForCsv);
    
    // Define headers
    const headers = [
      'id',
      'email',
      'first_name',
      'last_name',
      'orders_count',
      'total_spent',
      'currency',
      'state',
      'verified_email',
      'tax_exempt',
      'phone',
      'created_at',
      'updated_at',
      'addresses',
      'tags',
      'note',
      'accepts_marketing',
      'last_order_id',
      'last_order_date'
    ];
    
    // Export to CSV
    await exportToCsv(transformedCustomers, outputPath, headers);
    
    return {
      count: transformedCustomers.length,
      path: outputPath
    };
  } catch (error) {
    console.error('Error exporting customers:', error);
    throw error;
  }
}

/**
 * Export all data to CSV files
 * @param {Object} options - Export options
 * @returns {Promise<Object>} - Export results
 */
async function exportAllToCsv(options = {}) {
  const defaultOptions = {
    outputDir: './data',
    ordersFile: 'orders.csv',
    productsFile: 'products.csv',
    customersFile: 'customers.csv',
    skipOrders: false,
    skipProducts: false,
    skipCustomers: false
  };
  
  const config = { ...defaultOptions, ...options };
  console.log('Starting CSV export with options:', config);
  
  const startTime = Date.now();
  
  // Ensure output directory exists
  await mkdirp(config.outputDir);
  
  const results = {
    products: { count: 0, path: '', skipped: config.skipProducts },
    orders: { count: 0, path: '', skipped: config.skipOrders },
    customers: { count: 0, path: '', skipped: config.skipCustomers }
  };
  
  try {
    // Export products if not skipped
    if (!config.skipProducts) {
      const productsPath = path.join(config.outputDir, config.productsFile);
      console.log(`\n===== EXPORTING PRODUCTS TO ${productsPath} =====`);
      results.products = await exportProductsToCsv(productsPath);
    }
    
    // Export customers if not skipped
    if (!config.skipCustomers) {
      const customersPath = path.join(config.outputDir, config.customersFile);
      console.log(`\n===== EXPORTING CUSTOMERS TO ${customersPath} =====`);
      results.customers = await exportCustomersToCsv(customersPath);
    }
    
    // Export orders if not skipped
    if (!config.skipOrders) {
      const ordersPath = path.join(config.outputDir, config.ordersFile);
      console.log(`\n===== EXPORTING ORDERS TO ${ordersPath} =====`);
      results.orders = await exportOrdersToCsv(ordersPath);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    const totalExported = results.products.count + results.orders.count + results.customers.count;
    
    console.log('\n===== CSV EXPORT COMPLETED =====');
    console.log(`Total exported: ${totalExported} items in ${duration.toFixed(2)} seconds`);
    console.log(`Products: ${results.products.count}, Orders: ${results.orders.count}, Customers: ${results.customers.count}`);
    
    return {
      results,
      totalExported,
      duration
    };
  } catch (error) {
    console.error('Error during CSV export:', error);
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
    if (arg.startsWith('--output-dir=')) options.outputDir = arg.split('=')[1];
    if (arg.startsWith('--orders-file=')) options.ordersFile = arg.split('=')[1];
    if (arg.startsWith('--products-file=')) options.productsFile = arg.split('=')[1];
    if (arg.startsWith('--customers-file=')) options.customersFile = arg.split('=')[1];
  });
  
  exportAllToCsv(options)
    .then(() => {
      console.log('CSV export completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('CSV export failed:', error);
      process.exit(1);
    });
} else {
  // Export functions when used as a module
  module.exports = {
    exportAllToCsv,
    exportProductsToCsv,
    exportOrdersToCsv,
    exportCustomersToCsv
  };
} 