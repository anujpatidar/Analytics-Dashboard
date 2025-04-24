#!/bin/bash

# Exit on error
set -e

# Current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Set environment (dev, staging, or prod)
ENVIRONMENT=${1:-dev}
REGION=${2:-"ap-south-1"}  # Default to ap-south-1 if not specified
ROLE_ARN=${3}  # Required: IAM Role ARN for Lambda execution

if [ -z "$ROLE_ARN" ]; then
  echo "Error: Lambda execution role ARN is required"
  echo "Usage: $0 <environment> <region> <role-arn>"
  exit 1
fi

echo "Deploying Lambda functions for environment: $ENVIRONMENT in region: $REGION"

# Create dist directory if it doesn't exist
mkdir -p "./dist"

# Check if we're in the server directory
if [ ! -f "../package.json" ]; then
  echo "Error: This script must be run from the deploy directory"
  exit 1
fi

# Create Lambda packages
echo "Creating Lambda packages..."
cd ..
npm ci --production

echo "Packaging API Lambda..."
cd "$SCRIPT_DIR/.."
rm -rf ./dist/api-lambda.zip 2>/dev/null || true
zip -q -r "./deploy/dist/api-lambda.zip" apiLambda.js node_modules package.json

echo "Packaging Sync Lambda..."
cd "$SCRIPT_DIR/.."
rm -rf ./dist/sync-lambda.zip 2>/dev/null || true
zip -q -r "./deploy/dist/sync-lambda.zip" shopifySync.js node_modules package.json

cd "$SCRIPT_DIR"
echo "Lambda packages created successfully"

# Load environment variables
if [ -f "../.env" ]; then
  export $(grep -v '^#' ../.env | xargs)
else
  echo "Warning: No .env file found. Make sure you've set environment variables."
fi

# Set default table names if not in environment
ORDERS_TABLE=${ORDERS_TABLE:-"ShopifyOrders-$ENVIRONMENT"}
PRODUCTS_TABLE=${PRODUCTS_TABLE:-"ShopifyProducts-$ENVIRONMENT"}
CUSTOMERS_TABLE=${CUSTOMERS_TABLE:-"ShopifyCustomers-$ENVIRONMENT"}
SYNC_METADATA_TABLE=${SYNC_METADATA_TABLE:-"ShopifySyncMetadata-$ENVIRONMENT"}

# Deploy API Lambda
echo "Deploying API Lambda function..."
API_LAMBDA_NAME="ShopifyAnalyticsDashboardApi-$ENVIRONMENT"
API_LAMBDA_EXISTS=$(aws lambda list-functions --region "$REGION" --query "Functions[?FunctionName=='$API_LAMBDA_NAME'].FunctionName" --output text || echo "")

if [ -z "$API_LAMBDA_EXISTS" ]; then
  # Create new Lambda function
  echo "Creating new API Lambda function: $API_LAMBDA_NAME"
  aws lambda create-function \
    --function-name "$API_LAMBDA_NAME" \
    --zip-file "fileb://dist/api-lambda.zip" \
    --handler "apiLambda.handler" \
    --runtime "nodejs18.x" \
    --role "$ROLE_ARN" \
    --timeout 30 \
    --memory-size 512 \
    --environment "Variables={NODE_ENV=$ENVIRONMENT,ORDERS_TABLE=$ORDERS_TABLE,PRODUCTS_TABLE=$PRODUCTS_TABLE,CUSTOMERS_TABLE=$CUSTOMERS_TABLE,SYNC_METADATA_TABLE=$SYNC_METADATA_TABLE,AWS_REGION=$REGION,SHOPIFY_API_KEY=$SHOPIFY_API_KEY,SHOPIFY_API_SECRET=$SHOPIFY_API_SECRET,SHOPIFY_STORE_URL=$SHOPIFY_STORE_URL}" \
    --region "$REGION"
