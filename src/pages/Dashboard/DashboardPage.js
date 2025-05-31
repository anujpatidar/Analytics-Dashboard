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
  FiDollarSign, 
  FiUsers, 
  FiPackage,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';

import { StatCard, ChartCard, DataTable } from '../../components/Dashboard';
import useDataFetching from '../../hooks/useDataFetching';
import {
  getOrdersOverview,
  getOrdersByTimeRange,
  getTopSellingProducts,
  getRefundMetrics
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
  const [timeframe, setTimeframe] = useState('week');
  
  // Fetch orders overview data
  const {
    data: ordersOverview,
    loading: ordersOverviewLoading
  } = useDataFetching(getOrdersOverview);

  // Fetch refund metrics
  const {
    data: refundMetrics,
    loading: refundMetricsLoading
  } = useDataFetching(getRefundMetrics);

  // Fetch top selling products
  const {
    data: topProducts,
    loading: topProductsLoading
  } = useDataFetching(getTopSellingProducts);

  // Fetch orders by time range
  const {
    data: ordersByTimeRange,
    loading: ordersByTimeRangeLoading
  } = useDataFetching(getOrdersByTimeRange, [], {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  });

  // Handler for timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe.toLowerCase());
  };
  
  // Prepare the sales chart data
  const salesChartData = {
    labels: ordersByTimeRange?.map(item => formatDate(item.date, 'short')) || [],
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
          callback: (value) => formatCurrency(value, 'USD', 'en-US', 0),
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
    labels: ordersByTimeRange?.map(item => formatDate(item.date, 'short')) || [],
    datasets: [
      {
        label: 'Orders',
        data: ordersByTimeRange?.map(item => item.order_count) || [],
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderRadius: 4,
      }
    ]
  };
  
  const ordersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
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
          switch (status.toLowerCase()) {
            case 'completed': return 'success';
            case 'processing': return 'primary';
            case 'shipped': return 'secondary';
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
  
  // Prepare the orders overview stats
  const orderStats = [
    {
      title: 'Total Orders',
      value: formatNumber(ordersOverview?.total_orders || 0),
      icon: <FiShoppingCart className="w-6 h-6" />,
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(ordersOverview?.total_revenue || 0),
      icon: <FiDollarSign className="w-6 h-6" />,
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(ordersOverview?.average_order_value || 0),
      icon: <FiTrendingUp className="w-6 h-6" />,
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'Refund Rate',
      value: `${((ordersOverview?.total_refunds / ordersOverview?.total_orders) * 100 || 0).toFixed(1)}%`,
      icon: <FiRefreshCw className="w-6 h-6" />,
      change: '-2%',
      changeType: 'decrease'
    }
  ];

  // Prepare the refund metrics stats
  const refundStats = [
    {
      title: 'Total Refunds',
      value: formatNumber(refundMetrics?.total_refunds || 0),
      icon: <FiRefreshCw className="w-6 h-6" />,
      change: '-5%',
      changeType: 'decrease'
    },
    {
      title: 'Refunded Amount',
      value: formatCurrency(refundMetrics?.total_refunded_amount || 0),
      icon: <FiDollarSign className="w-6 h-6" />,
      change: '-3%',
      changeType: 'decrease'
    },
    {
      title: 'Average Refund',
      value: formatCurrency(refundMetrics?.average_refund_amount || 0),
      icon: <FiTrendingDown className="w-6 h-6" />,
      change: '-1%',
      changeType: 'decrease'
    },
    {
      title: '24h Refunds',
      value: formatNumber(refundMetrics?.refunds_last_24h || 0),
      icon: <FiRefreshCw className="w-6 h-6" />,
      change: '+2%',
      changeType: 'increase'
    }
  ];

  // Prepare the orders over time chart data
  const ordersOverTimeData = {
    labels: ordersByTimeRange?.map(item => formatDate(item.date, 'short')) || [],
    datasets: [
      {
        label: 'Orders',
        data: ordersByTimeRange?.map(item => item.order_count) || [],
        borderColor: 'rgba(0, 115, 182, 1)',
        backgroundColor: 'rgba(0, 115, 182, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Refunds',
        data: ordersByTimeRange?.map(item => item.refund_count) || [],
        borderColor: 'rgba(244, 67, 54, 1)',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
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
    <div className="flex flex-col gap-6 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your analytics dashboard</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        loading={ordersByTimeRangeLoading}
      >
        <Line
          data={ordersOverTimeData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                }
              },
              x: {
                grid: {
                  display: false,
                }
              }
            }
          }}
        />
      </ChartCard>

      {/* Top Selling Products Table */}
      <ChartCard
        title="Top Selling Products"
        loading={topProductsLoading}
      >
        <DataTable
          columns={topProductsColumns}
          data={topProducts || []}
          loading={topProductsLoading}
        />
      </ChartCard>

      <div className="mt-6">
        <DataTable 
          title="Recent Orders"
          columns={ordersColumns}
          data={ordersByTimeRange?.map(item => ({ ...item, status: 'Completed' })) || []}
          pagination={true}
          loading={ordersByTimeRangeLoading}
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