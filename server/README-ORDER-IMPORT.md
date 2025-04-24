# Shopify Order Export Import

This document provides instructions on how to import Shopify order export files into DynamoDB for the Analytics Dashboard.

## Prerequisites

- Node.js (v12 or later)
- AWS credentials configured (either through environment variables or AWS CLI)
- DynamoDB tables created (through CloudFormation template)
- Shopify order export CSV files

## Setup

1. Create a directory for your order export files:
   ```bash
   mkdir -p order_exports
   ```

2. Place your order export CSV files in the `order_exports` directory.

3. Make sure the AWS credentials are available in your environment:
   ```bash
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   export AWS_REGION="your-region"  # e.g., us-east-1
   ```

4. Install required dependencies:
   ```bash
   npm install dotenv aws-sdk csv-parser glob
   ```

## Import Methods

There are two methods to import the order export files:

### Method 1: Direct Import (Recommended for Local Development)

Use the `processOrderFiles.js` script to directly import the files from your local machine to DynamoDB:

```bash
./import-orders.sh
```

You can customize the import with options:
```bash
./import-orders.sh --path=./my_orders --pattern=order_export_*.csv --batch-size=10
```

Available options:
- `--path=DIRECTORY`: Path to the directory containing order export files (default: ./order_exports)
- `--pattern=PATTERN`: File pattern to match (default: *.csv)
- `--batch-size=SIZE`: Number of items to process in each batch (default: 25)
- `--retries=NUM`: Maximum number of retries for failed operations (default: 5)
- `--log=true|false`: Enable/disable detailed progress logging (default: true)

### Method 2: S3 + Lambda Import (Recommended for Production)

For production environments, you can upload the files to S3 and trigger a Lambda function to process them:

1. Configure your S3 bucket in the `.env` file:
   ```
   EXPORT_FILES_BUCKET=your-s3-bucket-name
   EXPORT_FILES_PREFIX=order_exports/
   SYNC_LAMBDA_FUNCTION=ShopifySyncFunction
   ```

2. Use the `uploadOrderExports.js` script to upload your files and trigger the Lambda:
   ```bash
   node uploadOrderExports.js
   ```

   You can customize the S3 upload with command-line options:
   ```bash
   node uploadOrderExports.js --bucket=my-bucket --prefix=exports/ --path=./my_orders --pattern=*.csv
   ```

## Tracking Import Progress

The import process logs progress information to:

1. Console output with detailed logs
2. DynamoDB's `ShopifySyncMetadata` table with the following entries:
   - `syncId`: Unique ID for the import process (with format `local_import_[timestamp]`)
   - `status`: Current status (started, in_progress, completed, failed)
   - `filesProcessed`: Number of files processed
   - `ordersImported`: Number of orders successfully imported
   - `errors`: Number of errors encountered

You can check the latest import status in the DynamoDB table or in the Lambda logs if using the S3 method.

## Error Handling

The import process is designed to be robust:

- Each file is processed independently, so errors in one file won't affect others
- Failed imports are logged but don't stop the entire process
- DynamoDB write operations include automatic retries with exponential backoff
- The import can be resumed if interrupted by running the script again

## Troubleshooting

- **AWS Credential Issues**: Ensure your IAM user has permissions for DynamoDB:PutItem, DynamoDB:BatchWriteItem
- **Rate Limiting**: If you encounter many throughput errors, try reducing the batch size
- **File Format Issues**: Ensure your CSV files are properly formatted Shopify exports
- **CSV Parsing Errors**: Check the console logs for details on problematic rows

## Lambda Function

If using the Lambda function for imports, you can invoke it directly with an event:

```json
{
  "action": "export_import",
  "source": "order-export-import",
  "bucket": "your-s3-bucket",
  "prefix": "order_exports/",
  "timestamp": "2023-09-30T00:00:00.000Z"
}
```

This will process all CSV files in the specified S3 bucket and prefix. 