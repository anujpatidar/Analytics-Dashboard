require('dotenv').config();
const Shopify = require('shopify-api-node');
const AWS = require('aws-sdk');

// Initialize Shopify API client using access token authentication
const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORE_URL,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN
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

/**
 * Sync orders from Shopify to DynamoDB
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context
 * @returns {Promise<Object>} - Result of sync
 */
const syncShopifyData = async (event, context) => {
  // Set maximum timeout for Lambda if context is available
  if (context && typeof context.getRemainingTimeInMillis === 'function') {
    // Log the initial remaining time
    console.log(`Initial Lambda remaining time: ${context.getRemainingTimeInMillis()}ms`);
    
    // Set a timer to log remaining time periodically
    const timeLogInterval = setInterval(() => {
      console.log(`Remaining Lambda time: ${context.getRemainingTimeInMillis()}ms`);
    }, 30000); // Log every 30 seconds
    
    // Clear the interval when function completes
    setTimeout(() => clearInterval(timeLogInterval), context.getRemainingTimeInMillis() - 1000);
  }
  
  console.log('Starting COMPLETE Shopify data sync...');
  console.log('Environment configuration:', {
    region: process.env.AWS_REGION || 'us-east-1',
    shopifyStore: process.env.SHOPIFY_STORE_URL,
    orderTable: TABLES.ORDERS,
    productTable: TABLES.PRODUCTS,
    customerTable: TABLES.CUSTOMERS,
    metadataTable: TABLES.SYNC_METADATA
  });
  
  const results = {
    orders: { success: false, error: null, count: 0 },
    products: { success: false, error: null, count: 0 },
    customers: { success: false, error: null, count: 0 }
  };
  
  try {
    // Create a single sync ID for this entire process
    const syncId = `sync_${Date.now()}`;
    console.log(`Starting sync with ID: ${syncId}`);
    
    // Mark sync as started in metadata
    await updateSyncMetadata({
      syncId: syncId,
      status: 'started',
      startedAt: new Date().toISOString(),
    });
    
    // Try to sync products
    try {
      console.log('--- STARTING PRODUCTS SYNC ---');
      const productCount = await syncProducts();
      results.products.success = true;
      results.products.count = productCount;
    } catch (error) {
      console.error('Failed to sync products:', error);
      results.products.error = error.message;
    }
    
    // Try to sync customers
    try {
      console.log('--- STARTING CUSTOMERS SYNC ---');
      const customerCount = await syncCustomers();
      results.customers.success = true;
      results.customers.count = customerCount;
    } catch (error) {
      console.error('Failed to sync customers:', error);
      results.customers.error = error.message;
    }
    
    // Try to sync orders
    try {
      console.log('--- STARTING ORDERS SYNC ---');
      const orderCount = await syncOrders();
      results.orders.success = true;
      results.orders.count = orderCount;
    } catch (error) {
      console.error('Failed to sync orders:', error);
      results.orders.error = error.message;
    }
    
    // Determine overall status
    const overallSuccess = results.products.success || results.customers.success || results.orders.success;
    const allSuccess = results.products.success && results.customers.success && results.orders.success;
    const status = allSuccess ? 'success' : (overallSuccess ? 'partial_success' : 'failed');
    
    // Update sync metadata with completion information
    await updateSyncMetadata({
      syncId: syncId,
      status: status,
      completedAt: new Date().toISOString(),
      error: overallSuccess ? null : 'Some or all sync operations failed',
      results: results
    });
    
    const totalItemsSynced = results.products.count + results.customers.count + results.orders.count;
    console.log(`Shopify data sync completed with ${status} status. Total items synced: ${totalItemsSynced}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: `Sync completed with ${status} status`,
        timestamp: new Date().toISOString(),
        results: results,
        totalItemsSynced: totalItemsSynced
      }),
    };
  } catch (error) {
    console.error('Error syncing Shopify data:', error);
    
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
};

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
 * Sync orders from Shopify to DynamoDB
 * @returns {Promise<number>} Total number of orders synced successfully
 */
const syncOrders = async () => {
  console.log('STARTING COMPREHENSIVE ORDER SYNC - NO LIMITATIONS');
  
  let totalOrdersRetrieved = 0;
  let totalOrdersSynced = 0;
  let totalBatchesProcessed = 0;
  let totalErrors = 0;
  
  try {
    // Fetch ALL orders without any time or status limitations
    let params = { 
      limit: 250,  // Maximum allowed by Shopify API
      status: 'any' // Include all orders regardless of status
    };
    
    let orders = [];
    let hasNextPage = true;
    let pageCount = 0;
    
    const startTime = Date.now();
    console.log(`Order sync started at: ${new Date(startTime).toISOString()}`);
    
    // ===== FETCHING PHASE =====
    console.log('===== PHASE 1: FETCHING ALL ORDERS FROM SHOPIFY =====');
    
    while (hasNextPage) {
      pageCount++;
      let retries = 0;
      const maxRetries = 5; // Increase retry attempts
      let pageSuccess = false;
      
      while (!pageSuccess && retries < maxRetries) {
        try {
          console.log(`Fetching order batch page ${pageCount} (attempt ${retries + 1}/${maxRetries})...`);
          
          // Add a small delay before making the request to avoid rate limits
          if (retries > 0 || pageCount > 1) {
            const delay = retries === 0 ? 500 : Math.min(1000 * Math.pow(2, retries - 1), 30000);
            console.log(`Waiting ${delay}ms before making request...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const result = await shopify.order.list(params);
          
          if (result && Array.isArray(result)) {
            console.log(`Retrieved ${result.length} orders on page ${pageCount}`);
            
            if (result.length > 0) {
              // Process this batch of orders
              orders = orders.concat(result);
              totalOrdersRetrieved += result.length;
              
              console.log(`Running total: ${totalOrdersRetrieved} orders retrieved so far`);
              
              // Check if this is the last page
              if (result.length < 250) {
                console.log('Received fewer orders than requested limit, reached end of pagination');
                hasNextPage = false;
              } else if (result.nextPageParameters && result.nextPageParameters.page_info) {
                // Update params for next page
                params = { 
                  limit: 250,
                  status: 'any',
                  page_info: result.nextPageParameters.page_info 
                };
                console.log('Moving to next page of orders with pagination token');
              } else {
                console.log('WARNING: No pagination info returned but received full page of results');
                // This shouldn't normally happen with proper pagination
                // Try one more page with same params as a fallback
                hasNextPage = false;
              }
              
              pageSuccess = true;
            } else {
              console.log('Received empty result array, reached end of pagination');
              hasNextPage = false;
              pageSuccess = true;
            }
          } else {
            console.log('WARNING: Unexpected response format from Shopify API');
            console.log('Response:', JSON.stringify(result).substring(0, 500) + '...');
            
            // Increment retry counter for this page
            retries++;
            if (retries >= maxRetries) {
              console.error(`Failed to fetch page ${pageCount} after ${maxRetries} attempts, continuing with orders fetched so far`);
              hasNextPage = false;
              totalErrors++;
            }
          }
        } catch (error) {
          totalErrors++;
          retries++;
          
          // Check for rate limiting errors specifically
          if (error.statusCode === 429) {
            const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '10', 10);
            console.log(`Rate limited by Shopify API. Waiting ${retryAfter} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          } else {
            console.error(`Error fetching order batch on page ${pageCount} (attempt ${retries}/${maxRetries}):`, error);
            
            // Exponential backoff with jitter
            if (retries < maxRetries) {
              const baseDelay = Math.min(1000 * Math.pow(2, retries), 60000);
              const jitter = Math.floor(Math.random() * 1000);
              const delay = baseDelay + jitter;
              console.log(`Retrying after ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          if (retries >= maxRetries) {
            console.error(`Failed to fetch page ${pageCount} after ${maxRetries} attempts, continuing with orders fetched so far`);
            pageSuccess = true; // Mark as "successful" to exit retry loop and continue with what we have
          }
        }
      }
      
      // Save progress checkpoint every 5 pages
      if (pageCount % 5 === 0) {
        console.log(`CHECKPOINT: Saving progress after ${pageCount} pages (${totalOrdersRetrieved} orders)`);
        try {
          await updateSyncMetadata({
            syncId: 'orders_in_progress',
            status: 'in_progress',
            ordersRetrieved: totalOrdersRetrieved,
            pagesProcessed: pageCount,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error saving checkpoint:', err);
        }
      }
    }
    
    const fetchEndTime = Date.now();
    const fetchDuration = (fetchEndTime - startTime) / 1000;
    console.log(`===== COMPLETED FETCH PHASE: Retrieved ${totalOrdersRetrieved} total orders in ${fetchDuration.toFixed(2)} seconds =====`);
    
    // ===== PROCESSING PHASE =====
    console.log('===== PHASE 2: WRITING ORDERS TO DYNAMODB =====');
    
    // Use a smaller batch size to reduce the chance of exceeding DynamoDB limits
    const batchSize = 25;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < orders.length; i += batchSize) {
      totalBatchesProcessed++;
      const batch = orders.slice(i, i + batchSize);
      
      // Prepare batch items with improved error handling for malformed data
      const putRequests = batch.map(order => {
        try {
          return {
            PutRequest: {
              Item: {
                id: order.id ? order.id.toString() : `unknown-${Date.now()}-${Math.random()}`,
                name: order.name || `Order #${order.id || 'Unknown'}`,
                status: order.financial_status || 'unknown',
                fulfillment_status: order.fulfillment_status || 'unfulfilled',
                date: order.created_at ? order.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                created_at: order.created_at || new Date().toISOString(),
                updated_at: order.updated_at || new Date().toISOString(),
                total: order.total_price || '0.00',
                subtotal: order.subtotal_price || '0.00',
                tax: order.total_tax || '0.00',
                currency: order.currency || 'USD',
                customer: order.customer ? {
                  id: order.customer.id ? order.customer.id.toString() : 'unknown',
                  name: `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || 'Unknown',
                  email: order.customer.email || '',
                } : null,
                line_items: Array.isArray(order.line_items) ? order.line_items.map(item => ({
                  id: item.id ? item.id.toString() : `item-${Math.random().toString(36).substring(2, 15)}`,
                  product_id: item.product_id ? item.product_id.toString() : null,
                  variant_id: item.variant_id ? item.variant_id.toString() : null,
                  title: item.title || 'Unknown Product',
                  quantity: item.quantity || 1,
                  price: item.price || '0.00',
                  sku: item.sku || '',
                  grams: item.grams || 0,
                })) : [],
                shipping_address: order.shipping_address ? {
                  address1: order.shipping_address.address1 || '',
                  address2: order.shipping_address.address2 || '',
                  city: order.shipping_address.city || '',
                  province: order.shipping_address.province || '',
                  country: order.shipping_address.country || '',
                  zip: order.shipping_address.zip || '',
                  name: order.shipping_address.name || '',
                  company: order.shipping_address.company || '',
                  phone: order.shipping_address.phone || '',
                } : null,
                billing_address: order.billing_address ? {
                  address1: order.billing_address.address1 || '',
                  address2: order.billing_address.address2 || '',
                  city: order.billing_address.city || '',
                  province: order.billing_address.province || '',
                  country: order.billing_address.country || '',
                  zip: order.billing_address.zip || '',
                  name: order.billing_address.name || '',
                  company: order.billing_address.company || '',
                  phone: order.billing_address.phone || '',
                } : null,
                tags: order.tags ? order.tags.split(',').map(tag => tag.trim()) : [],
                discount_codes: order.discount_codes || [],
                note: order.note || '',
                cancelled_at: order.cancelled_at || null,
                processed_at: order.processed_at || null,
                synced_at: new Date().toISOString()
              }
            }
          };
        } catch (err) {
          console.error('Error preparing order for DynamoDB:', err);
          console.log('Problematic order:', JSON.stringify(order).substring(0, 500) + '...');
          errorCount++;
          return null;
        }
      }).filter(Boolean); // Remove any null items from failed processing
      
      // Skip if no items to write
      if (putRequests.length === 0) {
        console.log(`Batch ${totalBatchesProcessed} (items ${i+1}-${i+batch.length}): No valid items to write, skipping`);
        continue;
      }
      
      console.log(`Writing batch ${totalBatchesProcessed} (${i+1}-${i+batch.length} of ${orders.length} orders) with ${putRequests.length} valid items...`);
      
      // Write to DynamoDB with improved retry logic
      let success = false;
      let writeRetries = 0;
      const maxWriteRetries = 5;
      
      while (!success && writeRetries < maxWriteRetries) {
        try {
          // Add a small delay between batches to avoid overwhelming DynamoDB
          if (totalBatchesProcessed > 1 || writeRetries > 0) {
            const delay = writeRetries === 0 ? 100 : Math.min(500 * Math.pow(2, writeRetries), 10000);
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
            writeRetries++;
            
            if (writeRetries >= maxWriteRetries) {
              console.error(`Failed to process ${unprocessedCount} items after ${maxWriteRetries} attempts`);
              errorCount += unprocessedCount;
              success = true; // Exit retry loop but record the errors
            }
          } else {
            // All items processed successfully
            console.log(`Successfully wrote batch of ${putRequests.length} orders to DynamoDB`);
            successCount += putRequests.length;
            success = true;
          }
        } catch (error) {
          writeRetries++;
          
          // Check for provisioned throughput errors
          if (error.code === 'ProvisionedThroughputExceededException') {
            console.warn(`DynamoDB throughput exceeded. Attempt ${writeRetries}/${maxWriteRetries}`);
            // Use exponential backoff with longer delays for throughput errors
            const delay = Math.min(2000 * Math.pow(2, writeRetries), 30000);
            console.log(`Waiting ${delay}ms before retry due to throughput limits...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`Error writing order batch to DynamoDB (attempt ${writeRetries}/${maxWriteRetries}):`, error);
            
            // Generic exponential backoff for other errors
            const delay = Math.min(1000 * Math.pow(2, writeRetries), 15000);
            console.log(`Retrying after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          if (writeRetries >= maxWriteRetries) {
            console.error(`Failed to write batch after ${maxWriteRetries} attempts, marking ${putRequests.length} orders as failed`);
            errorCount += putRequests.length;
            totalErrors++;
            success = true; // Exit retry loop but record the errors
          }
        }
      }
      
      // Update progress every 10 batches
      if (totalBatchesProcessed % 10 === 0) {
        try {
          await updateSyncMetadata({
            syncId: 'orders_write_progress',
            status: 'writing',
            totalItems: orders.length,
            itemsProcessed: i + batch.length,
            successCount,
            errorCount,
            timestamp: new Date().toISOString()
          });
          console.log(`Progress update: ${successCount} orders written successfully, ${errorCount} failures`);
        } catch (err) {
          console.error('Error updating write progress:', err);
        }
      }
    }
    
    totalOrdersSynced = successCount;
    
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;
    const writesDuration = (endTime - fetchEndTime) / 1000;
    
    console.log(`===== ORDER SYNC COMPLETED =====`);
    console.log(`${totalOrdersRetrieved} orders retrieved, ${totalOrdersSynced} successfully written to DynamoDB, ${errorCount} failures`);
    console.log(`Total time: ${totalDuration.toFixed(2)} seconds (Fetch: ${fetchDuration.toFixed(2)}s, Write: ${writesDuration.toFixed(2)}s)`);
    console.log(`Sync rate: ${(totalOrdersSynced / totalDuration).toFixed(2)} orders/second`);
    
    // Update last sync timestamp
    await updateLastSyncTimestamp('orders', new Date().toISOString());
    
    if (errorCount > 0) {
      console.warn(`WARNING: ${errorCount} orders could not be synced (${((errorCount/totalOrdersRetrieved)*100).toFixed(2)}% failure rate)`);
    }
    
    return totalOrdersSynced;
  } catch (error) {
    console.error('CRITICAL ERROR in order sync process:', error);
    console.log(`Partial results: ${totalOrdersRetrieved} orders retrieved, ${totalOrdersSynced} successfully synced`);
    
    // Try to update sync metadata with partial results even in case of failure
    try {
      await updateSyncMetadata({
        syncId: 'orders_error',
        status: 'error',
        error: error.message,
        ordersRetrieved: totalOrdersRetrieved,
        ordersSynced: totalOrdersSynced,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to update error metadata:', err);
    }
    
    throw error;
  }
};

/**
 * Sync products from Shopify to DynamoDB
 * @returns {Promise<number>} Total number of products synced successfully
 */
const syncProducts = async () => {
  console.log('STARTING COMPREHENSIVE PRODUCT SYNC - NO LIMITATIONS');
  
  let totalProductsRetrieved = 0;
  let totalProductsSynced = 0;
  let totalBatchesProcessed = 0;
  let totalErrors = 0;
  
  try {
    // Fetch ALL products without any limitations
    let params = { 
      limit: 250  // Maximum allowed by Shopify API
    };
    
    let products = [];
    let hasNextPage = true;
    let pageCount = 0;
    
    const startTime = Date.now();
    console.log(`Product sync started at: ${new Date(startTime).toISOString()}`);
    
    // ===== FETCHING PHASE =====
    console.log('===== PHASE 1: FETCHING ALL PRODUCTS FROM SHOPIFY =====');
    
    while (hasNextPage) {
      pageCount++;
      let retries = 0;
      const maxRetries = 5; // Increase retry attempts
      let pageSuccess = false;
      
      while (!pageSuccess && retries < maxRetries) {
        try {
          console.log(`Fetching product batch page ${pageCount} (attempt ${retries + 1}/${maxRetries})...`);
          
          // Add a small delay before making the request to avoid rate limits
          if (retries > 0 || pageCount > 1) {
            const delay = retries === 0 ? 500 : Math.min(1000 * Math.pow(2, retries - 1), 30000);
            console.log(`Waiting ${delay}ms before making request...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const result = await shopify.product.list(params);
          
          if (result && Array.isArray(result)) {
            console.log(`Retrieved ${result.length} products on page ${pageCount}`);
            
            if (result.length > 0) {
              // Process this batch of products
              products = products.concat(result);
              totalProductsRetrieved += result.length;
              
              console.log(`Running total: ${totalProductsRetrieved} products retrieved so far`);
              
              // Check if this is the last page
              if (result.length < 250) {
                console.log('Received fewer products than requested limit, reached end of pagination');
                hasNextPage = false;
              } else if (result.nextPageParameters && result.nextPageParameters.page_info) {
                // Update params for next page
                params = { 
                  limit: 250,
                  page_info: result.nextPageParameters.page_info 
                };
                console.log('Moving to next page of products with pagination token');
              } else {
                console.log('WARNING: No pagination info returned but received full page of results');
                // This shouldn't normally happen with proper pagination
                // Try one more page with same params as a fallback
                hasNextPage = false;
              }
              
              pageSuccess = true;
            } else {
              console.log('Received empty result array, reached end of pagination');
              hasNextPage = false;
              pageSuccess = true;
            }
          } else {
            console.log('WARNING: Unexpected response format from Shopify API');
            console.log('Response:', JSON.stringify(result).substring(0, 500) + '...');
            
            // Increment retry counter for this page
            retries++;
            if (retries >= maxRetries) {
              console.error(`Failed to fetch page ${pageCount} after ${maxRetries} attempts, continuing with products fetched so far`);
              hasNextPage = false;
              totalErrors++;
            }
          }
        } catch (error) {
          totalErrors++;
          retries++;
          
          // Check for rate limiting errors specifically
          if (error.statusCode === 429) {
            const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '10', 10);
            console.log(`Rate limited by Shopify API. Waiting ${retryAfter} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          } else {
            console.error(`Error fetching product batch on page ${pageCount} (attempt ${retries}/${maxRetries}):`, error);
            
            // Exponential backoff with jitter
            if (retries < maxRetries) {
              const baseDelay = Math.min(1000 * Math.pow(2, retries), 60000);
              const jitter = Math.floor(Math.random() * 1000);
              const delay = baseDelay + jitter;
              console.log(`Retrying after ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          if (retries >= maxRetries) {
            console.error(`Failed to fetch page ${pageCount} after ${maxRetries} attempts, continuing with products fetched so far`);
            pageSuccess = true; // Mark as "successful" to exit retry loop and continue with what we have
          }
        }
      }
      
      // Save progress checkpoint every 5 pages
      if (pageCount % 5 === 0) {
        console.log(`CHECKPOINT: Saving progress after ${pageCount} pages (${totalProductsRetrieved} products)`);
        try {
          await updateSyncMetadata({
            syncId: 'products_in_progress',
            status: 'in_progress',
            productsRetrieved: totalProductsRetrieved,
            pagesProcessed: pageCount,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error saving checkpoint:', err);
        }
      }
    }
    
    const fetchEndTime = Date.now();
    const fetchDuration = (fetchEndTime - startTime) / 1000;
    console.log(`===== COMPLETED FETCH PHASE: Retrieved ${totalProductsRetrieved} total products in ${fetchDuration.toFixed(2)} seconds =====`);
    
    // ===== PROCESSING PHASE =====
    console.log('===== PHASE 2: WRITING PRODUCTS TO DYNAMODB =====');
    
    // Use a smaller batch size to reduce the chance of exceeding DynamoDB limits
    const batchSize = 25;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < products.length; i += batchSize) {
      totalBatchesProcessed++;
      const batch = products.slice(i, i + batchSize);
      
      // Prepare batch items with improved error handling for malformed data
      const putRequests = batch.map(product => {
        try {
          return {
            PutRequest: {
              Item: {
                id: product.id ? product.id.toString() : `unknown-${Date.now()}-${Math.random()}`,
                title: product.title || 'Unnamed Product',
                handle: product.handle || '',
                description: product.body_html || '',
                created_at: product.created_at || new Date().toISOString(),
                updated_at: product.updated_at || new Date().toISOString(),
                type: product.product_type || '',
                vendor: product.vendor || '',
                status: product.status || 'active',
                published_at: product.published_at || null,
                tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
                variants: Array.isArray(product.variants) ? product.variants.map(variant => ({
                  id: variant.id ? variant.id.toString() : `var-${Math.random().toString(36).substring(2, 15)}`,
                  title: variant.title || '',
                  price: variant.price || '0.00',
                  compare_at_price: variant.compare_at_price || null,
                  sku: variant.sku || '',
                  barcode: variant.barcode || '',
                  inventory: variant.inventory_quantity || 0,
                  position: variant.position || 1,
                  weight: variant.weight || 0,
                  weight_unit: variant.weight_unit || 'kg',
                  requires_shipping: variant.requires_shipping || true,
                  taxable: variant.taxable || true,
                  image_id: variant.image_id ? variant.image_id.toString() : null,
                  option1: variant.option1 || null,
                  option2: variant.option2 || null,
                  option3: variant.option3 || null,
                })) : [],
                options: Array.isArray(product.options) ? product.options.map(option => ({
                  id: option.id ? option.id.toString() : `opt-${Math.random().toString(36).substring(2, 15)}`,
                  name: option.name || '',
                  position: option.position || 1,
                  values: Array.isArray(option.values) ? option.values : []
                })) : [],
                images: Array.isArray(product.images) ? product.images.map(image => ({
                  id: image.id ? image.id.toString() : `img-${Math.random().toString(36).substring(2, 15)}`,
                  position: image.position || 1,
                  src: image.src || '',
                  alt: image.alt || '',
                  width: image.width || 0,
                  height: image.height || 0,
                  variant_ids: Array.isArray(image.variant_ids) ? image.variant_ids.map(id => id.toString()) : []
                })) : [],
                metafields: product.metafields || [],
                inventory_item_id: product.inventory_item_id ? product.inventory_item_id.toString() : null,
                synced_at: new Date().toISOString()
              }
            }
          };
        } catch (err) {
          console.error('Error preparing product for DynamoDB:', err);
          console.log('Problematic product:', JSON.stringify(product).substring(0, 500) + '...');
          errorCount++;
          return null;
        }
      }).filter(Boolean); // Remove any null items from failed processing
      
      // Skip if no items to write
      if (putRequests.length === 0) {
        console.log(`Batch ${totalBatchesProcessed} (items ${i+1}-${i+batch.length}): No valid items to write, skipping`);
        continue;
      }
      
      console.log(`Writing batch ${totalBatchesProcessed} (${i+1}-${i+batch.length} of ${products.length} products) with ${putRequests.length} valid items...`);
      
      // Write to DynamoDB with improved retry logic
      let success = false;
      let writeRetries = 0;
      const maxWriteRetries = 5;
      
      while (!success && writeRetries < maxWriteRetries) {
        try {
          // Add a small delay between batches to avoid overwhelming DynamoDB
          if (totalBatchesProcessed > 1 || writeRetries > 0) {
            const delay = writeRetries === 0 ? 100 : Math.min(500 * Math.pow(2, writeRetries), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const result = await dynamoDB.batchWrite({
            RequestItems: {
              [TABLES.PRODUCTS]: putRequests
            }
          }).promise();
          
          // Check for unprocessed items
          if (result.UnprocessedItems && 
              result.UnprocessedItems[TABLES.PRODUCTS] && 
              result.UnprocessedItems[TABLES.PRODUCTS].length > 0) {
            
            const unprocessedCount = result.UnprocessedItems[TABLES.PRODUCTS].length;
            console.warn(`Batch partially processed: ${putRequests.length - unprocessedCount} items written, ${unprocessedCount} items unprocessed`);
            
            // Only count the processed items as successful
            successCount += (putRequests.length - unprocessedCount);
            
            // Retry with just the unprocessed items
            putRequests = result.UnprocessedItems[TABLES.PRODUCTS];
            writeRetries++;
            
            if (writeRetries >= maxWriteRetries) {
              console.error(`Failed to process ${unprocessedCount} items after ${maxWriteRetries} attempts`);
              errorCount += unprocessedCount;
              success = true; // Exit retry loop but record the errors
            }
          } else {
            // All items processed successfully
            console.log(`Successfully wrote batch of ${putRequests.length} products to DynamoDB`);
            successCount += putRequests.length;
            success = true;
          }
        } catch (error) {
          writeRetries++;
          
          // Check for provisioned throughput errors
          if (error.code === 'ProvisionedThroughputExceededException') {
            console.warn(`DynamoDB throughput exceeded. Attempt ${writeRetries}/${maxWriteRetries}`);
            // Use exponential backoff with longer delays for throughput errors
            const delay = Math.min(2000 * Math.pow(2, writeRetries), 30000);
            console.log(`Waiting ${delay}ms before retry due to throughput limits...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`Error writing product batch to DynamoDB (attempt ${writeRetries}/${maxWriteRetries}):`, error);
            
            // Generic exponential backoff for other errors
            const delay = Math.min(1000 * Math.pow(2, writeRetries), 15000);
            console.log(`Retrying after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          if (writeRetries >= maxWriteRetries) {
            console.error(`Failed to write batch after ${maxWriteRetries} attempts, marking ${putRequests.length} products as failed`);
            errorCount += putRequests.length;
            totalErrors++;
            success = true; // Exit retry loop but record the errors
          }
        }
      }
      
      // Update progress every 10 batches
      if (totalBatchesProcessed % 10 === 0) {
        try {
          await updateSyncMetadata({
            syncId: 'products_write_progress',
            status: 'writing',
            totalItems: products.length,
            itemsProcessed: i + batch.length,
            successCount,
            errorCount,
            timestamp: new Date().toISOString()
          });
          console.log(`Progress update: ${successCount} products written successfully, ${errorCount} failures`);
        } catch (err) {
          console.error('Error updating write progress:', err);
        }
      }
    }
    
    totalProductsSynced = successCount;
    
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;
    const writesDuration = (endTime - fetchEndTime) / 1000;
    
    console.log(`===== PRODUCT SYNC COMPLETED =====`);
    console.log(`${totalProductsRetrieved} products retrieved, ${totalProductsSynced} successfully written to DynamoDB, ${errorCount} failures`);
    console.log(`Total time: ${totalDuration.toFixed(2)} seconds (Fetch: ${fetchDuration.toFixed(2)}s, Write: ${writesDuration.toFixed(2)}s)`);
    console.log(`Sync rate: ${(totalProductsSynced / totalDuration).toFixed(2)} products/second`);
    
    // Update last sync timestamp
    await updateLastSyncTimestamp('products', new Date().toISOString());
    
    if (errorCount > 0) {
      console.warn(`WARNING: ${errorCount} products could not be synced (${((errorCount/totalProductsRetrieved)*100).toFixed(2)}% failure rate)`);
    }
    
    return totalProductsSynced;
  } catch (error) {
    console.error('CRITICAL ERROR in product sync process:', error);
    console.log(`Partial results: ${totalProductsRetrieved} products retrieved, ${totalProductsSynced} successfully synced`);
    
    // Try to update sync metadata with partial results even in case of failure
    try {
      await updateSyncMetadata({
        syncId: 'products_error',
        status: 'error',
        error: error.message,
        productsRetrieved: totalProductsRetrieved,
        productsSynced: totalProductsSynced,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to update error metadata:', err);
    }
    
    throw error;
  }
};

/**
 * Sync customers from Shopify to DynamoDB
 * @returns {Promise<number>} Total number of customers synced successfully
 */
const syncCustomers = async () => {
  console.log('STARTING COMPREHENSIVE CUSTOMER SYNC - NO LIMITATIONS');
  
  let totalCustomersRetrieved = 0;
  let totalCustomersSynced = 0;
  let totalBatchesProcessed = 0;
  let totalErrors = 0;
  
  try {
    // Fetch ALL customers without any limitations
    let params = { 
      limit: 250  // Maximum allowed by Shopify API
    };
    
    let customers = [];
    let hasNextPage = true;
    let pageCount = 0;
    
    const startTime = Date.now();
    console.log(`Customer sync started at: ${new Date(startTime).toISOString()}`);
    
    // ===== FETCHING PHASE =====
    console.log('===== PHASE 1: FETCHING ALL CUSTOMERS FROM SHOPIFY =====');
    
    while (hasNextPage) {
      pageCount++;
      let retries = 0;
      const maxRetries = 5; // Increase retry attempts
      let pageSuccess = false;
      
      while (!pageSuccess && retries < maxRetries) {
        try {
          console.log(`Fetching customer batch page ${pageCount} (attempt ${retries + 1}/${maxRetries})...`);
          
          // Add a small delay before making the request to avoid rate limits
          if (retries > 0 || pageCount > 1) {
            const delay = retries === 0 ? 500 : Math.min(1000 * Math.pow(2, retries - 1), 30000);
            console.log(`Waiting ${delay}ms before making request...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const result = await shopify.customer.list(params);
          
          if (result && Array.isArray(result)) {
            console.log(`Retrieved ${result.length} customers on page ${pageCount}`);
            
            if (result.length > 0) {
              // Process this batch of customers
              customers = customers.concat(result);
              totalCustomersRetrieved += result.length;
              
              console.log(`Running total: ${totalCustomersRetrieved} customers retrieved so far`);
              
              // Check if this is the last page
              if (result.length < 250) {
                console.log('Received fewer customers than requested limit, reached end of pagination');
                hasNextPage = false;
              } else if (result.nextPageParameters && result.nextPageParameters.page_info) {
                // Update params for next page
                params = { 
                  limit: 250,
                  page_info: result.nextPageParameters.page_info 
                };
                console.log('Moving to next page of customers with pagination token');
              } else {
                console.log('WARNING: No pagination info returned but received full page of results');
                // This shouldn't normally happen with proper pagination
                // Try one more page with same params as a fallback
                hasNextPage = false;
              }
              
              pageSuccess = true;
            } else {
              console.log('Received empty result array, reached end of pagination');
              hasNextPage = false;
              pageSuccess = true;
            }
          } else {
            console.log('WARNING: Unexpected response format from Shopify API');
            console.log('Response:', JSON.stringify(result).substring(0, 500) + '...');
            
            // Increment retry counter for this page
            retries++;
            if (retries >= maxRetries) {
              console.error(`Failed to fetch page ${pageCount} after ${maxRetries} attempts, continuing with customers fetched so far`);
              hasNextPage = false;
              totalErrors++;
            }
          }
        } catch (error) {
          totalErrors++;
          retries++;
          
          // Check for rate limiting errors specifically
          if (error.statusCode === 429) {
            const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '10', 10);
            console.log(`Rate limited by Shopify API. Waiting ${retryAfter} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          } else {
            console.error(`Error fetching customer batch on page ${pageCount} (attempt ${retries}/${maxRetries}):`, error);
            
            // Exponential backoff with jitter
            if (retries < maxRetries) {
              const baseDelay = Math.min(1000 * Math.pow(2, retries), 60000);
              const jitter = Math.floor(Math.random() * 1000);
              const delay = baseDelay + jitter;
              console.log(`Retrying after ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          if (retries >= maxRetries) {
            console.error(`Failed to fetch page ${pageCount} after ${maxRetries} attempts, continuing with customers fetched so far`);
            pageSuccess = true; // Mark as "successful" to exit retry loop and continue with what we have
          }
        }
      }
      
      // Save progress checkpoint every 5 pages
      if (pageCount % 5 === 0) {
        console.log(`CHECKPOINT: Saving progress after ${pageCount} pages (${totalCustomersRetrieved} customers)`);
        try {
          await updateSyncMetadata({
            syncId: 'customers_in_progress',
            status: 'in_progress',
            customersRetrieved: totalCustomersRetrieved,
            pagesProcessed: pageCount,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error saving checkpoint:', err);
        }
      }
    }
    
    const fetchEndTime = Date.now();
    const fetchDuration = (fetchEndTime - startTime) / 1000;
    console.log(`===== COMPLETED FETCH PHASE: Retrieved ${totalCustomersRetrieved} total customers in ${fetchDuration.toFixed(2)} seconds =====`);
    
    // ===== PROCESSING PHASE =====
    console.log('===== PHASE 2: WRITING CUSTOMERS TO DYNAMODB =====');
    
    // Use a smaller batch size to reduce the chance of exceeding DynamoDB limits
    const batchSize = 25;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < customers.length; i += batchSize) {
      totalBatchesProcessed++;
      const batch = customers.slice(i, i + batchSize);
      
      // Prepare batch items with improved error handling for malformed data
      const putRequests = batch.map(customer => {
        try {
          return {
            PutRequest: {
              Item: {
                id: customer.id ? customer.id.toString() : `unknown-${Date.now()}-${Math.random()}`,
                email: customer.email || '',
                first_name: customer.first_name || '',
                last_name: customer.last_name || '',
                created_at: customer.created_at || new Date().toISOString(),
                updated_at: customer.updated_at || new Date().toISOString(),
                orders_count: customer.orders_count || 0,
                total_spent: customer.total_spent || '0.00',
                phone: customer.phone || '',
                addresses: Array.isArray(customer.addresses) ? customer.addresses.map(address => ({
                  id: address.id ? address.id.toString() : `addr-${Math.random().toString(36).substring(2, 15)}`,
                  address1: address.address1 || '',
                  address2: address.address2 || '',
                  city: address.city || '',
                  province: address.province || '',
                  country: address.country || '',
                  zip: address.zip || '',
                  company: address.company || '',
                  name: address.name || '',
                  phone: address.phone || '',
                  default: address.default || false,
                })) : [],
                tags: customer.tags ? customer.tags.split(',').map(tag => tag.trim()) : [],
                tax_exempt: customer.tax_exempt || false,
                verified_email: customer.verified_email || false,
                state: customer.state || 'enabled',
                note: customer.note || '',
                last_order_id: customer.last_order_id ? customer.last_order_id.toString() : null,
                last_order_date: customer.last_order_date || null,
                accepts_marketing: customer.accepts_marketing || false,
                locale: customer.locale || 'en',
                currency: customer.currency || 'USD',
                // Store admin URL for easy access
                admin_url: `https://${process.env.SHOPIFY_STORE_URL}/admin/customers/${customer.id}`,
                synced_at: new Date().toISOString()
              }
            }
          };
        } catch (err) {
          console.error('Error preparing customer for DynamoDB:', err);
          console.log('Problematic customer:', JSON.stringify(customer).substring(0, 500) + '...');
          errorCount++;
          return null;
        }
      }).filter(Boolean); // Remove any null items from failed processing
      
      // Skip if no items to write
      if (putRequests.length === 0) {
        console.log(`Batch ${totalBatchesProcessed} (items ${i+1}-${i+batch.length}): No valid items to write, skipping`);
        continue;
      }
      
      console.log(`Writing batch ${totalBatchesProcessed} (${i+1}-${i+batch.length} of ${customers.length} customers) with ${putRequests.length} valid items...`);
      
      // Write to DynamoDB with improved retry logic
      let success = false;
      let writeRetries = 0;
      const maxWriteRetries = 5;
      
      while (!success && writeRetries < maxWriteRetries) {
        try {
          // Add a small delay between batches to avoid overwhelming DynamoDB
          if (totalBatchesProcessed > 1 || writeRetries > 0) {
            const delay = writeRetries === 0 ? 100 : Math.min(500 * Math.pow(2, writeRetries), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const result = await dynamoDB.batchWrite({
            RequestItems: {
              [TABLES.CUSTOMERS]: putRequests
            }
          }).promise();
          
          // Check for unprocessed items
          if (result.UnprocessedItems && 
              result.UnprocessedItems[TABLES.CUSTOMERS] && 
              result.UnprocessedItems[TABLES.CUSTOMERS].length > 0) {
            
            const unprocessedCount = result.UnprocessedItems[TABLES.CUSTOMERS].length;
            console.warn(`Batch partially processed: ${putRequests.length - unprocessedCount} items written, ${unprocessedCount} items unprocessed`);
            
            // Only count the processed items as successful
            successCount += (putRequests.length - unprocessedCount);
            
            // Retry with just the unprocessed items
            putRequests = result.UnprocessedItems[TABLES.CUSTOMERS];
            writeRetries++;
            
            if (writeRetries >= maxWriteRetries) {
              console.error(`Failed to process ${unprocessedCount} items after ${maxWriteRetries} attempts`);
              errorCount += unprocessedCount;
              success = true; // Exit retry loop but record the errors
            }
          } else {
            // All items processed successfully
            console.log(`Successfully wrote batch of ${putRequests.length} customers to DynamoDB`);
            successCount += putRequests.length;
            success = true;
          }
        } catch (error) {
          writeRetries++;
          
          // Check for provisioned throughput errors
          if (error.code === 'ProvisionedThroughputExceededException') {
            console.warn(`DynamoDB throughput exceeded. Attempt ${writeRetries}/${maxWriteRetries}`);
            // Use exponential backoff with longer delays for throughput errors
            const delay = Math.min(2000 * Math.pow(2, writeRetries), 30000);
            console.log(`Waiting ${delay}ms before retry due to throughput limits...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`Error writing customer batch to DynamoDB (attempt ${writeRetries}/${maxWriteRetries}):`, error);
            
            // Generic exponential backoff for other errors
            const delay = Math.min(1000 * Math.pow(2, writeRetries), 15000);
            console.log(`Retrying after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          if (writeRetries >= maxWriteRetries) {
            console.error(`Failed to write batch after ${maxWriteRetries} attempts, marking ${putRequests.length} customers as failed`);
            errorCount += putRequests.length;
            totalErrors++;
            success = true; // Exit retry loop but record the errors
          }
        }
      }
      
      // Update progress every 10 batches
      if (totalBatchesProcessed % 10 === 0) {
        try {
          await updateSyncMetadata({
            syncId: 'customers_write_progress',
            status: 'writing',
            totalItems: customers.length,
            itemsProcessed: i + batch.length,
            successCount,
            errorCount,
            timestamp: new Date().toISOString()
          });
          console.log(`Progress update: ${successCount} customers written successfully, ${errorCount} failures`);
        } catch (err) {
          console.error('Error updating write progress:', err);
        }
      }
    }
    
    totalCustomersSynced = successCount;
    
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;
    const writesDuration = (endTime - fetchEndTime) / 1000;
    
    console.log(`===== CUSTOMER SYNC COMPLETED =====`);
    console.log(`${totalCustomersRetrieved} customers retrieved, ${totalCustomersSynced} successfully written to DynamoDB, ${errorCount} failures`);
    console.log(`Total time: ${totalDuration.toFixed(2)} seconds (Fetch: ${fetchDuration.toFixed(2)}s, Write: ${writesDuration.toFixed(2)}s)`);
    console.log(`Sync rate: ${(totalCustomersSynced / totalDuration).toFixed(2)} customers/second`);
    
    // Update last sync timestamp
    await updateLastSyncTimestamp('customers', new Date().toISOString());
    
    if (errorCount > 0) {
      console.warn(`WARNING: ${errorCount} customers could not be synced (${((errorCount/totalCustomersRetrieved)*100).toFixed(2)}% failure rate)`);
    }
    
    return totalCustomersSynced;
  } catch (error) {
    console.error('CRITICAL ERROR in customer sync process:', error);
    console.log(`Partial results: ${totalCustomersRetrieved} customers retrieved, ${totalCustomersSynced} successfully synced`);
    
    // Try to update sync metadata with partial results even in case of failure
    try {
      await updateSyncMetadata({
        syncId: 'customers_error',
        status: 'error',
        error: error.message,
        customersRetrieved: totalCustomersRetrieved,
        customersSynced: totalCustomersSynced,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to update error metadata:', err);
    }
    
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

/**
 * Process multiple order export files from S3
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Promise<Object>} - Result of the import
 */
const processOrderExportFiles = async (event, context) => {
  console.log('Starting batch import of order export files', { event });
  
  if (context && typeof context.getRemainingTimeInMillis === 'function') {
    console.log(`Initial Lambda remaining time: ${context.getRemainingTimeInMillis()}ms`);
    
    // Set a timer to log remaining time periodically
    const timeLogInterval = setInterval(() => {
      console.log(`Remaining Lambda time: ${context.getRemainingTimeInMillis()}ms`);
    }, 30000); // Log every 30 seconds
    
    // Clear the interval when function completes
    setTimeout(() => clearInterval(timeLogInterval), context.getRemainingTimeInMillis() - 1000);
  }
  
  // Initialize S3 client
  const s3 = new AWS.S3();
  
  // Get S3 bucket and prefix from event or environment variables
  const s3Bucket = event.bucket || process.env.EXPORT_FILES_BUCKET;
  const s3Prefix = event.prefix || process.env.EXPORT_FILES_PREFIX || 'order_exports/';
  
  if (!s3Bucket) {
    const error = new Error('S3 bucket not specified. Provide it in the event or set EXPORT_FILES_BUCKET environment variable');
    console.error(error);
    throw error;
  }
  
  console.log(`Looking for order export files in s3://${s3Bucket}/${s3Prefix}`);
  
  try {
    // Create a single import ID for this entire process
    const importId = `import_${Date.now()}`;
    console.log(`Starting import with ID: ${importId}`);
    
    // Mark import as started in metadata
    await updateSyncMetadata({
      syncId: importId,
      status: 'started',
      startedAt: new Date().toISOString(),
      type: 'order_export_import'
    });
    
    // List all objects in the S3 bucket with the given prefix
    const listParams = {
      Bucket: s3Bucket,
      Prefix: s3Prefix
    };
    
    const listedObjects = await s3.listObjectsV2(listParams).promise();
    
    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log(`No files found in s3://${s3Bucket}/${s3Prefix}`);
      
      await updateSyncMetadata({
        syncId: importId,
        status: 'completed',
        completedAt: new Date().toISOString(),
        filesFound: 0,
        message: 'No files found to import'
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Import completed but no files were found',
          importId,
          filesFound: 0
        })
      };
    }
    
    // Filter for CSV files only
    const csvFiles = listedObjects.Contents.filter(file => 
      file.Key.toLowerCase().endsWith('.csv')
    );
    
    console.log(`Found ${csvFiles.length} CSV files to process`);
    
    // Update metadata with file count
    await updateSyncMetadata({
      syncId: importId,
      status: 'in_progress',
      filesFound: csvFiles.length,
      timestamp: new Date().toISOString()
    });
    
    // Process stats
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    let filesProcessed = 0;
    
    // Create a temporary directory for processing
    const tempDir = `/tmp/order_exports_${Date.now()}`;
    const fs = require('fs');
    const path = require('path');
    const csv = require('csv-parser');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Process files one by one
    for (const file of csvFiles) {
      const fileName = path.basename(file.Key);
      const tempFilePath = path.join(tempDir, fileName);
      
      console.log(`Processing file ${++filesProcessed}/${csvFiles.length}: ${fileName}`);
      
      // Download file from S3
      try {
        const s3Object = await s3.getObject({
          Bucket: s3Bucket,
          Key: file.Key
        }).promise();
        
        fs.writeFileSync(tempFilePath, s3Object.Body);
        console.log(`Downloaded ${fileName} (${s3Object.ContentLength} bytes)`);
        
        // Update progress
        await updateSyncMetadata({
          syncId: importId,
          status: 'processing',
          filesProcessed,
          currentFile: fileName,
          timestamp: new Date().toISOString()
        });
        
        // Process the CSV file
        const orders = [];
        let rowCount = 0;
        
        await new Promise((resolve, reject) => {
          fs.createReadStream(tempFilePath)
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
        
        // Write orders to DynamoDB in batches
        console.log(`Writing ${orders.length} orders from ${fileName} to DynamoDB...`);
        
        const batchSize = 25; // DynamoDB batch limit
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < orders.length; i += batchSize) {
          const batch = orders.slice(i, i + batchSize);
          
          // Prepare batch items
          const putRequests = batch.map(order => ({
            PutRequest: {
              Item: order
            }
          }));
          
          // Skip if no items to write
          if (putRequests.length === 0) continue;
          
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
              console.error(`Error writing batch to DynamoDB (attempt ${retries}/${maxRetries}):`, error);
              
              if (retries >= maxRetries) {
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
        }
        
        console.log(`File ${fileName} import complete: ${successCount} succeeded, ${errorCount} failed`);
        
        // Update totals
        totalProcessed += rowCount;
        totalSuccess += successCount;
        totalErrors += errorCount;
        
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
        
      } catch (error) {
        console.error(`Error processing file ${fileName}:`, error);
        totalErrors += 1;
        
        // Continue with next file
        continue;
      }
      
      // Update progress every 5 files
      if (filesProcessed % 5 === 0 || filesProcessed === csvFiles.length) {
        await updateSyncMetadata({
          syncId: importId,
          status: 'in_progress',
          filesProcessed,
          totalFiles: csvFiles.length,
          rowsProcessed: totalProcessed,
          ordersImported: totalSuccess,
          errors: totalErrors,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Update the last sync timestamp for orders
    await updateLastSyncTimestamp('orders', new Date().toISOString());
    
    // Final update to metadata
    await updateSyncMetadata({
      syncId: importId,
      status: 'completed',
      completedAt: new Date().toISOString(),
      filesProcessed,
      totalFiles: csvFiles.length,
      rowsProcessed: totalProcessed,
      ordersImported: totalSuccess,
      errors: totalErrors
    });
    
    console.log(`===== ORDER EXPORT IMPORT COMPLETED =====`);
    console.log(`Processed ${filesProcessed} files with ${totalProcessed} total rows`);
    console.log(`Imported ${totalSuccess} orders with ${totalErrors} errors`);
    
    // Clean up temp directory
    try {
      fs.rmdirSync(tempDir, { recursive: true });
    } catch (err) {
      console.error('Error cleaning up temp directory:', err);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order export import completed',
        importId,
        filesProcessed,
        totalFiles: csvFiles.length,
        rowsProcessed: totalProcessed,
        ordersImported: totalSuccess,
        errors: totalErrors,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Error importing order export files:', error);
    
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
};

/**
 * Transform CSV row to order object format for DynamoDB
 * @param {Object} row - CSV row data
 * @returns {Object|null} - Formatted order for DynamoDB or null if invalid
 */
const transformOrderRow = (row) => {
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
};

/**
 * Lambda handler for processing bulk order export files
 * @param {Object} event - AWS Lambda event object 
 * @param {Object} context - AWS Lambda context object
 * @returns {Promise<Object>} Result of the import process
 */
const handleOrderExportBulkImport = async (event, context) => {
  console.log('Order export bulk import lambda invoked', { event });
  
  try {
    // Process the order export files
    const result = await processOrderExportFiles(event, context);
    return result;
  } catch (error) {
    console.error('Error in order export bulk import:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error in order export bulk import',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Export handlers for different Lambda functions
exports.handler = async (event, context) => {
  console.log('Shopify handler lambda invoked', { event });
  
  // Determine which handler to use based on the event
  if (event.action === 'export_import' || event.source === 'order-export-import') {
    return handleOrderExportBulkImport(event, context);
  } else {
    // Default to the regular sync handler
    return await syncShopifyData(event, context);
  }
};

// Also export each handler separately for direct use
exports.syncHandler = async (event, context) => {
  return await syncShopifyData(event, context);
};

exports.exportImportHandler = async (event, context) => {
  return await handleOrderExportBulkImport(event, context);
};