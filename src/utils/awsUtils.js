/**
 * AWS Utilities for debugging and testing connections
 */
import AWS, { DynamoDB } from 'aws-sdk';
// import { getMockTables } from '../api/shopifyAPI';

// Flag to control mock data usage
const USE_MOCK_DATA = true; // Set to true to use mock data instead of real AWS data

/**
 * Test AWS credentials and DynamoDB access
 * This function can be called from the browser console for debugging
 */
export const testAWSConnection = async () => {
  // If using mock data, return a successful mock response
  if (USE_MOCK_DATA) {
    console.log('-------------- USING MOCK AWS DATA --------------');
    console.log('Mock mode is enabled. Returning mock connection results.');
    return {
      success: true,
      ordersCount: 125,
      productsCount: 48,
      customersCount: 87,
      isMock: true
    };
  }

  try {
    console.log('-------------- AWS CONNECTION TEST --------------');
    
    // Get AWS configuration from environment variables
    const awsRegion = process.env.REACT_APP_AWS_REGION;
    const awsAccessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
    
    console.log('AWS Configuration:');
    console.log('- Region:', awsRegion || 'Not set');
    console.log('- Access Key ID exists:', !!awsAccessKeyId);
    console.log('- Secret Access Key exists:', !!awsSecretAccessKey);
    
    // Get table names from environment variables
    const ORDERS_TABLE = process.env.REACT_APP_DYNAMODB_ORDERS_TABLE;
    const PRODUCTS_TABLE = process.env.REACT_APP_DYNAMODB_PRODUCTS_TABLE;
    const CUSTOMERS_TABLE = process.env.REACT_APP_DYNAMODB_CUSTOMERS_TABLE;
    
    console.log('DynamoDB Tables:');
    console.log('- Orders Table:', ORDERS_TABLE || 'Not set');
    console.log('- Products Table:', PRODUCTS_TABLE || 'Not set');
    console.log('- Customers Table:', CUSTOMERS_TABLE || 'Not set');
    
    // Initialize DynamoDB client
    const dynamoConfig = {
      region: awsRegion,
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey
    };
    
    console.log('Initializing DynamoDB client...');
    const dynamoClient = new DynamoDB.DocumentClient(dynamoConfig);
    
    // Test connecting to the Orders table
    console.log('Testing connection to Orders table...');
    const ordersResult = await dynamoClient.scan({
      TableName: ORDERS_TABLE,
      Limit: 2
    }).promise();
    
    console.log('Orders table connection successful!');
    console.log('- Items retrieved:', ordersResult.Items?.length || 0);
    if (ordersResult.Items?.length > 0) {
      console.log('- Sample item IDs:', ordersResult.Items.map(item => item.id || 'No ID'));
    }
    
    // Test connecting to the Products table
    console.log('Testing connection to Products table...');
    const productsResult = await dynamoClient.scan({
      TableName: PRODUCTS_TABLE,
      Limit: 2
    }).promise();
    
    console.log('Products table connection successful!');
    console.log('- Items retrieved:', productsResult.Items?.length || 0);
    
    // Test connecting to the Customers table
    console.log('Testing connection to Customers table...');
    const customersResult = await dynamoClient.scan({
      TableName: CUSTOMERS_TABLE,
      Limit: 2
    }).promise();
    
    console.log('Customers table connection successful!');
    console.log('- Items retrieved:', customersResult.Items?.length || 0);
    
    console.log('-------------- AWS CONNECTION TEST COMPLETE --------------');
    console.log('All tests passed! AWS credentials and DynamoDB access are working correctly.');
    
    return {
      success: true,
      ordersCount: ordersResult.Items?.length || 0,
      productsCount: productsResult.Items?.length || 0,
      customersCount: customersResult.Items?.length || 0
    };
  } catch (error) {
    console.error('-------------- AWS CONNECTION TEST FAILED --------------');
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'CredentialsError') {
      console.error('This is a credentials issue. Check that your AWS Access Key ID and Secret Access Key are correct.');
    } else if (error.code === 'NetworkingError') {
      console.error('This is a networking issue. Check your internet connection and AWS region.');
    } else if (error.code === 'ResourceNotFoundException') {
      console.error('Table not found. Check that your DynamoDB table names are correct and exist in the specified region.');
    }
    
    console.log('Falling back to mock data...');
    return {
      success: true,
      ordersCount: 125,
      productsCount: 48,
      customersCount: 87,
      isMock: true
    };
  }
};

