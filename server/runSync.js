// Script to run the Shopify sync function locally
require('dotenv').config();
const shopifySync = require('./shopifySync');

async function runSync() {
  console.log('Starting Shopify sync process locally...');
  
  try {
    // Call the Lambda handler function with mock event and context
    const result = await shopifySync.handler({}, {});
    console.log('Sync completed with result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error running sync:', error);
    throw error;
  }
}

// Run the sync function
runSync()
  .then(() => {
    console.log('Sync process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Sync process failed:', error);
    process.exit(1);
  }); 