#!/bin/bash

# Exit on error
set -e

# Current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Set environment (dev, staging, or prod)
ENVIRONMENT=${1:-dev}
REGION=${2:-"ap-south-1"}  # Default to ap-south-1 if not specified

echo "Starting full deployment for environment: $ENVIRONMENT in region: $REGION"
echo "==============================================================="

# Make all scripts executable
chmod +x *.sh

# Function to run a step and continue even if it fails
run_step() {
  local STEP_NUM=$1
  local STEP_DESC=$2
  local COMMAND=$3
  
  echo "[$STEP_NUM/5] $STEP_DESC..."
  
  # Run the command but don't exit on error
  set +e
  eval $COMMAND
  local STATUS=$?
  set -e
  
  if [ $STATUS -ne 0 ]; then
    echo "WARNING: Step [$STEP_NUM/5] had errors but continuing deployment..."
  fi
  
  echo "---------------------------------------------------------------"
  return $STATUS
}

# 1. Create DynamoDB tables
run_step "1" "Creating DynamoDB tables" "./create-tables.sh \"$ENVIRONMENT\" \"$REGION\""

# 2. Update environment variables
run_step "2" "Updating environment variables" "./update-env.sh \"$ENVIRONMENT\" \"$REGION\""

# 3. Create IAM role for Lambda
run_step "3" "Creating IAM role" "./create-iam-role.sh \"$ENVIRONMENT\" \"$REGION\""

# Get the IAM role ARN from the .env file
if [ -f "../.env" ]; then
  source "../.env"
  ROLE_ARN=$LAMBDA_ROLE_ARN
else
  echo "Warning: .env file not found with LAMBDA_ROLE_ARN!"
  echo "Please provide the IAM role ARN (format: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME):"
  read ROLE_ARN
  
  if [ -z "$ROLE_ARN" ]; then
    echo "Error: No IAM role ARN provided. Exiting."
    exit 1
  fi
fi

# 4. Deploy Lambda functions
if [ -n "$ROLE_ARN" ]; then
  run_step "4" "Deploying Lambda functions" "./deploy-lambdas.sh \"$ENVIRONMENT\" \"$REGION\" \"$ROLE_ARN\""
else
  echo "[4/5] Skipping Lambda deployment due to missing role ARN..."
  echo "---------------------------------------------------------------"
fi

# 5. Create API Gateway
LAMBDA_EXISTS=$(aws lambda list-functions --region "$REGION" --query "Functions[?FunctionName=='ShopifyAnalyticsDashboardApi-$ENVIRONMENT'].FunctionName" --output text || echo "")

if [ -n "$LAMBDA_EXISTS" ]; then
  run_step "5" "Setting up API Gateway" "./create-api-gateway.sh \"$ENVIRONMENT\" \"$REGION\""
else
  echo "[5/5] Skipping API Gateway setup due to missing Lambda function..."
  echo "---------------------------------------------------------------"
fi

echo "Deployment completed!"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

# Print the API endpoint
if [ -f "../.env" ]; then
  source "../.env"
  if [ ! -z "$API_ENDPOINT" ]; then
    echo "API Endpoint: $API_ENDPOINT"
    echo "You can test the API with:"
    echo "curl $API_ENDPOINT/dashboard/summary"
  fi
fi

echo "===============================================================" 