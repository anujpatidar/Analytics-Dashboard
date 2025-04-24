# Shopify Data Sync Options

This project provides multiple ways to synchronize data between Shopify and your DynamoDB database. Below are the available options:

## 1. Mock Sync

If you don't have a Shopify store or valid credentials, you can use the mock sync to test the DynamoDB integration with sample data.

```bash
node mockSync.js
```

This will:
- Generate mock orders, products, and customers
- Insert them into your DynamoDB tables
- Update sync metadata
- No actual connection to Shopify is required

## 2. Real Shopify Sync (Local)

To perform a real synchronization with your Shopify store:

1. First, update your `.env` file with valid Shopify credentials:
   ```
   SHOPIFY_STORE_URL=your-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your_admin_api_access_token
   ```

2. Run the sync script:
   ```bash
   node runSync.js
   ```

This will:
- Connect to your Shopify store using the Admin API
- Fetch orders, products, and customers updated since the last sync
- Store them in your DynamoDB tables
- Update sync metadata with timestamps

## 3. Scheduled Sync on AWS (Production)

For production use, deploy the CloudFormation template to set up scheduled synchronization:

```bash
aws cloudformation deploy \
  --template-file cloudformation.yaml \
  --stack-name shopify-analytics-dashboard \
  --parameter-overrides \
    Environment=prod \
    ShopifyAccessToken=your_access_token \
    ShopifyStoreUrl=your-store.myshopify.com \
    DeploymentBucket=your-s3-bucket \
    SyncInterval=15
```

This will:
- Create all necessary AWS resources (Lambda, EventBridge, DynamoDB, IAM)
- Set up automatic scheduled syncs at your specified interval
- Create an API endpoint for manual sync triggers

## 4. Manual Sync via API (Production)

Once deployed to AWS, you can trigger a manual sync:

```bash
curl -X POST https://your-api-gateway-url.execute-api.region.amazonaws.com/prod/sync
```

## Choosing the Right Option

- **Development/Testing**: Use Mock Sync to test your code without connecting to Shopify
- **Local Development**: Use Real Shopify Sync to test with real Shopify data
- **Production**: Use the AWS CloudFormation deployment with scheduled syncs
- **On-Demand Updates**: Use the manual sync API endpoint when you need immediate updates

## Monitoring Sync Status

You can check the sync status in the `ShopifySyncMetadata-{env}` DynamoDB table:
- `syncId: 'latest'` - Overall status of the most recent sync
- `syncId: '{resource}_last_sync'` - Timestamp of the last successful sync for each resource 