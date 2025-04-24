// API Configuration
export const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'https://api.example.com';

// AWS Configuration
export const AWS_CONFIG = {
  region: process.env.REACT_APP_AWS_REGION,
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
};

// DynamoDB Table Names
export const DYNAMODB_TABLES = {
  orders: process.env.REACT_APP_DYNAMODB_ORDERS_TABLE || 'shopify-orders',
  products: process.env.REACT_APP_DYNAMODB_PRODUCTS_TABLE || 'shopify-products',
  customers: process.env.REACT_APP_DYNAMODB_CUSTOMERS_TABLE || 'shopify-customers',
  syncMetadata: process.env.REACT_APP_DYNAMODB_SYNC_METADATA_TABLE || 'shopify-sync-metadata'
}; 