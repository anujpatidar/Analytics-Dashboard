#!/bin/bash

# Exit on error
set -e

# Current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Set environment (dev, staging, or prod)
ENVIRONMENT=${1:-dev}
REGION=${2:-"ap-south-1"}  # Default to ap-south-1 if not specified

echo "Setting up API Gateway for environment: $ENVIRONMENT in region: $REGION"

# Load environment variables
if [ -f "../.env" ]; then
  export $(grep -v '^#' ../.env | xargs)
else
  echo "Warning: No .env file found. Make sure you've set environment variables."
fi

# Define names
API_NAME="ShopifyAnalyticsDashboardApi-$ENVIRONMENT"
LAMBDA_NAME="ShopifyAnalyticsDashboardApi-$ENVIRONMENT"

# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)

if [ -z "$LAMBDA_ARN" ]; then
  echo "Error: Lambda function '$LAMBDA_NAME' not found. Deploy Lambda function first."
  exit 1
fi

# Check if API already exists
API_ID=$(aws apigateway get-rest-apis --region "$REGION" --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ]; then
  echo "Creating new API Gateway: $API_NAME"
  
  # Create API
  API_RESPONSE=$(aws apigateway create-rest-api \
    --name "$API_NAME" \
    --description "API for Shopify Analytics Dashboard" \
    --endpoint-configuration "{ \"types\": [\"REGIONAL\"] }" \
    --region "$REGION")
  
  API_ID=$(echo "$API_RESPONSE" | grep -o '"id": "[^"]*' | cut -d'"' -f4)
  
  echo "API Gateway created with ID: $API_ID"
else
  echo "API Gateway already exists with ID: $API_ID"
fi

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?path==`/`].id' --output text)

# Check if proxy resource already exists
PROXY_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?path==`/{proxy+}`].id' --output text)

if [ -z "$PROXY_RESOURCE_ID" ]; then
  echo "Creating proxy resource"
  
  # Create proxy resource
  PROXY_RESOURCE_RESPONSE=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$ROOT_RESOURCE_ID" \
    --path-part "{proxy+}" \
    --region "$REGION")
  
  PROXY_RESOURCE_ID=$(echo "$PROXY_RESOURCE_RESPONSE" | grep -o '"id": "[^"]*' | cut -d'"' -f4)
  
  echo "Proxy resource created with ID: $PROXY_RESOURCE_ID"
else
  echo "Proxy resource already exists with ID: $PROXY_RESOURCE_ID"
fi

# Create ANY method for root resource if it doesn't exist
ROOT_ANY_METHOD=$(aws apigateway get-method --rest-api-id "$API_ID" --resource-id "$ROOT_RESOURCE_ID" --http-method ANY --region "$REGION" 2>/dev/null || echo "")

if [ -z "$ROOT_ANY_METHOD" ]; then
  echo "Creating ANY method for root resource"
  
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$ROOT_RESOURCE_ID" \
    --http-method ANY \
    --authorization-type NONE \
    --region "$REGION"
  
  # Create integration with Lambda
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$ROOT_RESOURCE_ID" \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region "$REGION"
  
  echo "Root resource ANY method created"
else
  echo "Root resource ANY method already exists"
fi

# Create ANY method for proxy resource if it doesn't exist
PROXY_ANY_METHOD=$(aws apigateway get-method --rest-api-id "$API_ID" --resource-id "$PROXY_RESOURCE_ID" --http-method ANY --region "$REGION" 2>/dev/null || echo "")

if [ -z "$PROXY_ANY_METHOD" ]; then
  echo "Creating ANY method for proxy resource"
  
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method ANY \
    --authorization-type NONE \
    --region "$REGION"
  
  # Create integration with Lambda
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region "$REGION"
  
  echo "Proxy resource ANY method created"
else
  echo "Proxy resource ANY method already exists"
fi

# Add Lambda permission if it doesn't exist
PERMISSION_EXISTS=$(aws lambda get-policy --function-name "$LAMBDA_NAME" --region "$REGION" 2>/dev/null | grep -o "apigateway:$API_ID" || echo "")

if [ -z "$PERMISSION_EXISTS" ]; then
  echo "Adding permission for API Gateway to invoke Lambda"
  
  aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "apigateway-$API_ID" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query 'Account' --output text):$API_ID/*/*/*" \
    --region "$REGION"
  
  echo "Lambda permission added"
else
  echo "Lambda permission already exists"
fi

# Deploy API
echo "Deploying API"
DEPLOYMENT_RESPONSE=$(aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$ENVIRONMENT" \
  --region "$REGION")

# Get deployment ID
DEPLOYMENT_ID=$(echo "$DEPLOYMENT_RESPONSE" | grep -o '"id": "[^"]*' | cut -d'"' -f4)
echo "API deployed with deployment ID: $DEPLOYMENT_ID"

# Get API endpoint
API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/$ENVIRONMENT"

echo "API Gateway setup completed!"
echo "API Endpoint: $API_ENDPOINT"

# Add API endpoint to .env file
ENV_FILE="../.env"
if [ -f "$ENV_FILE" ]; then
  grep -q "^API_ENDPOINT=" "$ENV_FILE" && \
    sed -i '' "s|^API_ENDPOINT=.*|API_ENDPOINT=$API_ENDPOINT|" "$ENV_FILE" || \
    echo "API_ENDPOINT=$API_ENDPOINT" >> "$ENV_FILE"
  
  echo "API Endpoint added to .env file"
fi 