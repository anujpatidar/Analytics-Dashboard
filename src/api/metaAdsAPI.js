import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/meta-ads`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Meta Ads API Error:', error);
    throw error;
  }
);

/**
 * Get Meta Ads account summary
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
    throw new Error(error.response?.data?.message || 'Failed to fetch Meta Ads summary');
  }
};

/**
 * Get Meta Ads campaign insights
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
    throw new Error(error.response?.data?.message || 'Failed to fetch Meta Ads campaigns');
  }
};

/**
 * Export Meta Ads data to CSV
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
    throw new Error(error.response?.data?.message || 'Failed to export Meta Ads data');
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
  exportToCsv,
  getDateRanges,
}; 