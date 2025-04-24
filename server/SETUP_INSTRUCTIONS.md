# Shopify Analytics Dashboard - Setup Instructions

## 1. Create a Shopify Custom App

To synchronize data from Shopify to your analytics dashboard, you need to create a custom app in your Shopify store:

1. Log in to your Shopify Admin dashboard
2. Go to **Apps** > **App and sales channel settings** > **Develop apps** (or **Create an app**)
3. Click **Create an app**
4. Enter a name for your app (e.g., "Analytics Dashboard")
5. Select **Custom app** as the app type
6. Click **Create app**

## 2. Configure App Scopes

After creating the app, you need to set up the appropriate permissions:

1. Go to the **API credentials** tab
2. Click **Configure Admin API scopes**
3. Select the following scopes:
   - `read_orders`
   - `read_products`
   - `read_customers`
   - `read_inventory`
   - `read_fulfillments`
4. Click **Save**

## 3. Get Access Token

1. In the **API credentials** tab, click **Install app** to install it to your store
2. After installation, you'll see the Admin API access token
3. Copy this token to your `.env` file:
   ```
   SHOPIFY_STORE_URL=your-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your_admin_api_access_token
   ```

## 4. AWS Configuration

Make sure your AWS credentials are properly configured:

1. Verify that you have valid AWS credentials in your `.env` file
2. Ensure the IAM user has permissions to access DynamoDB
3. Check that the DynamoDB tables exist with the correct names

## 5. Run Sync Process

After configuring credentials, you can run the sync process:

1. Run the sync script locally:
   ```
   node runSync.js
   ```

2. Or deploy the CloudFormation stack to AWS:
   ```
   aws cloudformation deploy --template-file cloudformation.yaml --stack-name shopify-analytics-dashboard --parameter-overrides Environment=dev ShopifyAccessToken=your_access_token ShopifyStoreUrl=your-store.myshopify.com DeploymentBucket=your-s3-bucket
   ```

## 6. Verify Data Sync

After running the sync, check that data has been properly synchronized:

1. Use the AWS Console to navigate to DynamoDB
2. Check the tables to verify that orders, products, and customers have been added
3. Verify the sync metadata table has updated with success status

## Troubleshooting

If you encounter a 401 Unauthorized error:
- Double-check that your access token is correct
- Verify that your app is still installed in your store
- Ensure your Shopify store URL is correct
- Check that your access token has the required scopes

If you have AWS credential issues:
- Confirm that your AWS credentials are valid
- Check that the IAM user has the necessary permissions
- Verify the region is set correctly 