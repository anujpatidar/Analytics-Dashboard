// import axios from 'axios';
import { API_ENDPOINT } from '../config';  // Move to config if needed

// Mock API functions for demonstration
// In a real implementation, this would connect to your AWS API Gateway endpoint
// which would in turn connect to your Lambda functions and DynamoDB

// Use API_ENDPOINT in your API calls or remove if not needed
export const API_BASE_URL = API_ENDPOINT || 'https://api.shopify.com/admin/api/2023-01';

// Helper function to simulate API delay for demo purposes
const mockDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get dashboard summary data
 */
export const getDashboardSummary = async (timeframe = 'week') => {
  try {
    // In a real implementation:
    // const response = await axios.get(`${API_ENDPOINT}/dashboard/summary?timeframe=${timeframe}`);
    // return response.data;
    
    // Mock implementation for demonstration
    await mockDelay();
    return {
      salesSummary: {
        totalSales: 42500,
        percentageChange: 12.5,
        averageOrderValue: 85.50,
        conversionRate: 3.6,
        revenuePerVisitor: 3.2,
      },
      ordersSummary: {
        totalOrders: 498,
        percentageChange: 8.3,
        abandonedCarts: 152,
        abandonmentRate: 23.4,
        returningCustomers: 45.2,
      },
      customersSummary: {
        totalCustomers: 386,
        percentageChange: 15.7,
        newCustomers: 92,
        activeCustomers: 245,
        churnRate: 5.3,
      },
      inventorySummary: {
        totalProducts: 136,
        lowStock: 12,
        outOfStock: 3,
        topSellingProducts: [
          { id: 1, name: 'Premium T-Shirt', sales: 85 },
          { id: 2, name: 'Designer Jeans', sales: 62 },
          { id: 3, name: 'Leather Bag', sales: 38 },
        ]
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};

/**
 * Get sales analytics data
 */
export const getSalesAnalytics = async (timeframe = 'week') => {
  try {
    // In a real implementation:
    // const response = await axios.get(`${API_ENDPOINT}/analytics/sales?timeframe=${timeframe}`);
    // return response.data;
    
    // Mock implementation for demonstration
    await mockDelay();
    
    // Generate different data based on timeframe
    let dataPoints;
    let labels;
    
    switch (timeframe.toLowerCase()) {
      case 'day':
        labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        dataPoints = {
          revenue: Array.from({ length: 24 }, () => Math.floor(Math.random() * 500) + 200),
          orders: Array.from({ length: 24 }, () => Math.floor(Math.random() * 20) + 5),
        };
        break;
      case 'week':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dataPoints = {
          revenue: [3200, 4100, 2900, 5600, 4800, 7100, 6300],
          orders: [38, 45, 32, 55, 48, 72, 63],
        };
        break;
      case 'month':
        labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
        dataPoints = {
          revenue: Array.from({ length: 30 }, () => Math.floor(Math.random() * 2000) + 2000),
          orders: Array.from({ length: 30 }, () => Math.floor(Math.random() * 30) + 20),
        };
        break;
      case 'year':
      default:
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        dataPoints = {
          revenue: [32000, 38000, 42000, 36000, 48000, 53000, 57000, 63000, 59000, 67000, 72000, 78000],
          orders: [320, 380, 420, 360, 480, 530, 570, 630, 590, 670, 720, 780],
        };
    }
    
    return {
      labels,
      datasets: [
        {
          id: 'revenue',
          label: 'Revenue',
          data: dataPoints.revenue,
          color: '#0073B6',
        },
        {
          id: 'orders',
          label: 'Orders',
          data: dataPoints.orders,
          color: '#4CAF50',
        },
      ],
      totalRevenue: dataPoints.revenue.reduce((sum, value) => sum + value, 0),
      totalOrders: dataPoints.orders.reduce((sum, value) => sum + value, 0),
      averageRevenue: Math.round(dataPoints.revenue.reduce((sum, value) => sum + value, 0) / dataPoints.revenue.length),
      averageOrders: Math.round(dataPoints.orders.reduce((sum, value) => sum + value, 0) / dataPoints.orders.length),
    };
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    throw error;
  }
};

/**
 * Get recent orders
 */
export const getRecentOrders = async (page = 1, pageSize = 10) => {
  try {
    // In a real implementation:
    // const response = await axios.get(`${API_ENDPOINT}/orders/recent?page=${page}&pageSize=${pageSize}`);
    // return response.data;
    
    // Mock implementation for demonstration
    await mockDelay();
    
    const orders = Array.from({ length: 50 }, (_, i) => {
      const id = `ORD-${(1000 + i).toString()}`;
      const statuses = ['Completed', 'Processing', 'Shipped', 'Cancelled', 'Refunded'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomDaysAgo = Math.floor(Math.random() * 14) + 1;
      const date = new Date();
      date.setDate(date.getDate() - randomDaysAgo);
      
      return {
        id,
        customer: `Customer ${1000 + i}`,
        date: date.toISOString(),
        total: Math.floor(Math.random() * 200) + 50,
        status: randomStatus,
        items: Math.floor(Math.random() * 5) + 1,
        paymentMethod: Math.random() > 0.5 ? 'Credit Card' : 'PayPal',
      };
    });
    
    // Sort by date (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Paginate
    const start = (page - 1) * pageSize;
    const paginatedOrders = orders.slice(start, start + pageSize);
    
    return {
      orders: paginatedOrders,
      total: orders.length,
      page,
      pageSize,
      totalPages: Math.ceil(orders.length / pageSize),
    };
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw error;
  }
};

/**
 * Get top products
 */
export const getTopProducts = async (limit = 10) => {
  try {
    // In a real implementation:
    // const response = await axios.get(`${API_ENDPOINT}/products/top?limit=${limit}`);
    // return response.data;
    
    // Mock implementation for demonstration
    await mockDelay();
    
    const products = [
      { id: 1, name: 'Premium T-Shirt', price: 29.99, sold: 125, revenue: 3748.75, inStock: 46 },
      { id: 2, name: 'Designer Jeans', price: 89.99, sold: 82, revenue: 7379.18, inStock: 28 },
      { id: 3, name: 'Leather Bag', price: 129.99, sold: 67, revenue: 8709.33, inStock: 15 },
      { id: 4, name: 'Running Shoes', price: 119.99, sold: 94, revenue: 11279.06, inStock: 32 },
      { id: 5, name: 'Smartwatch', price: 199.99, sold: 43, revenue: 8599.57, inStock: 12 },
      { id: 6, name: 'Sunglasses', price: 59.99, sold: 76, revenue: 4559.24, inStock: 24 },
      { id: 7, name: 'Winter Jacket', price: 149.99, sold: 58, revenue: 8699.42, inStock: 19 },
      { id: 8, name: 'Wireless Earbuds', price: 79.99, sold: 112, revenue: 8958.88, inStock: 36 },
      { id: 9, name: 'Yoga Mat', price: 39.99, sold: 87, revenue: 3479.13, inStock: 42 },
      { id: 10, name: 'Water Bottle', price: 24.99, sold: 138, revenue: 3448.62, inStock: 65 },
      { id: 11, name: 'Desk Lamp', price: 49.99, sold: 63, revenue: 3149.37, inStock: 27 },
      { id: 12, name: 'Backpack', price: 69.99, sold: 92, revenue: 6439.08, inStock: 34 },
    ];
    
    // Sort by revenue (highest first)
    products.sort((a, b) => b.revenue - a.revenue);
    
    return products.slice(0, limit);
  } catch (error) {
    console.error('Error fetching top products:', error);
    throw error;
  }
};

/**
 * Get customer insights
 */
export const getCustomerInsights = async () => {
  try {
    // In a real implementation:
    // const response = await axios.get(`${API_ENDPOINT}/customers/insights`);
    // return response.data;
    
    // Mock implementation for demonstration
    await mockDelay();
    
    return {
      demographics: {
        gender: [
          { label: 'Male', value: 42 },
          { label: 'Female', value: 53 },
          { label: 'Other', value: 5 },
        ],
        ageGroups: [
          { label: '18-24', value: 15 },
          { label: '25-34', value: 32 },
          { label: '35-44', value: 28 },
          { label: '45-54', value: 16 },
          { label: '55+', value: 9 },
        ],
        locations: [
          { label: 'United States', value: 63 },
          { label: 'United Kingdom', value: 12 },
          { label: 'Canada', value: 8 },
          { label: 'Australia', value: 7 },
          { label: 'Germany', value: 5 },
          { label: 'Other', value: 5 },
        ],
      },
      acquisition: {
        channels: [
          { label: 'Direct', value: 25 },
          { label: 'Organic Search', value: 18 },
          { label: 'Social Media', value: 22 },
          { label: 'Email', value: 15 },
          { label: 'Referral', value: 12 },
          { label: 'Paid Search', value: 8 },
        ],
        devices: [
          { label: 'Desktop', value: 42 },
          { label: 'Mobile', value: 48 },
          { label: 'Tablet', value: 10 },
        ],
      },
      behavior: {
        purchaseFrequency: [
          { label: 'One-time', value: 62 },
          { label: 'Repeat (2-5)', value: 28 },
          { label: 'Loyal (6+)', value: 10 },
        ],
        averageOrderValue: {
          overall: 85.65,
          bySegment: [
            { label: 'One-time', value: 72.45 },
            { label: 'Repeat', value: 94.32 },
            { label: 'Loyal', value: 118.76 },
          ],
        },
        timeToConversion: {
          average: 2.4, // days
          distribution: [
            { label: 'Same day', value: 45 },
            { label: '1-3 days', value: 32 },
            { label: '4-7 days', value: 15 },
            { label: '8+ days', value: 8 },
          ],
        },
      },
    };
  } catch (error) {
    console.error('Error fetching customer insights:', error);
    throw error;
  }
};

/**
 * Get inventory status
 */
export const getInventoryStatus = async () => {
  try {
    // In a real implementation:
    // const response = await axios.get(`${API_ENDPOINT}/inventory/status`);
    // return response.data;
    
    // Mock implementation for demonstration
    await mockDelay();
    
    return {
      summary: {
        totalProducts: 136,
        inStock: 121,
        lowStock: 12,
        outOfStock: 3,
      },
      categories: [
        { name: 'Clothing', total: 48, inStock: 42, lowStock: 5, outOfStock: 1 },
        { name: 'Accessories', total: 36, inStock: 33, lowStock: 3, outOfStock: 0 },
        { name: 'Footwear', total: 24, inStock: 21, lowStock: 2, outOfStock: 1 },
        { name: 'Electronics', total: 18, inStock: 16, lowStock: 1, outOfStock: 1 },
        { name: 'Home & Living', total: 10, inStock: 9, lowStock: 1, outOfStock: 0 },
      ],
      lowStockItems: [
        { id: 1, name: 'Premium T-Shirt (L)', category: 'Clothing', remaining: 5, threshold: 10 },
        { id: 2, name: 'Designer Jeans (32)', category: 'Clothing', remaining: 4, threshold: 10 },
        { id: 3, name: 'Leather Bag (Brown)', category: 'Accessories', remaining: 3, threshold: 5 },
        { id: 4, name: 'Running Shoes (9)', category: 'Footwear', remaining: 4, threshold: 8 },
        { id: 5, name: 'Smartwatch (Black)', category: 'Electronics', remaining: 2, threshold: 5 }
      ],
      outOfStockItems: [
        { id: 6, name: 'Winter Jacket (XL)', category: 'Clothing', lastInStock: '2023-04-10' },
        { id: 7, name: 'Running Shoes (11)', category: 'Footwear', lastInStock: '2023-04-15' },
        { id: 8, name: 'Wireless Earbuds', category: 'Electronics', lastInStock: '2023-04-18' }
      ]
    };
  } catch (error) {
    console.error('Error fetching inventory status:', error);
    throw error;
  }
}; 