// Export a function that can be called from a button in the UI
export const runAWSTest = () => {
  console.log('Running AWS connection test...');
  testAWSConnection()
    .then(result => {
      if (result.success) {
        if (result.isMock) {
          alert(`Using mock data: Found ${result.ordersCount} orders, ${result.productsCount} products, and ${result.customersCount} customers (MOCK DATA).`);
        } else {
          alert(`AWS connection successful! Found ${result.ordersCount} orders, ${result.productsCount} products, and ${result.customersCount} customers.`);
        }
      } else {
        alert(`AWS connection failed: ${result.error}`);
      }
    })
    .catch(err => {
      alert(`Error running test: ${err.message}`);
    });
};

// Make the test function available in the global scope for debugging
window.testAWSConnection = testAWSConnection;
window.runAWSTest = runAWSTest;

/**
 * List all tables in your DynamoDB account
 * This can help identify the correct table names
 */
export const listAllDynamoDBTables = async () => {
  // If using mock data, return mock tables
  if (USE_MOCK_DATA) {
    console.log('-------------- USING MOCK TABLE DATA --------------');
    const mockTables = ['shopify-orders', 'shopify-products', 'shopify-customers', 'shopify-sync-metadata'];
    return {
      success: true,
      tables: mockTables,
      isMock: true
    };
  }

  try {
    console.log('-------------- LISTING ALL DYNAMODB TABLES --------------');
    
    // Get AWS configuration from environment variables
    const awsRegion = process.env.REACT_APP_AWS_REGION;
    const awsAccessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
    
    // Initialize DynamoDB client (not DocumentClient)
    const dynamoConfig = {
      region: awsRegion,
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey
    };
    
    // Use the regular DynamoDB client (not DocumentClient) for listing tables
    const dynamoDB = new DynamoDB(dynamoConfig);
    
    // List all tables in the account
    console.log('Listing all tables in your AWS account...');
    const tableList = await dynamoDB.listTables({}).promise();
    
    console.log('Available tables:', tableList.TableNames);
    
    // Try to list some items from each table
    const dynamoClient = new DynamoDB.DocumentClient(dynamoConfig);
    
    for (const tableName of tableList.TableNames) {
      try {
        console.log(`\nGetting sample data from table: ${tableName}`);
        const data = await dynamoClient.scan({
          TableName: tableName,
          Limit: 1
        }).promise();
        
        console.log(`- Items found: ${data.Items?.length || 0}`);
        if (data.Items?.length > 0) {
          console.log('- Sample item:', JSON.stringify(data.Items[0], null, 2));
        }
      } catch (err) {
        console.error(`Error scanning table ${tableName}:`, err.message);
      }
    }
    
    console.log('-------------- TABLE LISTING COMPLETE --------------');
    
    return {
      success: true,
      tables: tableList.TableNames
    };
  } catch (error) {
    console.error('-------------- TABLE LISTING FAILED --------------');
    console.error('Error:', error);
    console.log('Falling back to mock data...');
    const mockTables = ['shopify-orders', 'shopify-products', 'shopify-customers', 'shopify-sync-metadata'];
    return {
      success: true,
      tables: mockTables,
      isMock: true
    };
  }
};

// Run this function from the console
window.listAllDynamoDBTables = listAllDynamoDBTables;

// Alert-based version for the UI
export const showAllTables = () => {
  listAllDynamoDBTables()
    .then(result => {
      if (result.success) {
        if (result.isMock) {
          alert(`Using mock data. Available DynamoDB tables:\n${result.tables.join('\n')} (MOCK DATA)`);
        } else {
          alert(`Available DynamoDB tables:\n${result.tables.join('\n')}`);
        }
      } else {
        alert(`Failed to list tables: ${result.error}`);
      }
    })
    .catch(err => {
      alert(`Error listing tables: ${err.message}`);
    });
}; 