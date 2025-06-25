const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

export const getAmazonOrdersOverview = async (startDate, endDate, store) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/amazon/overview?startDate=${startDate}&endDate=${endDate}&store=${store || ''}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Amazon orders overview:', error);
    throw error;
  }
};

export const getAmazonOrdersByTimeRange = async (startDate, endDate, timeframe = 'day', store) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/amazon/time-range?startDate=${startDate}&endDate=${endDate}&timeframe=${timeframe}&store=${store || ''}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Amazon orders by time range:', error);
    throw error;
  }
};

export const getAmazonTopSellingProducts = async (startDate, endDate, store) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/amazon/top-selling?startDate=${startDate}&endDate=${endDate}&store=${store || ''}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Amazon top selling products:', error);
    throw error;
  }
};

export const getAmazonReturnsData = async (startDate, endDate, store) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/amazon/returns-data?startDate=${startDate}&endDate=${endDate}&store=${store || ''}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Amazon returns data:', error);
    throw error;
  }
};

export const getAmazonReturnsOverview = async (startDate, endDate, store) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/amazon/returns-overview?startDate=${startDate}&endDate=${endDate}&store=${store || ''}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Amazon returns overview:', error);
    throw error;
  }
};

export const getAmazonProductMetrics = async (sku, startDate, endDate, store) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/amazon/product-metrics/${sku}?startDate=${startDate}&endDate=${endDate}&store=${store || ''}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Amazon product metrics:', error);
    throw error;
  }
}; 