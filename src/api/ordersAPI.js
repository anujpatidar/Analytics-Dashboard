import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

export const getOrdersOverview = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/overview`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders overview:', error);
    throw error;
  }
};

export const getOrdersByTimeRange = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/time-range`, {
      params: { 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders by time range:', error);
    throw error;
  }
};

export const getTopSellingProducts = async (limit = 5) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/top-selling`, {
      params: { limit }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    throw error;
  }
};

export const getRefundMetrics = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/refund-metrics`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching refund metrics:', error);
    throw error;
  }
}; 