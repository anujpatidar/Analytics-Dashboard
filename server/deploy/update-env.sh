#!/bin/bash

# Exit on error
set -e

# Set environment (dev, staging, or prod)
ENVIRONMENT=${1:-dev}
REGION=${2:-"ap-south-1"}  # Default to ap-south-1 if not specified

echo "Updating environment variables for environment: $ENVIRONMENT in region: $REGION"

# Update .env file with DynamoDB table names
ENV_FILE="../.env"

# Check if the .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating .env file..."
  touch "$ENV_FILE"
fi

# Add or update DynamoDB table names
grep -q "^ORDERS_TABLE=" "$ENV_FILE" && \
  sed -i '' "s/^ORDERS_TABLE=.*/ORDERS_TABLE=ShopifyOrders-$ENVIRONMENT/" "$ENV_FILE" || \
  echo "ORDERS_TABLE=ShopifyOrders-$ENVIRONMENT" >> "$ENV_FILE"

grep -q "^PRODUCTS_TABLE=" "$ENV_FILE" && \
  sed -i '' "s/^PRODUCTS_TABLE=.*/PRODUCTS_TABLE=ShopifyProducts-$ENVIRONMENT/" "$ENV_FILE" || \
  echo "PRODUCTS_TABLE=ShopifyProducts-$ENVIRONMENT" >> "$ENV_FILE"

grep -q "^CUSTOMERS_TABLE=" "$ENV_FILE" && \
  sed -i '' "s/^CUSTOMERS_TABLE=.*/CUSTOMERS_TABLE=ShopifyCustomers-$ENVIRONMENT/" "$ENV_FILE" || \
  echo "CUSTOMERS_TABLE=ShopifyCustomers-$ENVIRONMENT" >> "$ENV_FILE"

grep -q "^SYNC_METADATA_TABLE=" "$ENV_FILE" && \
  sed -i '' "s/^SYNC_METADATA_TABLE=.*/SYNC_METADATA_TABLE=ShopifySyncMetadata-$ENVIRONMENT/" "$ENV_FILE" || \
  echo "SYNC_METADATA_TABLE=ShopifySyncMetadata-$ENVIRONMENT" >> "$ENV_FILE"

grep -q "^AWS_REGION=" "$ENV_FILE" && \
  sed -i '' "s/^AWS_REGION=.*/AWS_REGION=$REGION/" "$ENV_FILE" || \
  echo "AWS_REGION=$REGION" >> "$ENV_FILE"

echo "Environment variables updated:"
echo "ORDERS_TABLE=ShopifyOrders-$ENVIRONMENT"
echo "PRODUCTS_TABLE=ShopifyProducts-$ENVIRONMENT"
echo "CUSTOMERS_TABLE=ShopifyCustomers-$ENVIRONMENT"
echo "SYNC_METADATA_TABLE=ShopifySyncMetadata-$ENVIRONMENT"
echo "AWS_REGION=$REGION"

echo "Environment variables updated successfully!" 