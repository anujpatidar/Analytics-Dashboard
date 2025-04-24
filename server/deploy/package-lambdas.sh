#!/bin/bash

# Exit on error
set -e

# Set environment (dev, staging, or prod)
ENVIRONMENT=${1:-dev}
OUTPUT_DIR="./dist"

echo "Packaging Lambda functions for environment: $ENVIRONMENT"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Install production dependencies
echo "Installing production dependencies..."
npm ci --production

# Package API Lambda
echo "Packaging API Lambda function..."
zip -r "$OUTPUT_DIR/api-lambda.zip" apiLambda.js node_modules package.json

# Package Sync Lambda
echo "Packaging Sync Lambda function..."
zip -r "$OUTPUT_DIR/sync-lambda.zip" shopifySync.js node_modules package.json

echo "Lambda functions packaged successfully!"
echo "Lambda packages:"
echo "- $OUTPUT_DIR/api-lambda.zip"
echo "- $OUTPUT_DIR/sync-lambda.zip"

# Optionally, upload packages to S3 (if S3 bucket is provided)
if [ ! -z "$2" ]; then
  S3_BUCKET="$2"
  echo "Uploading Lambda packages to S3 bucket: $S3_BUCKET/$ENVIRONMENT/"
  
  aws s3 cp "$OUTPUT_DIR/api-lambda.zip" "s3://$S3_BUCKET/$ENVIRONMENT/api-lambda.zip"
  aws s3 cp "$OUTPUT_DIR/sync-lambda.zip" "s3://$S3_BUCKET/$ENVIRONMENT/sync-lambda.zip"
  
  echo "Lambda packages uploaded to S3 successfully!"
fi 