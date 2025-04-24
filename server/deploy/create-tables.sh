#!/bin/bash

# Exit on error
set -e

# Set environment (dev, staging, or prod)
ENVIRONMENT=${1:-dev}
REGION=${2:-"ap-south-1"}  # Default to ap-south-1 if not specified

echo "Creating DynamoDB tables for environment: $ENVIRONMENT in region: $REGION"

# Function to check if a table exists
table_exists() {
  local TABLE_NAME=$1
  local EXISTS=$(aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" 2>/dev/null || echo "")
  
  if [ -n "$EXISTS" ]; then
    echo "Table $TABLE_NAME already exists, skipping creation."
    return 0  # Table exists
  else
    return 1  # Table does not exist
  fi
}

# Create Orders Table
ORDERS_TABLE="ShopifyOrders-$ENVIRONMENT"
if ! table_exists "$ORDERS_TABLE"; then
  echo "Creating $ORDERS_TABLE table..."
  aws dynamodb create-table \
      --table-name "$ORDERS_TABLE" \
      --attribute-definitions \
          AttributeName=id,AttributeType=S \
          AttributeName=date,AttributeType=S \
      --key-schema \
          AttributeName=id,KeyType=HASH \
      --global-secondary-indexes \
          IndexName=DateIndex,KeySchema=["{AttributeName=date,KeyType=HASH}"],Projection="{ProjectionType=ALL}" \
      --billing-mode PAY_PER_REQUEST \
      --region $REGION
  
  echo "Waiting for $ORDERS_TABLE to be created..."
  aws dynamodb wait table-exists --table-name "$ORDERS_TABLE" --region "$REGION"
fi

# Create Products Table
PRODUCTS_TABLE="ShopifyProducts-$ENVIRONMENT"
if ! table_exists "$PRODUCTS_TABLE"; then
  echo "Creating $PRODUCTS_TABLE table..."
  aws dynamodb create-table \
      --table-name "$PRODUCTS_TABLE" \
      --attribute-definitions \
          AttributeName=id,AttributeType=S \
      --key-schema \
          AttributeName=id,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST \
      --region $REGION
  
  echo "Waiting for $PRODUCTS_TABLE to be created..."
  aws dynamodb wait table-exists --table-name "$PRODUCTS_TABLE" --region "$REGION"
fi

# Create Customers Table
CUSTOMERS_TABLE="ShopifyCustomers-$ENVIRONMENT"
if ! table_exists "$CUSTOMERS_TABLE"; then
  echo "Creating $CUSTOMERS_TABLE table..."
  aws dynamodb create-table \
      --table-name "$CUSTOMERS_TABLE" \
      --attribute-definitions \
          AttributeName=id,AttributeType=S \
      --key-schema \
          AttributeName=id,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST \
      --region $REGION
  
  echo "Waiting for $CUSTOMERS_TABLE to be created..."
  aws dynamodb wait table-exists --table-name "$CUSTOMERS_TABLE" --region "$REGION"
fi

# Create Sync Metadata Table
SYNC_METADATA_TABLE="ShopifySyncMetadata-$ENVIRONMENT"
if ! table_exists "$SYNC_METADATA_TABLE"; then
  echo "Creating $SYNC_METADATA_TABLE table..."
  aws dynamodb create-table \
      --table-name "$SYNC_METADATA_TABLE" \
      --attribute-definitions \
          AttributeName=syncId,AttributeType=S \
      --key-schema \
          AttributeName=syncId,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST \
      --region $REGION
  
  echo "Waiting for $SYNC_METADATA_TABLE to be created..."
  aws dynamodb wait table-exists --table-name "$SYNC_METADATA_TABLE" --region "$REGION"
fi

echo "All tables available:"
echo "- $ORDERS_TABLE"
echo "- $PRODUCTS_TABLE"
echo "- $CUSTOMERS_TABLE"
echo "- $SYNC_METADATA_TABLE" 