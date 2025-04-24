/**
 * Upload Order Export Files to S3
 * 
 * This script uploads multiple order export CSV files to S3
 * and then triggers the Lambda function to process them.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const AWS = require('aws-sdk');

// Configure AWS from environment
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Initialize AWS clients
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

// Configuration with defaults
const config = {
  // S3 settings
  bucketName: process.env.EXPORT_FILES_BUCKET || 'shopify-order-exports',
  s3Prefix: process.env.EXPORT_FILES_PREFIX || 'order_exports/',
  
  // Local file settings
  localPath: process.env.ORDER_EXPORTS_PATH || './order_exports',
  filePattern: '*.csv',
  
  // Lambda settings
  lambdaFunction: process.env.SYNC_LAMBDA_FUNCTION || 'ShopifySyncFunction',
  triggerLambda: true
};

/**
 * Create an S3 bucket if it doesn't exist
 * @param {string} bucketName - Name of the bucket to create
 * @returns {Promise<boolean>} - Whether the bucket was created or already existed
 */
async function ensureBucketExists(bucketName) {
  try {
    // Check if bucket exists
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`Bucket ${bucketName} already exists.`);
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      // Bucket doesn't exist, create it
      console.log(`Creating bucket ${bucketName}...`);
      try {
        await s3.createBucket({ 
          Bucket: bucketName,
          CreateBucketConfiguration: {
            LocationConstraint: AWS.config.region
          }
        }).promise();
        console.log(`Bucket ${bucketName} created successfully.`);
        return true;
      } catch (createError) {
        console.error(`Failed to create bucket ${bucketName}:`, createError);
        return false;
      }
    } else {
      console.error(`Error checking bucket ${bucketName}:`, error);
      return false;
    }
  }
}

/**
 * Upload a file to S3
 * @param {string} filePath - Local file path
 * @param {string} bucketName - S3 bucket name
 * @param {string} key - S3 key (target path in bucket)
 * @returns {Promise<boolean>} - Whether the upload succeeded
 */
async function uploadFileToS3(filePath, bucketName, key) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: 'text/csv'
    };
    
    await s3.upload(params).promise();
    return true;
  } catch (error) {
    console.error(`Error uploading ${filePath} to S3:`, error);
    return false;
  }
}

/**
 * Trigger Lambda function to process the uploaded files
 * @param {Object} event - Event for Lambda
 * @returns {Promise<Object>} - Lambda response
 */
async function triggerLambda(event) {
  const params = {
    FunctionName: config.lambdaFunction,
    InvocationType: 'Event', // Asynchronous invocation
    Payload: JSON.stringify(event)
  };
  
  try {
    const result = await lambda.invoke(params).promise();
    console.log(`Lambda function ${config.lambdaFunction} triggered successfully:`, result);
    return result;
  } catch (error) {
    console.error(`Error triggering Lambda function ${config.lambdaFunction}:`, error);
    throw error;
  }
}

/**
 * Main function to upload order export files to S3
 */
async function uploadOrderExportFiles() {
  console.log('Starting upload of order export files to S3...');
  console.log('Configuration:', config);
  
  // Make sure the bucket exists
  const bucketExists = await ensureBucketExists(config.bucketName);
  if (!bucketExists) {
    console.error(`Could not ensure bucket ${config.bucketName} exists. Aborting.`);
    return;
  }
  
  // Find all matching files
  const localPath = path.resolve(config.localPath);
  if (!fs.existsSync(localPath)) {
    console.error(`Local path ${localPath} does not exist.`);
    return;
  }
  
  const pattern = path.join(localPath, config.filePattern);
  const files = glob.sync(pattern);
  
  if (files.length === 0) {
    console.error(`No files found matching pattern: ${pattern}`);
    return;
  }
  
  console.log(`Found ${files.length} files to upload.`);
  
  // Upload files to S3
  let uploadedCount = 0;
  const uploadedFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const fileName = path.basename(filePath);
    const key = `${config.s3Prefix}${fileName}`;
    
    console.log(`Uploading file ${i+1}/${files.length}: ${fileName} to s3://${config.bucketName}/${key}`);
    
    const success = await uploadFileToS3(filePath, config.bucketName, key);
    
    if (success) {
      uploadedCount++;
      uploadedFiles.push({ fileName, key });
      console.log(`Successfully uploaded ${fileName}`);
    } else {
      console.error(`Failed to upload ${fileName}`);
    }
  }
  
  console.log(`\nUpload summary:`);
  console.log(`- Total files: ${files.length}`);
  console.log(`- Successfully uploaded: ${uploadedCount}`);
  console.log(`- Failed uploads: ${files.length - uploadedCount}`);
  
  // Trigger Lambda if required
  if (config.triggerLambda && uploadedCount > 0) {
    console.log(`\nTriggering Lambda function ${config.lambdaFunction} to process the uploaded files...`);
    
    try {
      await triggerLambda({
        action: 'export_import',
        source: 'order-export-import',
        bucket: config.bucketName,
        prefix: config.s3Prefix,
        fileCount: uploadedCount,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Lambda function triggered successfully. Check AWS CloudWatch logs for progress.`);
    } catch (error) {
      console.error('Failed to trigger Lambda function:', error);
    }
  }
}

// Run the script if executed directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    
    if (key === '--bucket') config.bucketName = value;
    if (key === '--prefix') config.s3Prefix = value;
    if (key === '--path') config.localPath = value;
    if (key === '--pattern') config.filePattern = value;
    if (key === '--lambda') config.lambdaFunction = value;
    if (key === '--trigger') config.triggerLambda = value.toLowerCase() === 'true';
  });
  
  uploadOrderExportFiles()
    .then(() => {
      console.log('Order export file upload process completed.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error in upload process:', error);
      process.exit(1);
    });
} else {
  // Export for use as module
  module.exports = { uploadOrderExportFiles };
} 