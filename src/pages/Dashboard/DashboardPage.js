import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FiShoppingCart, 
  FiTrendingUp, 
  FiUsers, 
  FiDollarSign, 
  FiTarget, 
  FiRefreshCw,
  FiFilter
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import StatCard from '../../components/Dashboard/StatCard';
import StoreIndicator from '../../components/Dashboard/StoreIndicator';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  FiPackage,
  FiBarChart2,
  FiDownload
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import { format, startOfDay, endOfDay } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import "react-datepicker/dist/react-datepicker.css";

import { ChartCard, DataTable } from '../../components/Dashboard';
import MetaAdsDashboardWidget from '../../components/MetaAds/MetaAdsDashboardWidget';
import GoogleAdsDashboardWidget from '../../components/GoogleAds/GoogleAdsDashboardWidget';
import CombinedMarketingWidget from '../../components/Marketing/CombinedMarketingWidget';
import useDataFetching from '../../hooks/useDataFetching';
import { useStore } from '../../context/StoreContext';
import {
  getOrdersOverview,
  getOrdersByTimeRange,
  getTopSellingProducts,
  getRefundMetrics,
  getRecentOrders
} from '../../api/ordersAPI';
import { formatDate } from '../../utils/formatters';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MetricSection = styled.div`
  background: white;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--border-color);
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
`;

const formatMetricValue = (value, formatter = formatCurrency) => {
  if (value === undefined || value === null) return 'NA';
  return formatter(value);
};

const formatPercentage = (value) => {
  if (value === undefined || value === null) return 'NA';
  if (typeof value === 'number') {
    return `${value.toFixed(2)}%`;
  }
  return `${value}%`;
};

// Add styled components for tabs
const TabContainer = styled.div`
  background: white;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);
  margin-bottom: var(--spacing-xl);
  overflow: hidden;
`;

const TabHeader = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border-color);
  background: #f8f9fa;
`;

const TabButton = styled.button`
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  background: ${props => props.active ? 'white' : 'transparent'};
  color: ${props => props.active ? '#3b82f6' : 'var(--text-secondary)'};
  border: none;
  font-weight: ${props => props.active ? '600' : '500'};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-bottom: ${props => props.active ? '3px solid #3b82f6' : '3px solid transparent'};
  
  &:hover {
    background: ${props => props.active ? 'white' : '#f0f2f5'};
    color: #3b82f6;
  }
  
  &:not(:last-child) {
    border-right: 1px solid var(--border-color);
  }
  
  .tab-badge {
    background: ${props => props.active ? '#3b82f6' : '#6b7280'};
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    margin-left: 0.5rem;
    font-weight: 500;
  }
`;

const TabContent = styled.div`
  padding: var(--spacing-lg);
  min-height: 60px;
  
  .tab-info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: var(--spacing-md);
    border-radius: 8px;
    margin-bottom: var(--spacing-lg);
    
    .tab-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .tab-description {
      font-size: 0.9rem;
      opacity: 0.9;
      line-height: 1.4;
    }
  }
