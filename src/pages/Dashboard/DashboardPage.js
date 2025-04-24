import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
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
  FiPackage 
} from 'react-icons/fi';

import { StatCard, ChartCard, DataTable } from '../../components/Dashboard';
import useDataFetching from '../../hooks/useDataFetching';
import { 
  getDashboardSummaryFromDynamo, 
  getSalesAnalyticsFromDynamo, 
  getRecentOrdersFromDynamo 
} from '../../api/dynamoAPI';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { runAWSTest, showAllTables } from '../../utils/awsUtils';

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

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const PageTitle = styled.div`
  margin-bottom: var(--spacing-lg);
  
  h1 {
    margin-bottom: var(--spacing-xs);
  }
  
  p {
    color: var(--text-secondary);
    font-size: 1rem;
    margin-bottom: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
`;

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const OrdersSection = styled.div`
  margin-top: var(--spacing-lg);
`;

// Add a styled button for testing
const TestButton = styled.button`
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 16px;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

// Button row for multiple actions
const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  margin-left: 16px;
`;

const DashboardPage = () => {
  const [timeframe, setTimeframe] = useState('week');
  
  // Fetch dashboard summary data directly from DynamoDB
  const { 
    data: summaryData, 
    loading: summaryLoading 
  } = useDataFetching(getDashboardSummaryFromDynamo, [], { timeframe });
  
  // Fetch sales analytics data directly from DynamoDB
  const { 
    data: salesData, 
    loading: salesLoading, 
    refetch: refetchSales 
  } = useDataFetching(getSalesAnalyticsFromDynamo, [], { timeframe });
  
  // Fetch recent orders directly from DynamoDB
  const { 
    data: ordersData, 
    loading: ordersLoading 
  } = useDataFetching(getRecentOrdersFromDynamo, [], { page: 1, pageSize: 10 });

  // Add a useEffect to check AWS connection on mount
  useEffect(() => {
    console.log('Dashboard mounted - checking environment variables:');
    console.log('AWS Region:', process.env.REACT_APP_AWS_REGION);
    console.log('Has AWS Access Key:', !!process.env.REACT_APP_AWS_ACCESS_KEY_ID);
    console.log('Orders Table:', process.env.REACT_APP_DYNAMODB_ORDERS_TABLE);
  }, []);
  
  // Add a handler for the test button
  const handleTestAWSConnection = () => {
    runAWSTest();
  };

  // Add a handler for the list tables button
  const handleListTables = () => {
    showAllTables();
  };

  // Handler for timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe.toLowerCase());
    refetchSales({ timeframe: newTimeframe.toLowerCase() });
  };
  
  // Prepare the sales chart data
  const salesChartData = {
    labels: salesData?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: salesData?.datasets?.[0]?.data || [],
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
    labels: salesData?.labels || [],
    datasets: [
      {
        label: 'Orders',
        data: salesData?.datasets?.[1]?.data || [],
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
  
  return (
    <DashboardContainer>
      <PageTitle>
        <h1>
          Dashboard
          {(summaryLoading || salesLoading || ordersLoading) && (
            <span style={{ marginLeft: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Loading...
            </span>
          )}
          <ButtonRow>
            <TestButton onClick={handleTestAWSConnection}>
              Test AWS Connection
            </TestButton>
            <TestButton onClick={handleListTables}>
              List DynamoDB Tables
            </TestButton>
          </ButtonRow>
        </h1>
        <p>Welcome back! Here's an overview of your Shopify store performance.</p>
      </PageTitle>
      
      <StatsGrid>
        {summaryLoading ? (
          <div>Loading stats...</div>
        ) : (
          <>
            <StatCard 
              title="Total Sales"
              value={formatCurrency(summaryData?.salesSummary?.totalSales || 0)}
              icon={FiDollarSign}
              color="primary"
              percentageChange={summaryData?.salesSummary?.percentageChange || 0}
            />
            <StatCard 
              title="Orders"
              value={formatNumber(summaryData?.ordersSummary?.totalOrders || 0)}
              icon={FiShoppingCart}
              color="success"
              percentageChange={summaryData?.ordersSummary?.percentageChange || 0}
            />
            <StatCard 
              title="Customers"
              value={formatNumber(summaryData?.customersSummary?.totalCustomers || 0)}
              icon={FiUsers}
              color="secondary"
              percentageChange={summaryData?.customersSummary?.percentageChange || 0}
            />
            <StatCard 
              title="Products"
              value={formatNumber(summaryData?.inventorySummary?.totalProducts || 0)}
              icon={FiPackage}
              color="warning"
              percentageChange={5.2}
            />
          </>
        )}
      </StatsGrid>
      
      <ChartsRow>
        <ChartCard 
          title="Revenue Overview" 
          subtitle={`Total: ${formatCurrency(salesData?.totalRevenue || 0)}`}
          legends={[{ label: 'Revenue', color: 'var(--primary-color)' }]}
          timeframes={['Day', 'Week', 'Month', 'Year']}
          activeTimeframe={timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          onTimeframeChange={handleTimeframeChange}
          loading={salesLoading}
        >
          {salesLoading ? (
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
      </ChartsRow>
      
      <ChartCard 
        title="Orders Trend" 
        subtitle={`Total Orders: ${formatNumber(salesData?.totalOrders || 0)}`}
        legends={[{ label: 'Orders', color: 'var(--success-color)' }]}
        timeframes={['Day', 'Week', 'Month', 'Year']}
        activeTimeframe={timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
        onTimeframeChange={handleTimeframeChange}
      >
        {!salesLoading && salesData && (
          <div style={{ width: '100%', height: '300px' }}>
            <Bar data={ordersChartData} options={ordersChartOptions} />
          </div>
        )}
      </ChartCard>
      
      <OrdersSection>
        <DataTable 
          title="Recent Orders"
          columns={ordersColumns}
          data={ordersData?.orders || []}
          pagination={true}
          loading={ordersLoading}
        />
      </OrdersSection>
    </DashboardContainer>
  );
};

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => `var(--${props.color}-color)`};
  color: white;
`;

export default DashboardPage; 