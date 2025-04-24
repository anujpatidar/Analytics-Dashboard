# Shopify Analytics Dashboard - Server

This directory contains the server-side code for the Shopify Analytics Dashboard, including API endpoints and data synchronization scripts.

## CSV Import/Export for Initial Data Load

For stores with a large amount of historical data, the standard synchronization process can take a long time. To speed up the initial data loading process, you can use the CSV export and import tools.

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in a `.env` file:
```
AWS_REGION=us-east-1
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
ORDERS_TABLE=ShopifyOrders
PRODUCTS_TABLE=ShopifyProducts
CUSTOMERS_TABLE=ShopifyCustomers
SYNC_METADATA_TABLE=ShopifySyncMetadata
```

### Step 1: Export Data from Shopify to CSV

Run the export script to download all your Shopify data to CSV files:

```bash
npm run export-csv
```

This will create CSV files in the `./data` directory:
- `orders.csv`: All orders from your Shopify store
- `products.csv`: All products from your Shopify store
- `customers.csv`: All customers from your Shopify store

#### Options

You can customize the export with command-line options:

```bash
node shopifyCsvExport.js --output-dir=./my-exports --skip-customers
```

Available options:
- `--output-dir=PATH`: Specify output directory (default: `./data`)
- `--orders-file=FILENAME`: Specify orders filename (default: `orders.csv`)
- `--products-file=FILENAME`: Specify products filename (default: `products.csv`)
- `--customers-file=FILENAME`: Specify customers filename (default: `customers.csv`)
- `--skip-orders`: Skip exporting orders
- `--skip-products`: Skip exporting products
- `--skip-customers`: Skip exporting customers

### Step 2: Import CSV Data to DynamoDB

After exporting, import the data into DynamoDB:

```bash
npm run import-csv
```

This reads the CSV files from the `./data` directory and uploads them to your DynamoDB tables.

#### Options

You can customize the import with command-line options:

```bash
node shopifyCsvImport.js --data-dir=./my-exports --skip-customers
```

Available options:
- `--data-dir=PATH`: Specify input directory (default: `./data`)
- `--orders=FILENAME`: Specify orders filename (default: `orders.csv`)
- `--products=FILENAME`: Specify products filename (default: `products.csv`)
- `--customers=FILENAME`: Specify customers filename (default: `customers.csv`)
- `--skip-orders`: Skip importing orders
- `--skip-products`: Skip importing products
- `--skip-customers`: Skip importing customers

### One-Step Export and Import

To run both export and import in sequence:

```bash
npm run export-import
```

### After Initial Import

After the initial data import, you can switch to the regular sync process for ongoing updates:

```bash
npm run sync
```

## Data Formats

### Orders CSV Format

The orders CSV contains these columns:
- `id`: Order ID
- `name`: Order name (e.g., "#1001")
- `email`: Customer email
- `financial_status`: Payment status
- `fulfillment_status`: Shipping status
- `created_at`: Creation date
- `updated_at`: Last update date
- `processed_at`: Processing date
- `currency`: Currency code
- `total_price`: Total price
- `subtotal_price`: Subtotal price
- `total_tax`: Total tax
- `taxes_included`: Whether taxes are included
- `customer_id`: Customer ID
- `customer_name`: Customer name
- `customer_email`: Customer email
- `shipping_address`: Shipping address (JSON)
- `billing_address`: Billing address (JSON)
- `line_items`: Line items (JSON array)
- `discount_codes`: Discount codes (JSON array)
- `note`: Order note
- `tags`: Order tags
- `cancelled_at`: Cancellation date

### Products CSV Format

The products CSV contains these columns:
- `id`: Product ID
- `title`: Product title
- `handle`: Product handle (URL slug)
- `body_html`: Description HTML
- `vendor`: Vendor name
- `product_type`: Product type
- `created_at`: Creation date
- `updated_at`: Last update date
- `published_at`: Publishing date
- `status`: Status (active/draft)
- `tags`: Product tags
- `variants`: Variants (JSON array)
- `options`: Options (JSON array)
- `images`: Images (JSON array)

### Customers CSV Format

The customers CSV contains these columns:
- `id`: Customer ID
- `email`: Email address
- `first_name`: First name
- `last_name`: Last name
- `orders_count`: Number of orders
- `total_spent`: Total amount spent
- `currency`: Currency code
- `state`: Customer state
- `verified_email`: Whether email is verified
- `tax_exempt`: Whether customer is tax exempt
- `phone`: Phone number
- `created_at`: Creation date
- `updated_at`: Last update date
- `addresses`: Addresses (JSON array)
- `tags`: Customer tags
- `note`: Customer note
- `accepts_marketing`: Marketing opt-in status
- `last_order_id`: Last order ID
- `last_order_date`: Last order date 