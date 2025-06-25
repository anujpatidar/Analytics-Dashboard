import React, { useState, useEffect } from 'react';
import { FiShoppingCart, FiTrendingUp, FiTrendingDown, FiDollarSign, FiPackage, FiPercent, FiBarChart3, FiTarget } from 'react-icons/fi';
import { FaRupeeSign, FaChartLine, FaCalculator } from 'react-icons/fa';
import StatCard from '../Dashboard/StatCard';
import ChartCard from '../Dashboard/ChartCard';
import DataTable from '../Dashboard/DataTable';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  getAmazonOrdersOverview, 
  getAmazonOrdersByTimeRange, 
  getAmazonTopSellingProducts,
  getAmazonReturnsOverview 
} from '../../api/amazonAPI';

const AmazonAnalytics = ({ dateRange, store, onError }) => {
  const [amazonData, setAmazonData] = useState(null);
  const [amazonReturns, setAmazonReturns] = useState(null);
  const [amazonTimeRange, setAmazonTimeRange] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAmazonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = dateRange;
      
      // Fetch all Amazon data in parallel
      const [overviewResponse, returnsResponse, timeRangeResponse, topProductsResponse] = await Promise.all([
        getAmazonOrdersOverview(startDate, endDate, store),
        getAmazonReturnsOverview(startDate, endDate, store),
        getAmazonOrdersByTimeRange(startDate, endDate, 'day', store),
        getAmazonTopSellingProducts(startDate, endDate, store)
      ]);

      setAmazonData(overviewResponse.data);
      setAmazonReturns(returnsResponse.data);
      setAmazonTimeRange(timeRangeResponse.data);
      setTopProducts(topProductsResponse.data);

    } catch (err) {
      setError(err.message);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmazonData();
  }, [dateRange, store]);

  // Helper function to format values safely
  const formatMetricValue = (value, formatter = formatCurrency, fallback = 'N/A') => {
    if (value === null || value === undefined || isNaN(value)) return fallback;
    return formatter(value);
  };

  const formatPercentage = (value, fallback = 'N/A') => {
    if (value === null || value === undefined || isNaN(value)) return fallback;
    return `${Number(value).toFixed(2)}%`;
  };

  // Orders Metrics
  const orderStats = [
    {
      title: 'Total Orders',
      value: formatMetricValue(amazonData?.total_orders, formatNumber),
      icon: FiShoppingCart,
      color: '#3b82f6',
      tooltip: 'Total number of orders placed on Amazon'
    },
    {
      title: 'Average Order Value',
      value: formatMetricValue(amazonData?.average_order_value),
      icon: FaRupeeSign,
      color: '#f59e0b',
      tooltip: 'Average value per order on Amazon'
    }
  ];

  // Sales Matrices
  const salesMetrics = [
    {
      title: 'Total Sales',
      value: formatMetricValue(amazonData?.total_sales),
      icon: FaRupeeSign,
      color: '#0073b6',
      tooltip: 'Total sales revenue on Amazon (after discounts)'
    },
    {
      title: 'Gross Sales',
      value: formatMetricValue(amazonData?.gross_sales),
      icon: FaRupeeSign,
      color: '#00a651',
      tooltip: 'Total sales revenue before discounts'
    },
    {
      title: 'Net Sales',
      value: formatMetricValue(amazonData?.net_sales),
      icon: FaRupeeSign,
      color: '#ff8c00',
      tooltip: 'Sales after Amazon fees and commissions'
    },
    {
      title: 'Gross Sales %',
      value: formatPercentage(amazonData?.gross_sales_percentage || (amazonData?.gross_sales && amazonData?.total_sales ? (amazonData.gross_sales / amazonData.total_sales) * 100 : null)),
      icon: FiPercent,
      color: '#9333ea',
      tooltip: 'Gross sales as percentage of total sales'
    },
    {
      title: 'Net Sales %',
      value: formatPercentage(amazonData?.net_sales_percentage || (amazonData?.net_sales && amazonData?.total_sales ? (amazonData.net_sales / amazonData.total_sales) * 100 : null)),
      icon: FiPercent,
      color: '#dc2626',
      tooltip: 'Net sales as percentage of total sales'
    }
  ];

  // Returns
  const returnsMetrics = [
    {
      title: 'Total Returns',
      value: formatMetricValue(amazonReturns?.total_return_amount || amazonData?.total_returns),
      icon: FiTrendingDown,
      color: '#dc2626',
      tooltip: 'Total value of returned items'
    },
    {
      title: 'Return Rate %',
      value: formatPercentage(amazonReturns?.return_rate_percentage || amazonData?.return_rate),
      icon: FiPercent,
      color: '#ef4444',
      tooltip: 'Return rate as percentage of total orders'
    }
  ];

  // Tax
  const taxMetrics = [
    {
      title: 'Total Tax',
      value: formatMetricValue(amazonData?.total_tax),
      icon: FaCalculator,
      color: '#059669',
      tooltip: 'Total tax collected'
    },
    {
      title: 'Tax Rate %',
      value: formatPercentage(amazonData?.tax_rate ? amazonData.tax_rate * 100 : null),
      icon: FiPercent,
      color: '#10b981',
      tooltip: 'Tax as percentage of total sales'
    }
  ];

  // Expenses
  const expenseMetrics = [
    {
      title: 'COGS',
      value: formatMetricValue(amazonData?.cogs),
      icon: FaRupeeSign,
      color: '#f59e0b',
      tooltip: 'Cost of Goods Sold'
    },
    {
      title: 'COGS %',
      value: formatPercentage(amazonData?.cogs_percentage),
      icon: FiPercent,
      color: '#d97706',
      tooltip: 'COGS as percentage of total sales'
    },
    {
      title: 'S&D Cost',
      value: formatMetricValue(amazonData?.sd_cost || amazonData?.total_shipping),
      icon: FaRupeeSign,
      color: '#f97316',
      tooltip: 'Shipping and Delivery Costs'
    },
    {
      title: 'S&D Cost %',
      value: formatPercentage(amazonData?.sd_cost_percentage || (amazonData?.sd_cost && amazonData?.total_sales ? (amazonData.sd_cost / amazonData.total_sales) * 100 : null)),
      icon: FiPercent,
      color: '#ea580c',
      tooltip: 'Shipping and Delivery Costs as percentage of total sales'
    }
  ];

  // Marketing (For Amazon these might be N/A since we don't have marketing data from Amazon directly)
  const marketingMetrics = [
    {
      title: 'Total Marketing Cost',
      value: 'N/A',
      icon: FaRupeeSign,
      color: '#8b5cf6',
      tooltip: 'Amazon marketing data not available'
    },
    {
      title: 'Marketing Cost %',
      value: 'N/A',
      icon: FiPercent,
      color: '#7c3aed',
      tooltip: 'Amazon marketing data not available'
    }
  ];

  // ROAS (These will be N/A since we need marketing data)
  const roasMetrics = [
    {
      title: 'Gross ROAS',
      value: 'N/A',
      icon: FaChartLine,
      color: '#10b981',
      tooltip: 'Gross Return on Ad Spend - Marketing data required'
    },
    {
      title: 'Gross MER %',
      value: 'N/A',
      icon: FiPercent,
      color: '#059669',
      tooltip: 'Gross Marketing Efficiency Ratio - Marketing data required'
    },
    {
      title: 'Net ROAS',
      value: 'N/A',
      icon: FaChartLine,
      color: '#3b82f6',
      tooltip: 'Net Return on Ad Spend - Marketing data required'
    },
    {
      title: 'Net MER %',
      value: 'N/A',
      icon: FiPercent,
      color: '#2563eb',
      tooltip: 'Net Marketing Efficiency Ratio - Marketing data required'
    },
    {
      title: 'N-ROAS',
      value: 'N/A',
      icon: FaChartLine,
      color: '#8b5cf6',
      tooltip: 'Net-Net Return on Ad Spend - Marketing data required'
    },
    {
      title: 'N-MER %',
      value: 'N/A',
      icon: FiPercent,
      color: '#7c3aed',
      tooltip: 'Net-Net Marketing Efficiency Ratio - Marketing data required'
    }
  ];

  // CAC (These will be N/A since we need marketing data)
  const cacMetrics = [
    {
      title: 'CAC',
      value: 'N/A',
      icon: FiTarget,
      color: '#ef4444',
      tooltip: 'Customer Acquisition Cost - Marketing data required'
    },
    {
      title: 'N-CAC',
      value: 'N/A',
      icon: FiTarget,
      color: '#dc2626',
      tooltip: 'Net Customer Acquisition Cost - Marketing data required'
    }
  ];

  // Contribution Margin (Can calculate these partially)
  const contributionMarginMetrics = [
    {
      title: 'CM2',
      value: amazonData?.total_sales && amazonData?.cogs 
        ? formatMetricValue(amazonData.total_sales - amazonData.cogs)
        : 'N/A',
      icon: FaCalculator,
      color: '#14b8a6',
      tooltip: 'Contribution Margin 2: Sales - COGS (Marketing data needed for complete calculation)'
    },
    {
      title: 'CM2 %',
      value: amazonData?.total_sales && amazonData?.cogs 
        ? formatPercentage(((amazonData.total_sales - amazonData.cogs) / amazonData.total_sales) * 100)
        : 'N/A',
      icon: FiPercent,
      color: '#0d9488',
      tooltip: 'CM2 as percentage of total sales'
    },
    {
      title: 'CM3',
      value: amazonData?.total_sales && amazonData?.cogs && amazonData?.sd_cost
        ? formatMetricValue(amazonData.total_sales - amazonData.cogs - amazonData.sd_cost)
        : 'N/A',
      icon: FaCalculator,
      color: '#06b6d4',
      tooltip: 'Contribution Margin 3: Sales - COGS - S&D (Marketing data needed for complete calculation)'
    },
    {
      title: 'CM3 %',
      value: amazonData?.total_sales && amazonData?.cogs && amazonData?.sd_cost
        ? formatPercentage(((amazonData.total_sales - amazonData.cogs - amazonData.sd_cost) / amazonData.total_sales) * 100)
        : 'N/A',
      icon: FiPercent,
      color: '#0891b2',
      tooltip: 'CM3 as percentage of total sales'
    }
  ];

  // Marketing Channel Split Table Data (Will show N/A for Amazon)
  const marketingChannelData = [
    { channel: 'Amazon PPC', cost: 'N/A', percentage: 'N/A' },
    { channel: 'Amazon DSP', cost: 'N/A', percentage: 'N/A' },
    { channel: 'Brand Stores', cost: 'N/A', percentage: 'N/A' },
    { channel: 'Sponsored Products', cost: 'N/A', percentage: 'N/A' }
  ];

  const marketingChannelColumns = [
    { key: 'channel', label: 'Channel' },
    { key: 'cost', label: 'Cost (INR)' },
    { key: 'percentage', label: 'Percentage (%)' }
  ];

  // Top Products Table
  const topProductsColumns = [
    { key: 'product_name', label: 'Product' },
    { key: 'total_quantity', label: 'Quantity Sold' },
    { key: 'total_revenue', label: 'Revenue' },
    { key: 'orders_count', label: 'Orders' },
    { key: 'average_price', label: 'Avg Price' }
  ];

  const formatTopProductsData = (products) => {
    if (!products) return [];
    return products.map(product => ({
      ...product,
      total_revenue: formatCurrency(product.total_revenue),
      average_price: formatCurrency(product.average_price),
      total_quantity: formatNumber(product.total_quantity),
      orders_count: formatNumber(product.orders_count)
    }));
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Orders Metrics Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orderStats.map((metric, index) => (
            <StatCard
              key={index}
              {...metric}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* Sales Matrices Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Matrices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {salesMetrics.map((metric, index) => (
            <StatCard
              key={index}
              {...metric}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* Returns Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Returns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {returnsMetrics.map((metric, index) => (
            <StatCard
              key={index}
              {...metric}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* Tax Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {taxMetrics.map((metric, index) => (
            <StatCard
              key={index}
              {...metric}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* Expenses Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {expenseMetrics.map((metric, index) => (
            <StatCard
              key={index}
              {...metric}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* Marketing Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Marketing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {marketingMetrics.map((metric, index) => (
            <StatCard
              key={index}
              {...metric}
              loading={loading}
            />
          ))}
        </div>
        

      </section>

      {/* ROAS Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ROAS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {roasMetrics.map((metric, index) => (
            <StatCard
              key={index}
              {...metric}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* CAC Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">CAC</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cacMetrics.map((metric, index) => (
            <StatCard
              key={index}
              {...metric}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* Contribution Margin Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contribution Margin</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contributionMarginMetrics.map((metric, index) => (
            <StatCard
              key={index}
              {...metric}
              loading={loading}
            />
          ))}
        </div>
      </section>

    </div>
  );
};

export default AmazonAnalytics; 