else
  # Update existing Lambda function
  echo "Updating existing API Lambda function: $API_LAMBDA_NAME"
  aws lambda update-function-code \
    --function-name "$API_LAMBDA_NAME" \
    --zip-file "fileb://dist/api-lambda.zip" \
    --region "$REGION"

  # Update configuration
  aws lambda update-function-configuration \
    --function-name "$API_LAMBDA_NAME" \
    --timeout 30 \
    --memory-size 512 \
    --environment "Variables={NODE_ENV=$ENVIRONMENT,ORDERS_TABLE=$ORDERS_TABLE,PRODUCTS_TABLE=$PRODUCTS_TABLE,CUSTOMERS_TABLE=$CUSTOMERS_TABLE,SYNC_METADATA_TABLE=$SYNC_METADATA_TABLE,AWS_REGION=$REGION,SHOPIFY_API_KEY=$SHOPIFY_API_KEY,SHOPIFY_API_SECRET=$SHOPIFY_API_SECRET,SHOPIFY_STORE_URL=$SHOPIFY_STORE_URL}" \
    --region "$REGION"
fi

# Deploy Sync Lambda
echo "Deploying Sync Lambda function..."
SYNC_LAMBDA_NAME="ShopifyAnalyticsDashboardSync-$ENVIRONMENT"
SYNC_LAMBDA_EXISTS=$(aws lambda list-functions --region "$REGION" --query "Functions[?FunctionName=='$SYNC_LAMBDA_NAME'].FunctionName" --output text || echo "")

if [ -z "$SYNC_LAMBDA_EXISTS" ]; then
  # Create new Lambda function
  echo "Creating new Sync Lambda function: $SYNC_LAMBDA_NAME"
  aws lambda create-function \
    --function-name "$SYNC_LAMBDA_NAME" \
    --zip-file "fileb://dist/sync-lambda.zip" \
    --handler "shopifySync.handler" \
    --runtime "nodejs18.x" \
    --role "$ROLE_ARN" \
    --timeout 900 \
    --memory-size 1024 \
    --environment "Variables={NODE_ENV=$ENVIRONMENT,ORDERS_TABLE=$ORDERS_TABLE,PRODUCTS_TABLE=$PRODUCTS_TABLE,CUSTOMERS_TABLE=$CUSTOMERS_TABLE,SYNC_METADATA_TABLE=$SYNC_METADATA_TABLE,AWS_REGION=$REGION,SHOPIFY_API_KEY=$SHOPIFY_API_KEY,SHOPIFY_API_SECRET=$SHOPIFY_API_SECRET,SHOPIFY_STORE_URL=$SHOPIFY_STORE_URL}" \
    --region "$REGION"
else
  # Update existing Lambda function
  echo "Updating existing Sync Lambda function: $SYNC_LAMBDA_NAME"
  aws lambda update-function-code \
    --function-name "$SYNC_LAMBDA_NAME" \
    --zip-file "fileb://dist/sync-lambda.zip" \
    --region "$REGION"

  # Update configuration
  aws lambda update-function-configuration \
    --function-name "$SYNC_LAMBDA_NAME" \
    --timeout 900 \
    --memory-size 1024 \
    --environment "Variables={NODE_ENV=$ENVIRONMENT,ORDERS_TABLE=$ORDERS_TABLE,PRODUCTS_TABLE=$PRODUCTS_TABLE,CUSTOMERS_TABLE=$CUSTOMERS_TABLE,SYNC_METADATA_TABLE=$SYNC_METADATA_TABLE,AWS_REGION=$REGION,SHOPIFY_API_KEY=$SHOPIFY_API_KEY,SHOPIFY_API_SECRET=$SHOPIFY_API_SECRET,SHOPIFY_STORE_URL=$SHOPIFY_STORE_URL}" \
    --region "$REGION"
fi

echo "Lambda functions deployed successfully!"
echo "API Lambda: $API_LAMBDA_NAME"
echo "Sync Lambda: $SYNC_LAMBDA_NAME" 