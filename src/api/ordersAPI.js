import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

export const getOrdersOverview = async (params) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/overview`, {
      params: {
        startDate: params?.startDate,
        endDate: params?.endDate
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders overview:', error);
    throw error;
  }
};

export const getOrdersByTimeRange = async (params) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/time-range`, {
      params: { 
        startDate: params.startDate,
        endDate: params.endDate,
        timeframe: params.timeframe
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders by time range:', error);
    throw error;
  }
};

export const getTopSellingProducts = async (params) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/top-selling`, {
      params: { 
        limit: params?.limit || 5,
        startDate: params?.startDate,
        endDate: params?.endDate
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    throw error;
  }
};

export const getRefundMetrics = async (params) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/refund-metrics`, {
      params: {
        startDate: params?.startDate,
        endDate: params?.endDate
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching refund metrics:', error);
    throw error;
  }
};

export const getRecentOrders = async (params) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/recent`, {
      params: { 
        page: params.page, 
        pageSize: params.pageSize,
        startDate: params?.startDate,
        endDate: params?.endDate
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw error;
  }
}; 