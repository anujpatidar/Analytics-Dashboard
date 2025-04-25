
const logger = require('../utils/logger');

const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
// Configure AWS SDK
// Initialize DynamoDB client with detailed logging
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  //enable for logs down below
  // logger: console 
});

const docClient = DynamoDBDocumentClient.from(client);


const productsController = {

  getAllProductsList: async (req, res, next) => {
    try {
      console.log(`Attempting to scan table: ${req.params.tableName}`);
      const command = new ScanCommand({
        TableName: "ShopifyProducts-dev",
      });
      const response = await docClient.send(command);
      res.status(200).json({ success: true, data: response.Items });
    } catch (error) {
      next(error);
    }
  },

  getProductById: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const command = new GetCommand({
        TableName: "ShopifyProducts-dev",
        Key: { id: productId }
      });
      const response = await docClient.send(command);
      res.status(200).json({ success: true, data: response.Item });
    } catch (error) {
      next(error);
    }
  }

  

};

module.exports = productsController; 