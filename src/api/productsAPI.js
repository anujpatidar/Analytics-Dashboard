import axios from 'axios';
import { getDemoDataForStore, isStoreDemo } from '../services/demoDataService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

export const getAllProductsList = async (params) => {
  try {
    const store = params?.store || 'myfrido';
    
    // Use demo data for non-myfrido stores
    if (isStoreDemo(store)) {
      return getDemoDataForStore(store, 'productsList', params);
    }
    
    const response = await axios.get(`${API_BASE_URL}/products/get-all-products`, {
      params: {
        store: store
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching products list:', error);
    throw error;
  }
};

export const getOverallProductMetrics = async (params) => {
  try {
    const store = params?.store || 'myfrido';
    
    // Use demo data for non-myfrido stores
    if (isStoreDemo(store)) {
      return getDemoDataForStore(store, 'productMetrics', params);
    }
    
    const response = await axios.get(`${API_BASE_URL}/products/get-overall-product-metrics`, {
      params: {
        store: store
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching product metrics:', error);
    throw error;
  }
};

export const getMarketplacePrices = async (params) => {
  try {
    const store = params?.store || 'myfrido';
    
    // Use demo data for non-myfrido stores
    if (isStoreDemo(store)) {
      return getDemoDataForStore(store, 'marketplacePrices', params);
    }
    
    const response = await axios.get(`${API_BASE_URL}/products/get-marketplace-prices`, {
      params: {
        store: store
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching marketplace prices:', error);
    throw error;
  }
};

export const getProductById = async (productId, params) => {
  try {
    const store = params?.store || 'myfrido';
    
    // Use demo data for non-myfrido stores
    if (isStoreDemo(store)) {
      return getDemoDataForStore(store, 'productDetails', { productId, ...params });
    }
    
    const response = await axios.get(`${API_BASE_URL}/products/${productId}`, {
      params: {
        store: store
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
}; 