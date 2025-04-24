# Setting Up AWS Infrastructure for Analytics Dashboard

This guide provides instructions for setting up the AWS backend infrastructure for the Shopify Analytics Dashboard.

## Prerequisites

1. An AWS account
2. AWS CLI installed and configured
3. Node.js and npm
4. Serverless Framework (`npm install -g serverless`)
5. Shopify Partner account and API access

## Architecture Overview

The backend infrastructure consists of:

1. **AWS API Gateway**: Serves as the API endpoint
2. **AWS Lambda**: Serverless functions that handle API requests
3. **AWS DynamoDB**: NoSQL database to store analytics data
4. **AWS CloudWatch**: Monitoring and logging
5. **AWS EventBridge**: Scheduled events for data syncing

## Step 1: Set Up DynamoDB Tables

Create the following tables:

### Sales Table
```bash
aws dynamodb create-table \
    --table-name ShopifySales \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=date,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
        AttributeName=date,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### Products Table
```bash
aws dynamodb create-table \
    --table-name ShopifyProducts \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### Orders Table
```bash
aws dynamodb create-table \
    --table-name ShopifyOrders \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=date,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
        AttributeName=date,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### Customers Table
```bash
aws dynamodb create-table \
    --table-name ShopifyCustomers \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

## Step 2: Create Lambda Functions

1. Create a new directory for your Lambda functions:

```bash
mkdir -p lambda-functions/shopify-api
cd lambda-functions/shopify-api
npm init -y
npm install aws-sdk axios shopify-api-node
```

2. Create Lambda functions for each data endpoint:
   - `fetchSalesSummary.js`
   - `fetchOrdersSummary.js`
   - `fetchCustomersSummary.js`
   - `fetchInventoryStatus.js`
   - `syncShopifyData.js` (scheduled job)

## Step 3: Set Up Serverless Configuration

Create a `serverless.yml` file:

```yaml
service: shopify-analytics-dashboard

provider:
  name: aws
  runtime: nodejs16.x
  stage: ${opt:stage, 'dev'}
  region: ${opt:region, 'us-east-1'}
  environment:
    SHOPIFY_API_KEY: ${env:SHOPIFY_API_KEY}
    SHOPIFY_API_SECRET: ${env:SHOPIFY_API_SECRET}
    SHOPIFY_STORE_URL: ${env:SHOPIFY_STORE_URL}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:Query
        - dynamodb:Scan
        - dynamodb:GetItem
        - dynamodb:PutItem
        - dynamodb:UpdateItem
        - dynamodb:DeleteItem
        - dynamodb:BatchWriteItem
      Resource:
        - "arn:aws:dynamodb:${self:provider.region}:*:table/Shopify*"

functions:
  fetchSalesSummary:
    handler: handlers/fetchSalesSummary.handler
    events:
      - http:
          path: api/sales/summary
          method: get
          cors: true
          
  fetchOrdersSummary:
    handler: handlers/fetchOrdersSummary.handler
    events:
      - http:
          path: api/orders/summary
          method: get
          cors: true
          
  fetchCustomersSummary:
    handler: handlers/fetchCustomersSummary.handler
    events:
      - http:
          path: api/customers/summary
          method: get
          cors: true
          
  fetchInventoryStatus:
    handler: handlers/fetchInventoryStatus.handler
    events:
      - http:
          path: api/inventory/status
          method: get
          cors: true
          
  syncShopifyData:
    handler: handlers/syncShopifyData.handler
    events:
      - schedule: rate(30 minutes)

resources:
  Resources:
    # DynamoDB Tables defined here
```

## Step 4: Implement Lambda Functions

### Example: fetchSalesSummary.js

```javascript
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const timeframe = event.queryStringParameters?.timeframe || 'week';
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    const params = {
      TableName: 'ShopifySales',
      FilterExpression: '#date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date',
      },
      ExpressionAttributeValues: {
        ':startDate': startDate.toISOString().split('T')[0],
        ':endDate': endDate.toISOString().split('T')[0],
      },
    };
    
    const result = await dynamoDB.scan(params).promise();
    
    // Calculate summary data
    const totalSales = result.Items.reduce((sum, item) => sum + item.amount, 0);
    
    // For percentage change, we need to compare with previous period
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    
    switch (timeframe) {
      case 'day':
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;
      case 'week':
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate.setDate(previousEndDate.getDate() - 7);
        break;
      case 'month':
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        previousEndDate.setMonth(previousEndDate.getMonth() - 1);
        break;
      case 'year':
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
        break;
    }
    
    const previousParams = {
      TableName: 'ShopifySales',
      FilterExpression: '#date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date',
      },
      ExpressionAttributeValues: {
        ':startDate': previousStartDate.toISOString().split('T')[0],
        ':endDate': previousEndDate.toISOString().split('T')[0],
      },
    };
    
    const previousResult = await dynamoDB.scan(previousParams).promise();
    const previousTotalSales = previousResult.Items.reduce((sum, item) => sum + item.amount, 0);
    
    const percentageChange = previousTotalSales > 0
      ? ((totalSales - previousTotalSales) / previousTotalSales) * 100
      : 0;
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        totalSales,
        percentageChange,
        currency: 'USD',
        timeframe,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

## Step 5: Create a Data Sync Lambda Function

Create a Lambda function that syncs data from Shopify to DynamoDB regularly:

```javascript
const AWS = require('aws-sdk');
const Shopify = require('shopify-api-node');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Initialize Shopify API client
const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORE_URL,
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_API_SECRET,
});

