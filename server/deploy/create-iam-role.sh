#!/bin/bash

# Exit on error
set -e

# Set environment (dev, staging, or prod)
ENVIRONMENT=${1:-dev}
REGION=${2:-"ap-south-1"}  # Default to ap-south-1 if not specified

echo "Creating IAM role for Lambda functions in environment: $ENVIRONMENT"

# Create a trust policy for Lambda
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
)

# Create a permissions policy for DynamoDB
DYNAMO_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:*:table/Shopify*-${ENVIRONMENT}",
        "arn:aws:dynamodb:${REGION}:*:table/Shopify*-${ENVIRONMENT}/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF
)

# Define role name
ROLE_NAME="ShopifyDashboardLambdaRole-${ENVIRONMENT}"

# Check if role already exists
ROLE_EXISTS=$(aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null || echo "")

if [ -z "$ROLE_EXISTS" ]; then
  echo "Creating new IAM role: $ROLE_NAME"
  
  # Create the IAM role with trust policy
  ROLE_RESPONSE=$(aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY")
  
  ROLE_ARN=$(echo "$ROLE_RESPONSE" | grep -o '"Arn": "[^"]*' | cut -d'"' -f4)
  
  # Create the policy
  POLICY_NAME="${ROLE_NAME}-Policy"
  POLICY_RESPONSE=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$DYNAMO_POLICY")
  
  POLICY_ARN=$(echo "$POLICY_RESPONSE" | grep -o '"Arn": "[^"]*' | cut -d'"' -f4)
  
  # Attach the policy to the role
  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "$POLICY_ARN"
  
  # Also attach the AWS-managed Lambda basic execution role policy
  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  
  echo "IAM role created successfully: $ROLE_ARN"
else
  # Role already exists, get its ARN
  ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query "Role.Arn" --output text)
  echo "IAM role already exists: $ROLE_ARN"
fi

echo ""
echo "To deploy the Lambda functions, run:"
echo "./deploy-lambdas.sh $ENVIRONMENT $REGION $ROLE_ARN"
echo ""

# Set the role ARN in the .env file
ENV_FILE="../.env"

if [ -f "$ENV_FILE" ]; then
  grep -q "^LAMBDA_ROLE_ARN=" "$ENV_FILE" && \
    sed -i '' "s|^LAMBDA_ROLE_ARN=.*|LAMBDA_ROLE_ARN=$ROLE_ARN|" "$ENV_FILE" || \
    echo "LAMBDA_ROLE_ARN=$ROLE_ARN" >> "$ENV_FILE"
  
  echo "Role ARN added to .env file"
fi

echo "Role ARN: $ROLE_ARN" 