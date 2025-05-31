const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');
const logger = require('./logger');

// Initialize BigQuery client
const bigquery = new BigQuery({
  keyFilename: path.join(__dirname, '../service-account.json'),
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'analytics-dashboard-459607'
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
        // Handle ISO string dates
        acc[key] = { value: value, type: 'TIMESTAMP' };
      } else {
        acc[key] = { value: value, type: 'STRING' };
      }
      return acc;
    }, {});

    const options = {
      query,
      params: formattedParams,
      location: process.env.BIGQUERY_LOCATION || 'US'
    };

    logger.info('Executing BigQuery query:', { query, params: formattedParams });
    const [rows] = await bigquery.query(options);
    logger.info('BigQuery query executed successfully');
    return rows;
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
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'analytics-dashboard-459607';
  const dataset = process.env.BIGQUERY_DATASET || 'analytics-dashboard-459607';
  const table = process.env.BIGQUERY_TABLE;
  
  
  return `${dataset}.${table}`;
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