exports.handler = async (event) => {
  try {
    // Sync orders
    const orders = await shopify.order.list({ limit: 250, status: 'any' });
    
    // Process and store orders in DynamoDB
    const orderPromises = orders.map(order => {
      const orderItem = {
        id: order.id.toString(),
        date: new Date(order.created_at).toISOString().split('T')[0],
        customer: order.customer ? {
          id: order.customer.id,
          name: `${order.customer.first_name} ${order.customer.last_name}`,
          email: order.customer.email,
        } : null,
        total: order.total_price,
        subtotal: order.subtotal_price,
        tax: order.total_tax,
        currency: order.currency,
        status: order.financial_status,
        fulfillmentStatus: order.fulfillment_status || 'unfulfilled',
        items: order.line_items.length,
      };
      
      const params = {
        TableName: 'ShopifyOrders',
        Item: orderItem,
      };
      
      return dynamoDB.put(params).promise();
    });
    
    await Promise.all(orderPromises);
    
    // Sync products
    const products = await shopify.product.list({ limit: 250 });
    
    // Process and store products in DynamoDB
    const productPromises = products.map(product => {
      const productItem = {
        id: product.id.toString(),
        title: product.title,
        description: product.body_html,
        type: product.product_type,
        vendor: product.vendor,
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        variants: product.variants.map(variant => ({
          id: variant.id.toString(),
          title: variant.title,
          price: variant.price,
          sku: variant.sku,
          inventory: variant.inventory_quantity,
        })),
      };
      
      const params = {
        TableName: 'ShopifyProducts',
        Item: productItem,
      };
      
      return dynamoDB.put(params).promise();
    });
    
    await Promise.all(productPromises);
    
    // Sync customers
    const customers = await shopify.customer.list({ limit: 250 });
    
    // Process and store customers in DynamoDB
    const customerPromises = customers.map(customer => {
      const customerItem = {
        id: customer.id.toString(),
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        ordersCount: customer.orders_count,
        totalSpent: customer.total_spent,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
      };
      
      const params = {
        TableName: 'ShopifyCustomers',
        Item: customerItem,
      };
      
      return dynamoDB.put(params).promise();
    });
    
    await Promise.all(customerPromises);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data sync completed successfully' }),
    };
  } catch (error) {
    console.error('Error syncing data:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

## Step 6: Deploy the Serverless Application

```bash
serverless deploy
```

## Step 7: Set Up CORS for API Gateway

In the AWS Console:
1. Go to API Gateway
2. Select your API
3. Under "Resources", select "Actions" and then "Enable CORS"
4. Enter `*` for "Access-Control-Allow-Origin" or your specific domain
5. Click "Enable CORS and replace existing CORS headers"
6. Click "Yes, replace existing values"

## Step 8: Update Frontend with API Endpoint

After deployment, update the `.env` file in your frontend application with the API endpoint URL:

```
REACT_APP_API_ENDPOINT=https://your-api-id.execute-api.your-region.amazonaws.com/dev
```

## Maintenance and Troubleshooting

### Monitoring

Use AWS CloudWatch to monitor:
- Lambda execution errors
- API Gateway requests
- DynamoDB read/write capacity

### Logs

Lambda logs can be viewed in CloudWatch Logs:
1. Go to CloudWatch in the AWS Console
2. Select "Log groups"
3. Find the log group for your Lambda function (/aws/lambda/your-function-name)

### Scaling

If your application's traffic increases:
1. Increase DynamoDB provisioned throughput or switch to on-demand capacity
2. Adjust Lambda memory allocation for better performance
3. Consider implementing API Gateway caching for frequently accessed endpoints

### Security

1. Use AWS IAM roles with least privilege
2. Store sensitive information (Shopify API keys) in AWS Secrets Manager
3. Implement API Gateway request validation
4. Consider adding authentication to your API endpoints 