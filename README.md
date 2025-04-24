# Shopify Analytics Dashboard

A real-time analytics dashboard for e-commerce businesses, currently integrated with Shopify and designed for future expansion to other platforms like Amazon, Flipkart, Zepto, and Blinkit.

## Features

- **Real-time Data**: Updates every 30 minutes to provide fresh insights into your business performance
- **Comprehensive Analytics**: Track sales, revenue, customer behavior, product performance, and more
- **Beautiful Visualizations**: Interactive charts and graphs for better data interpretation
- **Responsive Design**: Looks great on desktop, tablet, and mobile devices
- **Expandable Architecture**: Built to integrate with multiple e-commerce platforms in the future

## Technology Stack

- **Frontend**: React.js with styled-components for styling
- **Backend**: AWS Lambda functions serving as API endpoints
- **Database**: AWS DynamoDB for storing and retrieving analytics data
- **Authentication**: Secure user authentication system
- **Real-time Updates**: Automated data fetching from Shopify API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- AWS account for backend deployment
- Shopify store with API access

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/analytics-dashboard.git
   ```

2. Install dependencies
   ```
   cd analytics-dashboard
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_API_ENDPOINT=your_aws_api_endpoint
   REACT_APP_SHOPIFY_STORE_URL=your_shopify_store_url
   REACT_APP_AWS_REGION=us-east-1
   REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_id
   REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_access_key
   REACT_APP_DYNAMODB_ORDERS_TABLE=your_orders_table_name
   REACT_APP_DYNAMODB_PRODUCTS_TABLE=your_products_table_name
   REACT_APP_DYNAMODB_CUSTOMERS_TABLE=your_customers_table_name
   REACT_APP_DYNAMODB_SYNC_METADATA_TABLE=your_sync_metadata_table_name
   ```

4. Start the development server
   ```
   npm start
   ```

## Deployment

The application can be deployed on AWS Amplify or any static hosting service for the frontend. The backend is handled by AWS services including Lambda, API Gateway, and DynamoDB.

## Future Enhancements

- Integration with Amazon, Flipkart, Zepto, and Blinkit
- Advanced forecasting using machine learning
- Inventory management features
- Email reports and alerts
- Custom dashboard layouts

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Setting up AWS Credentials for Direct DynamoDB Access

The application now supports direct access to DynamoDB from the frontend for improved performance. To use this feature:

1. Create a `.env` file in the root of the project if it doesn't already exist
2. Add the following AWS credentials to your `.env` file:
   ```
   REACT_APP_AWS_REGION=us-east-1
   REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_id
   REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_access_key
   ```
3. Replace the values with your actual AWS credentials
4. Make sure the IAM user has the necessary permissions to access the DynamoDB tables

**Important Security Note**: For production environments, consider using Amazon Cognito Identity Pools to provide temporary, limited-privilege credentials to the frontend instead of embedding AWS access keys directly.

## Configuration of DynamoDB Tables

The application uses the following DynamoDB table names by default:
- `shopify-orders` - Stores order data
- `shopify-products` - Stores product data
- `shopify-customers` - Stores customer data
- `shopify-sync-metadata` - Stores metadata about syncs

You can customize these table names by adding the following to your `.env` file:
```
REACT_APP_DYNAMODB_ORDERS_TABLE=your_orders_table_name
REACT_APP_DYNAMODB_PRODUCTS_TABLE=your_products_table_name
REACT_APP_DYNAMODB_CUSTOMERS_TABLE=your_customers_table_name
REACT_APP_DYNAMODB_SYNC_METADATA_TABLE=your_sync_metadata_table_name
```
