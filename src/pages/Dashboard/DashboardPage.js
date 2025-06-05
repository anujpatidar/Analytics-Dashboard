import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
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
} from 'chart.js';
import { 
  FiShoppingCart, 
  FiUsers, 
  FiPackage,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiDownload
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import { format, startOfDay, endOfDay } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import "react-datepicker/dist/react-datepicker.css";

import { StatCard, ChartCard, DataTable } from '../../components/Dashboard';
import MetaAdsDashboardWidget from '../../components/MetaAds/MetaAdsDashboardWidget';
import GoogleAdsDashboardWidget from '../../components/GoogleAds/GoogleAdsDashboardWidget';
import CombinedMarketingWidget from '../../components/Marketing/CombinedMarketingWidget';
import useDataFetching from '../../hooks/useDataFetching';
import {
  getOrdersOverview,
  getOrdersByTimeRange,
  getTopSellingProducts,
  getRefundMetrics,
  getRecentOrders
} from '../../api/ordersAPI';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

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

const DashboardPage = () => {
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
  
  // Calculate date range based on timeframe
  const getDateRange = (timeframe) => {
    if (isCustomDateRange && dateRange[0] && dateRange[1]) {
      return {
        startDate: toUTC(startOfDay(dateRange[0])).toISOString(),
        endDate: toUTC(endOfDay(dateRange[1])).toISOString()
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
      endDate: toUTC(end).toISOString()
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
    timeframe
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

  // Function to refetch all data
  const refetchAllData = (dateRange) => {
    refetchOrdersOverview(dateRange);
    refetchRefundMetrics(dateRange);
    refetchTopProducts(dateRange);
    refetchOrdersByTimeRange({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      timeframe: isCustomDateRange ? 'custom' : timeframe
    });
    refetchRecentOrders({
      page: currentPage,
      pageSize,
      ...dateRange
    });
  };

  // Handler for custom date range change
  const handleDateRangeChange = (update) => {
    setDateRange(update);
    if (update[0] && update[1]) {
      setIsCustomDateRange(true);
      const dateRange = {
        startDate: toUTC(startOfDay(update[0])).toISOString(),
        endDate: toUTC(endOfDay(update[1])).toISOString()
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
      value: formatNumber(ordersOverview?.total_orders || 0),
      icon: FiShoppingCart,
      change: ordersOverview?.order_change_percentage ? `${ordersOverview.order_change_percentage}%` : '0%',
      changeType: ordersOverview?.order_change_percentage > 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(ordersOverview?.total_revenue || 0),
      icon: FaRupeeSign,
      change: ordersOverview?.revenue_change_percentage ? `${ordersOverview.revenue_change_percentage}%` : '0%',
      changeType: ordersOverview?.revenue_change_percentage > 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(ordersOverview?.average_order_value || 0),
      icon: FaRupeeSign,
      change: ordersOverview?.aov_change_percentage ? `${ordersOverview.aov_change_percentage}%` : '0%',
      changeType: ordersOverview?.aov_change_percentage > 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Refund Rate',
      value: `${((ordersOverview?.total_refunds / ordersOverview?.total_orders) * 100 || 0).toFixed(1)}%`,
      icon: FiRefreshCw,
      change: ordersOverview?.refund_rate_change_percentage ? `${ordersOverview.refund_rate_change_percentage}%` : '0%',
      changeType: ordersOverview?.refund_rate_change_percentage < 0 ? 'decrease' : 'increase'
    }
  ];

  // Prepare the refund metrics stats with date range
  const refundStats = [
    {
      title: 'Total Refunds',
      value: formatNumber(refundMetrics?.total_refunds || 0),
      icon: FiRefreshCw,
      change: refundMetrics?.refund_change_percentage ? `${refundMetrics.refund_change_percentage}%` : '0%',
      changeType: refundMetrics?.refund_change_percentage < 0 ? 'decrease' : 'increase'
    },
    {
      title: 'Refunded Amount',
      value: formatCurrency(refundMetrics?.total_refunded_amount || 0),
      icon: FaRupeeSign,
      change: refundMetrics?.refund_amount_change_percentage ? `${refundMetrics.refund_amount_change_percentage}%` : '0%',
      changeType: refundMetrics?.refund_amount_change_percentage < 0 ? 'decrease' : 'increase'
    },
    {
      title: 'Average Refund',
      value: formatCurrency(refundMetrics?.average_refund_amount || 0),
      icon: FaRupeeSign,
      change: refundMetrics?.avg_refund_change_percentage ? `${refundMetrics.avg_refund_change_percentage}%` : '0%',
      changeType: refundMetrics?.avg_refund_change_percentage < 0 ? 'decrease' : 'increase'
    },
    {
      title: '24h Refunds',
      value: formatNumber(refundMetrics?.refunds_last_24h || 0),
      icon: FiRefreshCw,
      change: refundMetrics?.refund_24h_change_percentage ? `${refundMetrics.refund_24h_change_percentage}%` : '0%',
      changeType: refundMetrics?.refund_24h_change_percentage < 0 ? 'decrease' : 'increase'
    }
  ];

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
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FiBarChart2 className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                <p className="text-gray-600">Monitor your store's performance and key metrics</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => refetchAllData(getCurrentDateRange())}
                disabled={ordersOverviewLoading || refundMetricsLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${(ordersOverviewLoading || refundMetricsLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => {/* Add export functionality */}}
                disabled={ordersOverviewLoading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Date Range Controls */}
          <div className="flex flex-wrap items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <DatePicker
              selected={dateRange[0]}
              onChange={handleDateRangeChange}
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              selectsRange
              dateFormat="dd/MM/yyyy"
              showTimeSelect={false}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select date range"
              maxDate={new Date()}
              calendarClassName="custom-datepicker"
              isClearable={true}
            />
          </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quick Select</label>
              <div className="flex items-center space-x-2">
            <button
              onClick={() => handleTimeframeChange('day')}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                timeframe === 'day' && !isCustomDateRange
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => handleTimeframeChange('week')}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                timeframe === 'week' && !isCustomDateRange
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleTimeframeChange('month')}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                timeframe === 'month' && !isCustomDateRange
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleTimeframeChange('year')}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                timeframe === 'year' && !isCustomDateRange
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Year
            </button>
              </div>
          </div>
        </div>
      </div>

      {/* Orders Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {orderStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
            loading={ordersOverviewLoading}
          />
        ))}
      </div>

      {/* Refund Metrics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {refundStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
            loading={refundMetricsLoading}
          />
        ))}
      </div>

        {/* Marketing Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">
            <CombinedMarketingWidget 
              dateRange={timeframe}
              customDateRange={dateRange}
              isCustomDateRange={isCustomDateRange}
            />
          </div>
          <div className="lg:col-span-1">
        <ChartCard 
          title="Revenue Overview" 
          subtitle={`Total: ${formatCurrency(ordersByTimeRange?.reduce((total, item) => total + item.daily_revenue, 0) || 0)}`}
          legends={[{ label: 'Revenue', color: 'var(--primary-color)' }]}
          timeframes={['Day', 'Week', 'Month', 'Year']}
          activeTimeframe={timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          onTimeframeChange={handleTimeframeChange}
          loading={ordersByTimeRangeLoading}
        >
          {ordersByTimeRangeLoading ? (
            <div>Loading chart...</div>
          ) : (
            <div style={{ width: '100%', height: '300px' }}>
              <Line data={salesChartData} options={salesChartOptions} />
            </div>
          )}
        </ChartCard>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Customer Acquisition" 
          subtitle="Source breakdown"
          legends={[
            { label: 'Direct', color: 'rgba(0, 115, 182, 0.8)' },
            { label: 'Search', color: 'rgba(3, 169, 244, 0.8)' },
            { label: 'Social', color: 'rgba(76, 175, 80, 0.8)' },
            { label: 'Email', color: 'rgba(255, 193, 7, 0.8)' },
            { label: 'Referral', color: 'rgba(244, 67, 54, 0.8)' },
            { label: 'Other', color: 'rgba(156, 39, 176, 0.8)' },
          ]}
          timeframes={[]}
        >
          <div style={{ width: '100%', height: '300px' }}>
            <Pie data={customerAcquisitionData} options={customerAcquisitionOptions} />
          </div>
        </ChartCard>
        
        <ChartCard 
          title="Orders Trend" 
          subtitle={`Total Orders: ${formatNumber(ordersByTimeRange?.reduce((total, item) => total + item.order_count, 0) || 0)}`}
          legends={[{ label: 'Orders', color: 'var(--success-color)' }]}
          timeframes={['Day', 'Week', 'Month', 'Year']}
          activeTimeframe={timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          onTimeframeChange={handleTimeframeChange}
        >
          {!ordersByTimeRangeLoading && ordersByTimeRange && (
            <div style={{ width: '100%', height: '300px' }}>
              <Bar data={ordersChartData} options={ordersChartOptions} />
            </div>
          )}
        </ChartCard>
      </div>

      {/* Orders Over Time Chart */}
      <ChartCard
        title="Orders and Refunds Over Time"
        subtitle={`Showing ${timeframe} trends`}
        loading={ordersByTimeRangeLoading}
      >
        <Line
          data={ordersOverTimeData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index',
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  pointStyle: 'circle',
                  padding: 20,
                  font: {
                    size: 13,
                    weight: '500',
                  },
                  color: 'rgba(0, 0, 0, 0.7)',
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                usePointStyle: true,
                callbacks: {
                  title: (context) => `${context[0].label}`,
                  label: (context) => {
                    const label = context.dataset.label || '';
                    const value = formatNumber(context.raw);
                    return `${label}: ${value}`;
                  }
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
              line: {
                borderJoinStyle: 'round',
                borderCapStyle: 'round',
              }
            },
            animation: {
              duration: 1200,
              easing: 'easeInOutQuart',
            }
          }}
        />
      </ChartCard>

        <DataTable 
          title="Recent Orders"
          columns={ordersColumns}
          data={recentOrdersData?.orders || []}
          pagination={true}
          loading={recentOrdersLoading}
          currentPage={currentPage}
          totalPages={recentOrdersData?.totalPages || 1}
          onPageChange={(page) => {
            setCurrentPage(page);
            refetchRecentOrders({ page, pageSize });
          }}
        />
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
