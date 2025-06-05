import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/google-ads`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Google Ads API Error:', error);
    throw error;
  }
);

/**
 * Get Google Ads account summary
 * @param {Object} params - Query parameters
 * @param {string} params.dateRange - Date range (today, yesterday, last_7_days, last_30_days, this_month)
 * @param {string} params.since - Start date for custom range (YYYY-MM-DD)
 * @param {string} params.until - End date for custom range (YYYY-MM-DD)
 */
export const getSummary = async (params = {}) => {
  try {
    const response = await api.get('/summary', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch Google Ads summary');
  }
};

/**
 * Get Google Ads campaign insights
 * @param {Object} params - Query parameters
 * @param {string} params.dateRange - Date range (today, yesterday, last_7_days, last_30_days, this_month)
 * @param {string} params.since - Start date for custom range (YYYY-MM-DD)
 * @param {string} params.until - End date for custom range (YYYY-MM-DD)
 * @param {Array<string>} params.campaignIds - Optional array of campaign IDs to filter
 */
export const getCampaigns = async (params = {}) => {
  try {
    const response = await api.get('/campaigns', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch Google Ads campaigns');
  }
};

/**
 * Get Google Ads keywords insights
 * @param {Object} params - Query parameters
 * @param {string} params.dateRange - Date range (today, yesterday, last_7_days, last_30_days, this_month)
 * @param {string} params.since - Start date for custom range (YYYY-MM-DD)
 * @param {string} params.until - End date for custom range (YYYY-MM-DD)
 * @param {number} params.limit - Number of keywords to return (default: 50)
 */
export const getKeywords = async (params = {}) => {
  try {
    const response = await api.get('/keywords', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch Google Ads keywords');
  }
};

/**
 * Export Google Ads data to CSV
 * @param {Object} params - Request parameters
 * @param {string} params.dateRange - Date range (today, yesterday, last_7_days, last_30_days, this_month)
 * @param {string} params.since - Start date for custom range (YYYY-MM-DD)
 * @param {string} params.until - End date for custom range (YYYY-MM-DD)
 * @param {Array<string>} params.campaignIds - Optional array of campaign IDs to filter
 * @param {string} params.filename - Optional custom filename
 */
export const exportToCsv = async (params = {}) => {
  try {
    const response = await api.post('/export-csv', params);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to export Google Ads data');
  }
};

/**
 * Get available date range options
 */
export const getDateRanges = async () => {
  try {
    const response = await api.get('/date-ranges');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch date ranges');
  }
};

export default {
  getSummary,
  getCampaigns,
  getKeywords,
  exportToCsv,
  getDateRanges,
}; 