`;

const DashboardPage = () => {
  const { currentStore } = useStore();
  const timeZone = 'Asia/Kolkata';
  
  // Helper function to convert to IST
  const toIST = (date) => {
    return toZonedTime(date, timeZone);
  };

  // Helper function to convert from IST to UTC
  const toUTC = (date) => {
    return new Date(formatInTimeZone(date, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
  };

  // Initialize dates in IST
  const getInitialDates = () => {
    const now = toIST(new Date());
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return {
      start: startOfDay(weekAgo),
      end: endOfDay(now)
    };
  };

  const [timeframe, setTimeframe] = useState('week');
  const [currentPage, setCurrentPage] = useState(1);
  const initialDates = getInitialDates();
  const [dateRange, setDateRange] = useState([initialDates.start, initialDates.end]);
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const pageSize = 10;
  
  // Add marketplace tab state
  const [activeTab, setActiveTab] = useState('myfrido');

  // Tab configuration
  const tabs = [
    { 
      id: 'overall', 
      label: 'Overall', 
      icon: '🌐',
      description: 'Aggregate data from all marketplaces and sales channels combined'
    },
    
    { 
      id: 'myfrido', 
      label: 'Myfrido', 
      icon: '🏪',
      description: 'Performance data specifically from your website/direct sales'
    },
    { 
      id: 'amazon', 
      label: 'Amazon', 
      icon: '📦',
      description: 'Sales and performance metrics from Amazon marketplace'
    }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Here you would typically refetch data for the specific marketplace
    console.log(`Switched to tab: ${tabId}`);
  };
  
  // Calculate date range based on timeframe
  const getDateRange = (timeframe) => {
    if (isCustomDateRange && dateRange[0] && dateRange[1]) {
      return {
        startDate: toUTC(startOfDay(dateRange[0])).toISOString(),
        endDate: toUTC(endOfDay(dateRange[1])).toISOString(),
        store: currentStore.id
      };
    }

    const end = endOfDay(toIST(new Date()));
    let start = startOfDay(toIST(new Date()));
    
    switch(timeframe.toLowerCase()) {
      case 'day':
        start.setDate(end.getDate() - 1);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setDate(end.getDate() - 30);
        break;
      case 'year':
        start.setDate(end.getDate() - 365);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    return {
      startDate: toUTC(start).toISOString(),
      endDate: toUTC(end).toISOString(),
      store: currentStore.id
    };
  };

  // Get current date range for API calls
  const getCurrentDateRange = () => {
    return getDateRange(isCustomDateRange ? 'custom' : timeframe);
  };
  
  // Fetch orders overview data with date range
  const {
    data: ordersOverview,
    loading: ordersOverviewLoading,
    refetch: refetchOrdersOverview
  } = useDataFetching(getOrdersOverview, [], getCurrentDateRange());

  // Fetch refund metrics with date range
  const {
    data: refundMetrics,
    loading: refundMetricsLoading,
    refetch: refetchRefundMetrics
  } = useDataFetching(getRefundMetrics, [], getCurrentDateRange());

  // Fetch top selling products with date range
  const {
    data: topProducts,
    loading: topProductsLoading,
    refetch: refetchTopProducts
  } = useDataFetching(getTopSellingProducts, [], getCurrentDateRange());

  // Fetch orders by time range
  const {
    data: ordersByTimeRange,
    loading: ordersByTimeRangeLoading,
    refetch: refetchOrdersByTimeRange
  } = useDataFetching(getOrdersByTimeRange, [], {
    startDate: getCurrentDateRange().startDate,
    endDate: getCurrentDateRange().endDate,
    timeframe,
    store: currentStore.id
  });

  // Fetch recent orders with date range
  const {
    data: recentOrdersData,
    loading: recentOrdersLoading,
    refetch: refetchRecentOrders
  } = useDataFetching(getRecentOrders, [], {
    page: currentPage,
    pageSize,
    ...getCurrentDateRange()
  });

  // Refetch data when store changes
  useEffect(() => {
    console.log('ov',ordersOverview);
    const dateRangeWithStore = getCurrentDateRange();
    refetchAllData(dateRangeWithStore);
  }, [currentStore.id]);

  // Function to refetch all data
  const refetchAllData = (dateRange) => {
    const params = { ...dateRange, store: currentStore.id };
    refetchOrdersOverview(params);
    refetchRefundMetrics(params);
    refetchTopProducts(params);
    refetchOrdersByTimeRange({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      timeframe: isCustomDateRange ? 'custom' : timeframe,
      store: currentStore.id
    });
    refetchRecentOrders({
      page: currentPage,
      pageSize,
      ...params
    });
  };

  // Handler for custom date range change
  const handleDateRangeChange = (update) => {
    setDateRange(update);
    if (update[0] && update[1]) {
      setIsCustomDateRange(true);
      const dateRange = {
        startDate: toUTC(startOfDay(update[0])).toISOString(),
        endDate: toUTC(endOfDay(update[1])).toISOString(),
        store: currentStore.id
      };
      refetchAllData(dateRange);
    }
  };

  // Handler for timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    const newTimeframeLower = newTimeframe.toLowerCase();
    setTimeframe(newTimeframeLower);
    setIsCustomDateRange(false);
    const dateRange = getDateRange(newTimeframeLower);
    refetchAllData(dateRange);
  };

  // Aggregate data based on timeframe
  const aggregateData = (data, timeframe) => {
    if (!data) return [];
    
    const groupedData = data.reduce((acc, item) => {
      const date = new Date(item.date);
      let key;
      
      switch(timeframe.toLowerCase()) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!acc[key]) {
        acc[key] = {
          date: key,
          daily_revenue: 0,
          order_count: 0
        };
      }
      
      acc[key].daily_revenue += item.daily_revenue;
      acc[key].order_count += item.order_count;
      
      return acc;
    }, {});
    
    return Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Prepare the sales chart data
  const salesChartData = {
    labels: ordersByTimeRange?.map(item => formatDate(item.date, timeframe)) || [],
    datasets: [
      {
        label: 'Revenue',
        data: ordersByTimeRange?.map(item => item.daily_revenue) || [],
        borderColor: 'rgba(0, 115, 182, 1)',
        backgroundColor: 'rgba(0, 115, 182, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }
    ]
  };
  
  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Revenue: ${formatCurrency(context.raw)}`,
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => formatCurrency(value),
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };
  
  // Prepare the orders chart data
  const ordersChartData = {
    labels: ordersByTimeRange?.map(item => formatDate(item.date, timeframe)) || [],
    datasets: [
      {
        label: 'Orders',
        data: ordersByTimeRange?.map(item => item.order_count) || [],
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          
          if (!chartArea) {
            return 'rgba(59, 130, 246, 0.8)';
          }
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.8)');
          return gradient;
        },
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 40,
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
        hoverBorderColor: 'rgba(59, 130, 246, 1)',
        hoverBorderWidth: 3,
      }
    ]
  };
  
  const ordersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => `${context[0].label}`,
          label: (context) => `Orders: ${formatNumber(context.raw)}`,
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
          font: {
            size: 12,
          },
          padding: 8,
          callback: (value) => formatNumber(value),
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
          font: {
            size: 12,
          },
          padding: 8,
          maxRotation: 45,
        }
      }
    },
    elements: {
      bar: {
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0,
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    }
  };
  
  // Prepare the customer acquisition chart data
  const customerAcquisitionData = {
    labels: ['Direct', 'Search', 'Social', 'Email', 'Referral', 'Other'],
    datasets: [
      {
        data: [35, 25, 20, 10, 8, 2],
        backgroundColor: [
          'rgba(0, 115, 182, 0.8)',
          'rgba(3, 169, 244, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(244, 67, 54, 0.8)',
          'rgba(156, 39, 176, 0.8)',
        ],
        borderWidth: 0,
      }
    ]
  };
  
  const customerAcquisitionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      }
    }
  };
  
  // Prepare the recent orders columns
  const ordersColumns = [
    {
      key: 'id',
      title: 'Order ID',
      sortable: true,
    },
    {
      key: 'customer',
      title: 'Customer',
      sortable: true,
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (row) => formatDate(row.date, 'medium'),
    },
    {
      key: 'total',
      title: 'Total',
      sortable: true,
      render: (row) => formatCurrency(row.total),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (row) => {
        const getStatusColor = (status) => {
          switch (status?.toLowerCase()) {
            case 'paid': return 'success';
            case 'pending': return 'primary';
            case 'partially_paid': return 'secondary';
            case 'cancelled': return 'danger';
            case 'refunded': return 'warning';
            default: return 'grey';
          }
        };
        
        return (
          <StatusBadge color={getStatusColor(row.status)}>
            {row.status}
          </StatusBadge>
        );
      },
    },
  ];
  
  // Prepare the orders overview stats with date range
  const orderStats = [
    {
      title: 'Total Orders',
      value: formatNumber(ordersOverview?.overview?.totalOrders || 0),
      icon: FiShoppingCart,
      change: ordersOverview?.orders_change_percentage ? `${ordersOverview.orders_change_percentage}%` : '0%',
      changeType: ordersOverview?.orders_change_percentage > 0 ? 'increase' : 'decrease',
      color: '#3b82f6',
      tooltip: 'Total number of orders placed'
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(ordersOverview?.overview?.aov || 0),
      icon: FaRupeeSign,
      change: ordersOverview?.aov_change_percentage ? `${ordersOverview.aov_change_percentage}%` : '0%',
      changeType: ordersOverview?.aov_change_percentage > 0 ? 'increase' : 'decrease',
      color: '#f59e0b',
      tooltip: 'Average value per order'
    }
  ];

  // Add after the existing orderStats array
  const salesMetrics = [
    {
      title: 'Total Sales',
      value: formatMetricValue(ordersOverview?.overview?.totalSales),
      icon: FaRupeeSign,
      change: ordersOverview?.revenue_change_percentage ? `${ordersOverview.revenue_change_percentage}%` : 'NA',
      changeType: ordersOverview?.revenue_change_percentage > 0 ? 'increase' : 'decrease',
      color: '#10b981',
      tooltip: 'Actual amount that user paid'
    },
    {
      title: 'Gross Sales',
      value: formatMetricValue(ordersOverview?.overview?.grossSales),
      icon: FaRupeeSign,
      change: ordersOverview?.gross_sales_change_percentage ? `${ordersOverview.gross_sales_change_percentage}%` : 'NA',
      changeType: ordersOverview?.gross_sales_change_percentage > 0 ? 'increase' : 'decrease',
      color: '#059669',
      tooltip: 'Raw product value before anything is subtracted'
    },
    {
      title: 'Net Sales',
      value: formatMetricValue(ordersOverview?.overview?.netSales),
      icon: FaRupeeSign,
      change: ordersOverview?.net_sales_change_percentage ? `${ordersOverview.net_sales_change_percentage}%` : 'NA',
      changeType: ordersOverview?.net_sales_change_percentage > 0 ? 'increase' : 'decrease',
      color: '#047857',
      tooltip: 'Sales after deductions(refunds)'
    },
    {
      title: 'Gross Sales %',
      value: formatPercentage(ordersOverview?.overview?.grossSalesPercentage),
      icon: FiTrendingUp,
      change: ordersOverview?.gross_sales_percentage_change ? `${ordersOverview.gross_sales_percentage_change}%` : 'NA',
      changeType: ordersOverview?.gross_sales_percentage_change > 0 ? 'increase' : 'decrease',
      color: '#0d9488',
      tooltip: 'Gross sales as percentage of total sales'
    },
    {
      title: 'Net Sales %',
      value: formatPercentage(ordersOverview?.overview?.netSalesPercentage),
      icon: FiTrendingUp,
      change: ordersOverview?.net_sales_percentage_change ? `${ordersOverview.net_sales_percentage_change}%` : 'NA',
      changeType: ordersOverview?.net_sales_percentage_change > 0 ? 'increase' : 'decrease',
      color: '#0d9488',
      tooltip: 'Net sales as percentage of total sales'
    }
  ];

  const returnMetrics = [
    {
      title: 'Total Returns',
      value: formatMetricValue(ordersOverview?.overview?.totalReturns),
      icon: FiRefreshCw,
      change: ordersOverview?.returns_change_percentage ? `${ordersOverview.returns_change_percentage}%` : 'NA',
      changeType: ordersOverview?.returns_change_percentage < 0 ? 'decrease' : 'increase',
      color: '#ef4444',
      tooltip: 'Total value of returned products'
    },
    {
      title: 'Return Rate',
      value: formatPercentage(ordersOverview?.overview?.returnRate),
      icon: FiRefreshCw,
      change: ordersOverview?.return_rate_change ? `${ordersOverview.return_rate_change}%` : 'NA',
      changeType: ordersOverview?.return_rate_change < 0 ? 'decrease' : 'increase',
      color: '#dc2626',
      tooltip: 'Percentage of total sales that were returned'
    }
  ];

  const taxMetrics = [
    {
      title: 'Total Tax',
      value: formatMetricValue(ordersOverview?.overview?.totalTax),
      icon: FaRupeeSign,
      change: ordersOverview?.tax_change_percentage ? `${ordersOverview.tax_change_percentage}%` : 'NA',
      changeType: ordersOverview?.tax_change_percentage > 0 ? 'increase' : 'decrease',
      color: '#6366f1',
      tooltip: 'Total tax collected on sales'
    },
    {
      title: 'Tax Rate',
      value: formatPercentage(ordersOverview?.overview?.taxRate),
      icon: FaRupeeSign,
      change: ordersOverview?.tax_rate_change ? `${ordersOverview.tax_rate_change}%` : 'NA',
      changeType: ordersOverview?.tax_rate_change > 0 ? 'increase' : 'decrease',
      color: '#4f46e5',
      tooltip: 'Tax as percentage of total sales'
    }
  ];

  const expenseMetrics = [
    {
      title: 'COGS',
      value: formatMetricValue(ordersOverview?.overview?.cogs),
      icon: FaRupeeSign,
      change: ordersOverview?.cogs_change_percentage ? `${ordersOverview.cogs_change_percentage}%` : 'NA',
      changeType: ordersOverview?.cogs_change_percentage < 0 ? 'decrease' : 'increase',
      color: '#f59e0b',
      tooltip: 'Cost of Goods Sold'
    },
    {
      title: 'COGS %',
      value: formatPercentage(ordersOverview?.overview?.cogsPercentage),
      icon: FaRupeeSign,
      change: ordersOverview?.cogs_percentage_change ? `${ordersOverview.cogs_percentage_change}%` : 'NA',
      changeType: ordersOverview?.cogs_percentage_change < 0 ? 'decrease' : 'increase',
      color: '#d97706',
      tooltip: 'Cost of Goods Sold as percentage of total sales'
    },
    {
      title: 'S&D Cost',
      value: formatMetricValue(ordersOverview?.overview?.sdCost),
      icon: FaRupeeSign,
      change: ordersOverview?.sd_cost_change_percentage ? `${ordersOverview.sd_cost_change_percentage}%` : 'NA',
      changeType: ordersOverview?.sd_cost_change_percentage < 0 ? 'decrease' : 'increase',
      color: '#f97316',
      tooltip: 'Shipping and Delivery Costs'
    },
    {
      title: 'S&D Cost %',
      value: formatPercentage(ordersOverview?.overview?.sdCostPercentage),
      icon: FaRupeeSign,
      change: ordersOverview?.sd_cost_percentage_change ? `${ordersOverview.sd_cost_percentage_change}%` : 'NA',
      changeType: ordersOverview?.sd_cost_percentage_change < 0 ? 'decrease' : 'increase',
      color: '#ea580c',
      tooltip: 'Shipping and Delivery Costs as percentage of total sales'
    }
  ];

  // Add state for marketing data
  const [marketingData, setMarketingData] = useState(null);

  // Update marketingMetrics to use marketingData
  const marketingMetrics = [
    {
      title: 'Total Marketing Cost',
      value: formatMetricValue(ordersOverview?.marketing?.totalSpend || 0),
      icon: FaRupeeSign,
      change: ordersOverview?.marketing_cost_change_percentage ? `${ordersOverview.marketing_cost_change_percentage}%` : 'NA',
      changeType: ordersOverview?.marketing_cost_change_percentage < 0 ? 'decrease' : 'increase',
      color: '#8b5cf6',
      tooltip: 'Total marketing expenditure across all channels'
    },
    {
      title: 'Marketing Cost %',
      value: formatPercentage(((ordersOverview?.marketing?.totalSpend / ordersOverview?.overview?.totalSales) * 100).toFixed(2)), //fixed to 2 decimal places
      icon: FaRupeeSign,
      change: ordersOverview?.marketing_cost_percentage_change ? `${ordersOverview.marketing_cost_percentage_change}%` : 'NA',
      changeType: ordersOverview?.marketing_cost_percentage_change < 0 ? 'decrease' : 'increase',
      color: '#7c3aed',
      tooltip: 'Marketing costs as percentage of total sales'
    }
  ];

  const roasMetrics = [
    {
      title: 'Gross ROAS',
      value: ordersOverview?.overview?.grossRoas.toFixed(2),
      icon: FiTrendingUp,
      change: ordersOverview?.gross_roas_change ? `${ordersOverview.gross_roas_change}%` : 'NA',
      changeType: ordersOverview?.gross_roas_change > 0 ? 'increase' : 'decrease',
      color: '#06b6d4',
      tooltip: 'Return on Ad Spend (Gross)'
    },
    {
      title: 'Gross MER',
      value: formatPercentage(ordersOverview?.overview?.grossMer),
      icon: FiTrendingUp,
      change: ordersOverview?.gross_mer_change ? `${ordersOverview.gross_mer_change}%` : 'NA',
      changeType: ordersOverview?.gross_mer_change > 0 ? 'increase' : 'decrease',
      color: '#0891b2',
      tooltip: 'Marketing Efficiency Ratio (Gross)'
    },
    {
      title: 'Net ROAS',
      value: ordersOverview?.overview?.netRoas.toFixed(2),
      icon: FiTrendingUp,
      change: ordersOverview?.net_roas_change ? `${ordersOverview.net_roas_change}%` : 'NA',
      changeType: ordersOverview?.net_roas_change > 0 ? 'increase' : 'decrease',
      color: '#0e7490',
      tooltip: 'Return on Ad Spend (Net)'
    },
    {
      title: 'Net MER',
      value: formatPercentage(ordersOverview?.overview?.netMer),
      icon: FiTrendingUp,
      change: ordersOverview?.net_mer_change ? `${ordersOverview.net_mer_change}%` : 'NA',
      changeType: ordersOverview?.net_mer_change > 0 ? 'increase' : 'decrease',
      color: '#155e75',
      tooltip: 'Marketing Efficiency Ratio (Net)'
    },
    {
      title: 'N-ROAS',
      value: ordersOverview?.overview?.nRoas.toFixed(2),
      icon: FiTrendingUp,
      change: ordersOverview?.n_roas_change ? `${ordersOverview.n_roas_change}%` : 'NA',
      changeType: ordersOverview?.n_roas_change > 0 ? 'increase' : 'decrease',
      color: '#164e63',
      tooltip: 'Net Return on Ad Spend'
    },
    {
      title: 'N-MER',
      value: formatPercentage(ordersOverview?.overview?.nMer),
      icon: FiTrendingUp,
      change: ordersOverview?.n_mer_change ? `${ordersOverview.n_mer_change}%` : 'NA',
      changeType: ordersOverview?.n_mer_change > 0 ? 'increase' : 'decrease',
      color: '#134e4a',
      tooltip: 'Net Marketing Efficiency Ratio'
    }
  ];

  const cacMetrics = [
    {
      title: 'CAC',
      value: formatMetricValue(ordersOverview?.cac),
      icon: FaRupeeSign,
      change: ordersOverview?.cac_change ? `${ordersOverview.cac_change}%` : 'NA',
      changeType: ordersOverview?.cac_change < 0 ? 'decrease' : 'increase',
      color: '#ec4899',
      tooltip: 'Customer Acquisition Cost'
    },
    {
      title: 'N-CAC',
      value: formatMetricValue(ordersOverview?.n_cac),
      icon: FaRupeeSign,
      change: ordersOverview?.n_cac_change ? `${ordersOverview.n_cac_change}%` : 'NA',
      changeType: ordersOverview?.n_cac_change < 0 ? 'decrease' : 'increase',
      color: '#db2777',
      tooltip: 'Net Customer Acquisition Cost'
    }
  ];

  const contributionMarginMetrics = [
    {
      title: 'CM2',
      value: formatMetricValue(ordersOverview?.overview?.cm2),
      icon: FaRupeeSign,
      change: ordersOverview?.cm2_change ? `${ordersOverview.cm2_change}%` : 'NA',
      changeType: ordersOverview?.cm2_change > 0 ? 'increase' : 'decrease',
      color: '#14b8a6',
      tooltip: 'Contribution Margin Level 2'
    },
    {
      title: 'CM2 %',
      value: formatPercentage(ordersOverview?.overview?.cm2Percentage),
      icon: FaRupeeSign,
      change: ordersOverview?.cm2_percentage_change ? `${ordersOverview.cm2_percentage_change}%` : 'NA',
      changeType: ordersOverview?.cm2_percentage_change > 0 ? 'increase' : 'decrease',
      color: '#0d9488',
      tooltip: 'Contribution Margin Level 2 as percentage'
    },
    {
      title: 'CM3',
      value: formatMetricValue(ordersOverview?.overview?.cm3),
      icon: FaRupeeSign,
      change: ordersOverview?.cm3_change ? `${ordersOverview.cm3_change}%` : 'NA',
      changeType: ordersOverview?.cm3_change > 0 ? 'increase' : 'decrease',
      color: '#0f766e',
      tooltip: 'Contribution Margin Level 3'
    },
    {
      title: 'CM3 %',
      value: formatPercentage(ordersOverview?.overview?.cm3Percentage),
      icon: FaRupeeSign,
      change: ordersOverview?.cm3_percentage_change ? `${ordersOverview.cm3_percentage_change}%` : 'NA',
      changeType: ordersOverview?.cm3_percentage_change > 0 ? 'increase' : 'decrease',
      color: '#115e59',
      tooltip: 'Contribution Margin Level 3 as percentage'
    }
  ];

  // Add after the orderStats array and before the salesMetrics array
  // Prepare the orders over time chart data
  const ordersOverTimeData = {
    labels: ordersByTimeRange?.map(item => formatDate(item.date, timeframe)) || [],
    datasets: [
      {
        label: 'Orders',
        data: ordersByTimeRange?.map(item => item.order_count) || [],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointHoverBorderColor: 'rgba(255, 255, 255, 1)',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Refunds',
        data: ordersByTimeRange?.map(item => item.refund_count) || [],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointHoverBorderColor: 'rgba(255, 255, 255, 1)',
        pointHoverBorderWidth: 3,
      }
    ]
  };

  // Prepare the top products table columns
  const topProductsColumns = [
    {
      key: 'product_name',
      title: 'Product',
      sortable: true,
    },
    {
      key: 'total_quantity',
      title: 'Quantity Sold',
      sortable: true,
      render: (row) => formatNumber(row.total_quantity),
    },
    {
      key: 'total_revenue',
      title: 'Revenue',
      sortable: true,
      render: (row) => formatCurrency(row.total_revenue),
    },
    {
      key: 'number_of_variants',
      title: 'Variants',
      sortable: true,
      render: (row) => formatNumber(row.number_of_variants),
    }
  ];

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Store Indicator */}
       
        
        {/* Header */}
        <div className="">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
         
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => refetchAllData(getCurrentDateRange())}
                disabled={ordersOverviewLoading || refundMetricsLoading}
                className="flex items-center px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${(ordersOverviewLoading || refundMetricsLoading) ? 'animate-spin' : ''}`} />
                
              </button>
              <button
                onClick={() => {/* Add export functionality */}}
                disabled={ordersOverviewLoading}
                className="flex items-center px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FiDownload className="w-4 h-4" />
                
              </button>
            </div>
          </div>

          {/* Date Range Controls */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiBarChart2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Select Date Range</label>
                  <p className="text-xs text-gray-500">Choose a custom date range for analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <DatePicker
                  selected={dateRange[0]}
                  onChange={handleDateRangeChange}
                  startDate={dateRange[0]}
                  endDate={dateRange[1]}
                  selectsRange
                  dateFormat="MMM dd, yyyy"
                  showTimeSelect={false}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm min-w-[250px]"
                  placeholderText="Select date range"
                  maxDate={new Date()}
                  calendarClassName="custom-datepicker"
                  
                />
                {isCustomDateRange && (
                  <button
                    onClick={() => {
                      setIsCustomDateRange(false);
                      setTimeframe('week');
                      const dateRange = getDateRange('week');
                      refetchAllData(dateRange);
                    }}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
                  >
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Marketplace Tabs */}
        <TabContainer>
          <TabHeader>
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
              >
                <span>{tab.icon}</span> {tab.label}
                {activeTab === tab.id && <span className="tab-badge">Active</span>}
              </TabButton>
            ))}
          </TabHeader>
          
          <TabContent>
            {tabs.map((tab) => (
              activeTab === tab.id && (
                <div key={tab.id}>
                  <div className="tab-info">
                    <div className="tab-title">
                      <span>{tab.icon}</span>
                      {tab.label} Analytics
                    </div>
                    <div className="tab-description">
                      {tab.description}
                    </div>
                  </div>
                  
                  {/* Show Myfrido content */}
                  {activeTab === 'myfrido' && (
                    <div className="myfrido-content">
                      {/* Orders Metrics Section */}
                      <MetricSection>
                        <SectionTitle>Orders Metrics</SectionTitle>
                        <MetricGrid>
                          {orderStats.map((metric, index) => (
                            <StatCard
                              key={index}
                              {...metric}
                              loading={ordersOverviewLoading}
                            />
                          ))}
                        </MetricGrid>
                      </MetricSection>

                      {/* Sales Metrics Section */}
                      <MetricSection>
                        <SectionTitle>Sales Metrics</SectionTitle>
                        <MetricGrid>
                          {salesMetrics.map((metric, index) => (
                            <StatCard
                              key={index}
                              {...metric}
                              loading={ordersOverviewLoading}
                            />
                          ))}
                        </MetricGrid>
                      </MetricSection>

                      {/* Returns Section */}
                      <MetricSection>
                        <SectionTitle>Returns</SectionTitle>
                        <MetricGrid>
                          {returnMetrics.map((metric, index) => (
                            <StatCard
                              key={index}
                              {...metric}
                              loading={ordersOverviewLoading}
                            />
                          ))}
                        </MetricGrid>
                      </MetricSection>

                      {/* Tax Section */}
                      <MetricSection>
                        <SectionTitle>Tax</SectionTitle>
                        <MetricGrid>
                          {taxMetrics.map((metric, index) => (
                            <StatCard
                              key={index}
                              {...metric}
                              loading={ordersOverviewLoading}
                            />
                          ))}
                        </MetricGrid>
                      </MetricSection>

                      {/* Expenses Section */}
                      <MetricSection>
                        <SectionTitle>Expenses</SectionTitle>
                        <MetricGrid>
                          {expenseMetrics.map((metric, index) => (
                            <StatCard
                              key={index}
                              {...metric}
                              loading={ordersOverviewLoading}
                            />
                          ))}
                        </MetricGrid>
                      </MetricSection>

                      {/* Marketing Section */}
                      <MetricSection>
                        <SectionTitle>Marketing</SectionTitle>
                        <MetricGrid>
                          {marketingMetrics.map((metric, index) => (
                            <StatCard
                              key={index}
                              {...metric}
                              loading={ordersOverviewLoading}
                            />
                          ))}
                        </MetricGrid>
                      </MetricSection>

                      {/* ROAS Section */}
                      <MetricSection>
                        <SectionTitle>ROAS</SectionTitle>
                        <MetricGrid>
                          {roasMetrics.map((metric, index) => (
                            <StatCard
                              key={index}
                              {...metric}
                              loading={ordersOverviewLoading}
                            />
                          ))}
                        </MetricGrid>
                      </MetricSection>

                      {/* CAC Section */}
                      <MetricSection>
                        <SectionTitle>CAC</SectionTitle>
                        <MetricGrid>
                          {cacMetrics.map((metric, index) => (
                            <StatCard
                              key={index}
                              {...metric}
                              loading={ordersOverviewLoading}
                            />
                          ))}
                        </MetricGrid>
                      </MetricSection>

                      {/* Contribution Margin Section */}
                      <MetricSection>
                        <SectionTitle>Contribution Margin</SectionTitle>
                        <MetricGrid>
                          {contributionMarginMetrics.map((metric, index) => (
                            <StatCard
                              key={index}
                              {...metric}
                              loading={ordersOverviewLoading}
                            />
                          ))}
                        </MetricGrid>
                      </MetricSection>

                      
                     
                    </div>
                  )}
                  
                  {/* Show placeholder for non-Myfrido tabs */}
                  {activeTab !== 'myfrido' && (
                    <div style={{ 
                      padding: '3rem 2rem', 
                      background: '#f8f9fa', 
                      borderRadius: '12px', 
                      textAlign: 'center',
                      border: '2px dashed #dee2e6',
                      marginBottom: '2rem'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{tab.icon}</div>
                      <h3 style={{ color: '#6c757d', marginBottom: '1rem', fontSize: '1.5rem' }}>
                        {tab.label} Analytics Coming Soon
                      </h3>
                      <p style={{ color: '#6c757d', fontSize: '1.1rem', margin: '0 0 1rem 0', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                        We're working on bringing you comprehensive {tab.label.toLowerCase()} analytics. This section will include marketplace-specific metrics, performance data, and insights.
                      </p>
                      <div style={{ 
                        background: 'white', 
                        padding: '1.5rem', 
                        borderRadius: '8px',
                        marginTop: '2rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <p style={{ color: '#495057', fontSize: '0.95rem', margin: '0', fontWeight: '500' }}>
                          🚀 <strong>Coming Features:</strong> Sales metrics, profit analysis, customer insights, and performance trends specific to {tab.label}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            ))}
          </TabContent>
        </TabContainer>
      </div>
    </div>
  );
};

const StatusBadge = ({ color, children }) => {
  const colorClasses = {
    success: 'bg-green-500',
    primary: 'bg-blue-500',
    secondary: 'bg-blue-400',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
    grey: 'bg-gray-500'
  };

  return (
    <span className={`inline-block px-2 py-1 rounded text-sm font-medium text-white ${colorClasses[color] || colorClasses.grey}`}>
      {children}
    </span>
  );
};

export default DashboardPage; 
