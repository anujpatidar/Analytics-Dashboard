const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');
const logger = require('./logger');

// Initialize BigQuery client with new project configuration
const bigquery = new BigQuery({
  keyFilename: path.join(__dirname, '../service-account.json'),
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'frido-429506'
});

/**
 * Execute a BigQuery query with parameters
 * @param {string} query - The SQL query to execute
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
const executeQuery = async (query, params = {}) => {
  try {
    // Convert parameters to BigQuery types
    const formattedParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value instanceof Date) {
        acc[key] = { value: value.toISOString(), type: 'TIMESTAMP' };
      } else if (typeof value === 'number') {
        acc[key] = { value: value, type: 'INT64' };
      } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        acc[key] = { value: value, type: 'TIMESTAMP' };
      } else {
        acc[key] = { value: value, type: 'STRING' };
      }
      return acc;
    }, {});

    const options = {
      query,
      params: formattedParams,
      location: process.env.BIGQUERY_LOCATION || 'US',
      // Add these options to prevent Big objects
      wrapIntegers: false,
      parseJSON: true
    };

    logger.info('Executing BigQuery query:', { query, params: formattedParams });
    const [rows] = await bigquery.query(options);
    
    // Convert any remaining Big objects and numbers to strings
    const formattedRows = rows.map(row => {
      const formattedRow = {};
      for (const [key, value] of Object.entries(row)) {
        if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Big') {
          formattedRow[key] = value.toString();
        } else if (typeof value === 'number') {
          formattedRow[key] = value.toString();
        } else {
          formattedRow[key] = value;
        }
      }
      return formattedRow;
    });
    
    logger.info('BigQuery query executed successfully');
    return formattedRows;
  } catch (error) {
    logger.error('BigQuery query execution error:', error);
    throw error;
  }
};

/**
 * Get the full dataset path including project ID
 * @returns {string} - Full dataset path (project.dataset.table)
 */
const getDatasetName = () => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'frido-429506';
  const dataset = process.env.BIGQUERY_DATASET || 'frido_analytics';
  const table = process.env.BIGQUERY_TABLE || 'Frido_Shopify_orders';
  
  return `${projectId}.${dataset}.${table}`;
};

/**
 * Format a date for BigQuery
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDateForBigQuery = (date) => {
  return date.toISOString().split('T')[0];
};

module.exports = {
  executeQuery,
  getDatasetName,
  formatDateForBigQuery
}; 