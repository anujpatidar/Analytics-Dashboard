import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useParams } from 'react-router-dom';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiShoppingCart, 
  FiDollarSign, 
  FiPackage, 
  FiPercent, 
  FiRefreshCw,
  FiUsers,
  FiTarget,
  FiCreditCard,
  FiEye,
  FiMousePointer,
  FiBarChart2,
  FiActivity,
  FiCalendar,
  FiFilter
} from 'react-icons/fi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

// Mock data - Replace with actual API calls
// const mockProductData = {
//   product: {
//     id: 1,
//     name: 'Premium Wireless Headphones',
//     image: 'https://cdn.shopify.com/s/files/1/0553/0419/2034/files/products_4july-03_803b519a-125c-458b-bfab-15f0d0009fb1.jpg?v=1720861559&width=648',
//     description: 'High-quality wireless headphones with noise cancellation',
//     sku: 'PH-001',
//     price: 12999,
//     costPrice: 8000,
//   },
//   overview: {
//     totalOrders: 1250,
//     totalSales: 15623750,
//     aov: 12500,
//     quantitySold: 1250,
//     grossProfit: 6249500,
//     profitMargin: 40,
//     refundRate: 5.2,
//   },
//   salesAndProfit: {
//     totalRevenue: 15623750,
//     marketingCost: 1250000,
//     profitAfterMarketing: 4999500,
//     profitPerUnit: 4000,
//     costPricePerUnit: 8000,
//     returnUnits: 65,
//     returnRate: 5.2,
//   },
//   customerInsights: {
//     repeatCustomerRate: 35,
//     customerBreakdown: [
//       { name: 'First-time', value: 65 },
//       { name: 'Returning', value: 35 },
//     ],
//     one_order_customer_count: 200,
//     two_orders_customer_count: 150,
//     three_orders_customer_count: 100,
//     four_plus_orders_customer_count: 50,
//   },
//   variants: [
//     { name: 'Black', soldCount: 500, profit: 2000000 },
//     { name: 'White', soldCount: 450, profit: 1800000 },
//     { name: 'Blue', soldCount: 300, profit: 1200000 },
//   ],
//   salesTrend: [
//     { date: 'Jan', sales: 1200000 },
//     { date: 'Feb', sales: 1500000 },
//     { date: 'Mar', sales: 1800000 },
//     { date: 'Apr', sales: 1600000 },
//     { date: 'May', sales: 2000000 },
//     { date: 'Jun', sales: 2200000 },
//   ],
//   refundsOverTime: [
//     { date: 'Jan', refunds: 5 },
//     { date: 'Feb', refunds: 8 },
//     { date: 'Mar', refunds: 6 },
//     { date: 'Apr', refunds: 7 },
//     { date: 'May', refunds: 4 },
//     { date: 'Jun', refunds: 3 },
//   ],
//   profitVsMarketing: [
//     { date: 'Jan', profit: 1200000, marketing: 200000 },
//     { date: 'Feb', profit: 1500000, marketing: 250000 },
//     { date: 'Mar', profit: 1800000, marketing: 300000 },
//     { date: 'Apr', profit: 1600000, marketing: 200000 },
//     { date: 'May', profit: 2000000, marketing: 250000 },
//     { date: 'Jun', profit: 2200000, marketing: 300000 },
//   ],
// };

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PageContainer = styled.div`
  padding: var(--spacing-lg);
`;

const PageHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--spacing-xl);
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  margin-bottom: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    z-index: 1;
  }
  
  & > * {
    position: relative;
    z-index: 2;
  }
  
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: var(--spacing-lg);
  }
`;

const ProductImage = styled.img`
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  border: 4px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-width: 768px) {
    width: 120px;
    height: 120px;
  }
`;

const ProductInfo = styled.div`
  flex: 1;
  color: white;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-sm);
    font-weight: 700;
    background: linear-gradient(45deg, #ffffff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }
  
  p {
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: var(--spacing-sm);
    font-size: 1.1rem;
    font-weight: 500;
    
    &:first-of-type {
      background: rgba(255, 255, 255, 0.2);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: 25px;
      display: inline-block;
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: var(--spacing-md);
    }
    
    &:last-child {
      font-size: 1rem;
      line-height: 1.6;
      max-width: 600px;
    }
  }
  
  .product-meta {
    display: flex;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-md);
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: var(--spacing-sm);
    }
  }
  
  .meta-item {
    background: rgba(255, 255, 255, 0.15);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    .label {
      font-size: 0.8rem;
      opacity: 0.8;
      margin-bottom: 2px;
    }
    
    .value {
      font-weight: 600;
      font-size: 1rem;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = ({ title, value, icon: Icon, color = '#3b82f6', change, prefix = '' }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {change !== undefined && (
          <div className={`flex items-center mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <FiTrendingUp className="w-4 h-4 mr-1" /> : <FiTrendingDown className="w-4 h-4 mr-1" />}
            <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
  </div>
);

const Section = styled.div`
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  
  h2 {
    font-size: 1.2rem;
    margin-bottom: var(--spacing-lg);
  }
`;

const BackgroundSection = styled.div`
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);
  margin-bottom: var(--spacing-xl);
  
  h2 {
    font-size: 1.2rem;
    margin-bottom: var(--spacing-lg);
  }
`;

const ChartContainer = styled.div`
  height: 300px;
  margin-top: var(--spacing-lg);
`;

const VariantsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: var(--spacing-md);
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }
  
  th {
    font-weight: 600;
    color: var(--text-secondary);
  }
`;

const formatPercentage = (value) => {
  return `${value?.toFixed(1)}%`;
};

const DateFilterContainer = styled.div`
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);
  margin-bottom: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DateFilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  
  label {
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 80px;
  }
  
  input {
    padding: var(--spacing-sm);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-sm);
    font-size: 0.9rem;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }
`;

const FilterButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const QuickDateButtons = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
`;

const QuickDateButton = styled.button`
  background: ${props => props.active ? '#3b82f6' : 'transparent'};
  color: ${props => props.active ? 'white' : '#3b82f6'};
  border: 1px solid #3b82f6;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #3b82f6;
    color: white;
  }
`;

// Add Marketplace Tab Components
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

// Add helper function to safely display values
const safeDisplayValue = (value, fallback = 'N/A', formatter = null) => {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
    return fallback;
  }
  if (formatter && typeof formatter === 'function') {
    return formatter(value);
  }
  return value;
};

// Add helper function to safely format percentage
const safePercentageFormat = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
    return fallback;
  }
  return `${parseFloat(value).toFixed(2)}%`;
};

// Add helper function to safely format numbers
const safeNumberFormat = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
    return fallback;
  }
  return parseInt(value).toLocaleString();
};

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date filter state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [activeQuickFilter, setActiveQuickFilter] = useState('30d');

  // Marketplace tab state
  const [activeTab, setActiveTab] = useState('all');

  const quickDateFilters = [
    { label: '7D', value: '7d', days: 7 },
    { label: '30D', value: '30d', days: 30 },
    { label: '3M', value: '3m', days: 90 },
    { label: '6M', value: '6m', days: 180 },
    { label: '1Y', value: '1y', days: 365 }
  ];

  // Tab configuration
  const tabs = [
    { 
      id: 'all', 
      label: 'All Combined', 
      icon: '🌐',
      description: 'Aggregate data from all marketplaces and sales channels combined'
    },
    { 
      id: 'website', 
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
    // For now, we'll just update the state
    console.log(`Switched to tab: ${tabId}`);
  };

  const handleQuickDateFilter = (filterValue, days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    setActiveQuickFilter(filterValue);
  };

  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:8080/api/v1/products/get-product-metrics-by-id/${productId}?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result.data);
      console.log(result.data);
    } catch (error) {
      console.error('Error fetching product data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const handleApplyFilter = () => {
    setActiveQuickFilter(''); // Clear quick filter selection when using custom dates
    fetchProductData();
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div>Loading product details...</div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div>Error loading product details: {error}</div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <div>No product data found</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <ProductImage src={data.product.image} alt={data.product.name} />
        <ProductInfo>
          <h1>{data.product.name}</h1>
          <p>SKU: {data.product.sku}</p>
          <div className="product-meta">
            <div className="meta-item">
              <div className="label">Price</div>
              <div className="value">{formatCurrency(data.product.price)}</div>
            </div>
            <div className="meta-item">
              <div className="label">Cost Price</div>
              <div className="value">{formatCurrency(data.product.costPrice)}</div>
            </div>
            <div className="meta-item">
              <div className="label">Profit Margin</div>
              <div className="value">{formatPercentage(data.overview.profitMargin)}</div>
            </div>
          </div>
        </ProductInfo>
      </PageHeader>

      {/* Date Filter Section */}
      <DateFilterContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <FiCalendar style={{ color: '#3b82f6' }} />
          <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Date Range:</span>
        </div>
        
        <DateFilterGroup>
          <label htmlFor="startDate">From:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
          />
        </DateFilterGroup>
        
        <DateFilterGroup>
          <label htmlFor="endDate">To:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={new Date().toISOString().split('T')[0]}
          />
        </DateFilterGroup>
        
        <FilterButton onClick={handleApplyFilter} disabled={isLoading}>
          <FiFilter />
          {isLoading ? 'Loading...' : 'Apply Filter'}
        </FilterButton>
        
        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: 'var(--spacing-md)', marginLeft: 'var(--spacing-md)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: 'var(--spacing-sm)' }}>
            Quick filters:
          </span>
          <QuickDateButtons>
            {quickDateFilters.map((filter) => (
              <QuickDateButton
                key={filter.value}
                active={activeQuickFilter === filter.value}
                onClick={() => handleQuickDateFilter(filter.value, filter.days)}
              >
                {filter.label}
              </QuickDateButton>
            ))}
          </QuickDateButtons>
        </div>
      </DateFilterContainer>

      {/* Add Marketplace Tab Components */}
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
                
                {/* Show placeholder for non-Myfrido tabs */}
                {activeTab !== 'website' && (
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

      {/* All existing data sections - Only show for Myfrido tab */}
      {activeTab === 'website' && (
        <>
          {/* Sales Matrices Section */}
          <Section>
            <h2>Sales Matrices</h2>
            
            {/* Sales Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#3b82f6' }}>Sales</h3>
              <StatsGrid>
                <StatCard
                  title="Total Sales (INR)"
                  value={formatCurrency(data.overview.totalSales)}
                  icon={FiDollarSign}
                  color="#3b82f6"
                />
                <StatCard
                  title="Gross Sales (INR)"
                  value={formatCurrency(data.overview.grossSales || data.overview.totalSales)}
                  icon={FiDollarSign}
                  color="#10b981"
                />
                <StatCard
                  title="Net Sales (INR)"
                  value={formatCurrency(data.overview.netSales || 0)}
                  icon={FiDollarSign}
                  color="#f59e0b"
                />
                <StatCard
                  title="AOV (Average Order Value)"
                  value={formatCurrency(data.overview.aov)}
                  icon={FiCreditCard}
                  color="#8b5cf6"
                />
                <StatCard
                  title="Gross Sale as % of Total Sales"
                  value={formatPercentage(data.overview.grossSalePercentage || 100)}
                  icon={FiPercent}
                  color="#dc2626"
                />
                <StatCard
                  title="Net Sale as % of Total Sales"
                  value={formatPercentage(data.overview.netSalePercentage || 100)}
                  icon={FiPercent}
                  color="#6366f1"
                />
              </StatsGrid>
            </div>

            {/* Orders & Quantity Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#059669' }}>Orders & Quantity</h3>
              <StatsGrid>
                <StatCard
                  title="Total Orders"
                  value={safeNumberFormat(data.overview.totalOrders)}
                  icon={FiShoppingCart}
                  color="#059669"
                />
                <StatCard
                  title="Net Orders"
                  value={safeNumberFormat(data.overview.netOrders)}
                  icon={FiShoppingCart}
                  color="#10b981"
                />
                <StatCard
                  title="Total Quantity"
                  value={safeNumberFormat(data.overview.totalQuantitySold)}
                  icon={FiPackage}
                  color="#f59e0b"
                />
                <StatCard
                  title="Net Quantity"
                  value={safeNumberFormat(data.overview.netQuantitySold)}
                  icon={FiPackage}
                  color="#8b5cf6"
                />
                <StatCard
                  title="Total Returns Quantity"
                  value={safeNumberFormat(data.overview.totalReturnsQuantity || 0)}
                  icon={FiRefreshCw}
                  color="#ef4444"
                />
              </StatsGrid>
            </div>

            {/* Returns Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#ef4444' }}>Returns</h3>
              <StatsGrid>
                <StatCard
                  title="Total Returns (INR)"
                  value={formatCurrency(data.overview.totalReturns || 0)}
                  icon={FiRefreshCw}
                  color="#ef4444"
                />
                <StatCard
                  title="Total Return (%)"
                  value={formatPercentage(data.overview.totalReturnPercentage || 0)}
                  icon={FiPercent}
                  color="#dc2626"
                />
              </StatsGrid>
            </div>

            {/* Tax Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#059669' }}>Tax</h3>
              <StatsGrid>
                <StatCard
                  title="Total Tax (INR)"
                  value={formatCurrency(data.overview.totalTax || 0)}
                  icon={FiDollarSign}
                  color="#059669"
                />
                <StatCard
                  title="Total Tax (%)"
                  value={(data.overview.taxRate || 0)}
                  icon={FiPercent}
                  color="#10b981"
                />
              </StatsGrid>
            </div>

            {/* Expenses Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#f59e0b' }}>Expenses</h3>
              <StatsGrid>
                <StatCard
                  title="COGS (INR)"
                  value={formatCurrency(data.overview.cogs || 0)}
                  icon={FiPackage}
                  color="#f59e0b"
                />
                <StatCard
                  title="COGS (%)"
                  value={formatPercentage(data.overview.cogsPercentage || 0)}
                  icon={FiPercent}
                  color="#8b5cf6"
                />
                <StatCard
                  title="S&D Cost (INR)"
                  value={formatCurrency(data.overview.sdCost || 0)}
                  icon={FiTarget}
                  color="#6366f1"
                />
                <StatCard
                  title="S&D Cost (%)"
                  value={formatPercentage(data.overview.sdCostPercentage || 0)}
                  icon={FiPercent}
                  color="#3b82f6"
                />
              </StatsGrid>
            </div>

            {/* ROAS Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#8b5cf6' }}>ROAS</h3>
              <StatsGrid>
                <StatCard
                  title="Gross ROAS"
                  value={(data.overview.grossRoas || 0).toFixed(2)}
                  icon={FiTrendingUp}
                  color="#8b5cf6"
                />
                <StatCard
                  title="Gross MER (%)"
                  value={formatPercentage(data.overview.grossMer || 0)}
                  icon={FiPercent}
                  color="#6366f1"
                />
                <StatCard
                  title="Net ROAS"
                  value={(data.overview.netRoas || 0).toFixed(2)}
                  icon={FiTrendingUp}
                  color="#10b981"
                />
                <StatCard
                  title="Net MER (%)"
                  value={formatPercentage(data.overview.netMer || 0)}
                  icon={FiPercent}
                  color="#059669"
                />
                <StatCard
                  title="N-ROAS"
                  value={(data.overview.nRoas || 0).toFixed(2)}
                  icon={FiTrendingUp}
                  color="#f59e0b"
                />
                <StatCard
                  title="N-MER (%)"
                  value={formatPercentage(data.overview.nMer || 0)}
                  icon={FiPercent}
                  color="#dc2626"
                />
              </StatsGrid>
            </div>

            {/* CAC Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#ef4444' }}>CAC</h3>
              <StatsGrid>
                <StatCard
                  title="CAC"
                  value={formatCurrency(data.overview.cac || 0)}
                  icon={FiCreditCard}
                  color="#ef4444"
                />
                <StatCard
                  title="N-CAC"
                  value={formatCurrency(data.overview.nCac || 0)}
                  icon={FiCreditCard}
                  color="#dc2626"
                />
              </StatsGrid>
            </div>

            {/* Contribution Margin Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#059669' }}>Contribution Margin</h3>
              <StatsGrid>
                <StatCard
                  title="CM2 (INR)"
                  value={formatCurrency(data.overview.cm2 || 0)}
                  icon={FiTrendingUp}
                  color="#059669"
                />
                <StatCard
                  title="CM2 (%)"
                  value={formatPercentage(data.overview.cm2Percentage || 0)}
                  icon={FiPercent}
                  color="#10b981"
                />
                <StatCard
                  title="CM3 (INR)"
                  value={formatCurrency(data.overview.cm3 || 0)}
                  icon={FiTrendingUp}
                  color="#8b5cf6"
                />
                <StatCard
                  title="CM3 (%)"
                  value={formatPercentage(data.overview.cm3Percentage || 0)}
                  icon={FiPercent}
                  color="#6366f1"
                />
              </StatsGrid>
            </div>
          </Section>

          {/* Marketing Overview */}
          <BackgroundSection>
            <h2>Meta Ads Marketing Analytics</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                  Targeting Keyword: <span style={{ fontWeight: 'bold', color: '#ffd700' }}>"{data.marketing.keyword || 'N/A'}"</span>
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', opacity: '0.9' }}>
                  Found {data.marketing.campaignCount} active campaigns for this product
                </p>
                <p style={{ margin: '0', opacity: '0.8', fontSize: '0.9rem' }}>
                  📅 Marketing data for: {new Date(data.dateFilter.startDate).toLocaleDateString()} - {new Date(data.dateFilter.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Marketing Metrics */}
            <StatsGrid>
              <StatCard
                title="Total Ad Spend"
                value={formatCurrency(data.marketing.totalSpend)}
                icon={FiDollarSign}
                color="#ef4444"
              />
              <StatCard
                title="Total Impressions"
                value={safeNumberFormat(data.marketing.totalImpressions)} 
                icon={FiEye}
                color="#3b82f6"
              />
              <StatCard
                title="Total Clicks"
                value={safeNumberFormat(data.marketing.totalClicks)}
                icon={FiMousePointer}
                color="#10b981"
              />
              <StatCard
                title="Total Purchases"
                value={safeNumberFormat(data.marketing.totalPurchases)}
                icon={FiShoppingCart}
                color="#8b5cf6"
              />
              <StatCard
                title="Purchase Value"
                value={formatCurrency(data.marketing.totalPurchaseValue)}
                icon={FiDollarSign}
                color="#059669"
              />
              <StatCard
                title="ROAS"
                value={formatPercentage(data.marketing.averageRoas)}
                icon={FiTrendingUp}
                color="#10b981"
              />
              <StatCard
                title="Cost Per Click"
                value={formatCurrency(data.marketing.averageCpc)}
                icon={FiTarget}
                color="#f59e0b"
              />
              <StatCard
                title="Click-Through Rate"
                value={formatPercentage(data.marketing.averageCtr)}
                icon={FiActivity}
                color="#6366f1"
              />
            </StatsGrid>

            {/* Performance Metrics */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Performance Insights</h3>
              <StatsGrid style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <StatCard
                  title="Cost Per Purchase"
                  value={formatCurrency(data.marketing.performanceMetrics.costPerPurchase)}
                  icon={FiTarget}
                  color="#ef4444"
                />
                <StatCard
                  title="Conversion Rate"
                  value={formatPercentage(data.marketing.performanceMetrics.conversionRate)}
                  icon={FiPercent}
                  color="#10b981"
                />
                <StatCard
                  title="Profit from Ads"
                  value={formatCurrency(data.marketing.performanceMetrics.profitFromAds)}
                  icon={FiTrendingUp}
                  color={data.marketing.performanceMetrics.profitFromAds > 0 ? "#059669" : "#dc2626"}
                />
              </StatsGrid>
            </div>



            {/* No Campaigns Found Message */}
            {(!data.marketing.campaigns || data.marketing.campaigns.length === 0) && (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem 2rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginTop: '2rem'
              }}>
                <FiBarChart2 size={48} style={{ color: '#6c757d', marginBottom: '1rem' }} />
                <h3 style={{ color: '#6c757d', marginBottom: '0.5rem' }}>No Campaign Data Available</h3>
                <p style={{ color: '#6c757d', margin: '0' }}>
                  No Meta Ads campaigns found for the keyword "{data.marketing.keyword}" or the keyword is not configured for marketing campaigns.
                </p>
              </div>
            )}
          </BackgroundSection>

          {/* Variants Summary */}
          <BackgroundSection>
            <h2>Variants Performance Analysis</h2>
            
            {/* Variants Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ECDC4' }}>
                  {safeNumberFormat(data.variantInsights.length)}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Variants</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FF6B6B' }}>
                  {safeDisplayValue(data.variantInsights[0]?.variant_name)}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Top Performing</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#45B7D1' }}>
                  {formatCurrency(Math.round(data.variantInsights.reduce((sum, variant) => sum + parseFloat(variant.total_sales_amount), 0) / data.variantInsights.length))}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Avg Revenue/Variant</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#96CEB4' }}>
                  {safeNumberFormat(Math.round(data.variantInsights.reduce((sum, variant) => sum + parseInt(variant.total_units_sold), 0) / data.variantInsights.length))}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Avg Units/Variant</div>
              </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Units Sold Distribution */}
              <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Units Sold Distribution</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.variantInsights.map(variant => ({
                          name: variant.variant_title,
                          value: parseInt(variant.total_units_sold),
                          percentage: parseFloat(variant.units_sold_percentage)
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                      >
                        {data.variantInsights.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Units Sold']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Distribution */}
              <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Revenue Distribution</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.variantInsights.map(variant => ({
                        name: variant.variant_title,
                        revenue: parseFloat(variant.total_sales_amount),
                        units: parseInt(variant.total_units_sold)
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value) : value.toLocaleString(),
                        name === 'revenue' ? 'Revenue' : 'Units'
                      ]} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>



            {/* Detailed Variants Table */}
            <div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Detailed Variant Analysis</h3>
              <VariantsTable>
                <thead>
                  <tr>
                    <th>Variant</th>
                    <th>Units Sold</th>
                    <th>Market Share</th>
                    <th>Total Revenue</th>
                    <th>Avg Price per Unit</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.variantInsights.map((variant, index) => {
                    const avgPrice = parseFloat(variant.total_sales_amount) / parseInt(variant.total_units_sold);
                    const totalUnits = data.variantInsights.reduce((sum, v) => sum + parseInt(v.total_units_sold), 0);
                    const performance = parseFloat(variant.units_sold_percentage);
                    
                    return (
                      <tr key={index}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div 
                              style={{ 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%', 
                                backgroundColor: COLORS[index % COLORS.length] 
                              }}
                            ></div>
                            <strong>{safeDisplayValue(variant.variant_name)}</strong>
                          </div>
                        </td>
                        <td>{safeNumberFormat(parseInt(variant.total_units_sold))}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ 
                              width: '60px', 
                              height: '8px', 
                              backgroundColor: '#e0e0e0', 
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                width: `${performance}%`, 
                                height: '100%', 
                                backgroundColor: COLORS[index % COLORS.length],
                                borderRadius: '4px'
                              }}></div>
                            </div>
                            <span>{formatPercentage(performance)}</span>
                          </div>
                        </td>
                        <td>{formatCurrency(parseFloat(variant.total_sales_amount))}</td>
                        <td>{formatCurrency(avgPrice)}</td>
                        <td>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '12px', 
                            fontSize: '0.8rem',
                            backgroundColor: performance > 20 ? '#d4edda' : performance > 10 ? '#fff3cd' : '#f8d7da',
                            color: performance > 20 ? '#155724' : performance > 10 ? '#856404' : '#721c24'
                          }}>
                            {performance > 20 ? 'Excellent' : performance > 10 ? 'Good' : 'Average'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </VariantsTable>
            </div>
          </BackgroundSection>

            {/* Customer Insights */}
            <BackgroundSection>
            <h2>Customer Insights</h2>
            
            {/* Customer Overview Stats */}
            <StatsGrid>
              <StatCard
                title="Total Customers"
                value={safeNumberFormat(data.customerInsights.totalCustomers)}
                icon={FiUsers}
                color="#3b82f6"
                change={12.5}
              />
              <StatCard
                title="Repeat Customers"
                value={safeNumberFormat(data.customerInsights.repeatCustomers)}
                icon={FiUsers}
                color="#3b82f6"
                change={8.3}
              />
              <StatCard
                title="Repeat Customer Rate"
                value={data?.customerInsights?.repeatCustomerRate?.toFixed(2)}
                icon={FiPercent}
                color="#dc2626"
                change={1.2}
              />
              <StatCard
                title="Avg. Orders per Customer"
                value={data?.customerInsights?.avgOrdersPerCustomer?.toFixed(2)}
                icon={FiUsers}
                color="#3b82f6"
                change={5.1}
              />
              <StatCard
                title="Customer Acquisition Cost"
                value={formatCurrency(data.customerInsights.customerAcquisitionCost)}
                icon={FiCreditCard}
                color="#ef4444"
              />
            </StatsGrid>

            {/* Customer Breakdown Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
              {/* Customer Type Distribution */}
              <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Customer Type Distribution</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'First-time Customers', value: data.customerInsights.firstTimeCustomers}, // TODO: Replace with actual data
                          { name: 'Repeat Customers', value: data.customerInsights.repeatCustomers} // TODO: Replace with actual data
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill="#FF6B6B" />
                        <Cell fill="#4ECDC4" />
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Customer Segments by Value */}
              <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Customer Segments by Value</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { segment: 'High Value', customers: data.customerInsights.highValueCustomers.customerCount, percentage: data.customerInsights.highValueCustomers.customerPercentage }, // TODO: Replace with actual data
                        { segment: 'Medium Value', customers: data.customerInsights.mediumValueCustomers.customerCount, percentage: data.customerInsights.mediumValueCustomers.customerPercentage }, // TODO: Replace with actual data
                        { segment: 'Low Value', customers: data.customerInsights.lowValueCustomers.customerCount, percentage: data.customerInsights.lowValueCustomers.customerPercentage } // TODO: Replace with actual data
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segment" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'customers' ? value.toLocaleString() : `${value}%`,
                        name === 'customers' ? 'Customers' : 'Percentage'
                      ]} />
                      <Legend />
                      <Bar dataKey="customers" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Customer Order Frequency Chart */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Customer Order Frequency</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: '1 Order', customers: parseInt(data.customerInsights.frequencyDistribution.oneOrderCustomers.customerCount || '0') },
                      { name: '2 Orders', customers: parseInt(data.customerInsights.frequencyDistribution.twoOrdersCustomers.customerCount || '0') },
                      { name: '3 Orders', customers: parseInt(data.customerInsights.frequencyDistribution.threeOrdersCustomers.customerCount || '0') },
                      { name: '4+ Orders', customers: parseInt(data.customerInsights.frequencyDistribution.fourOrdersCustomers.customerCount || '0') },
                    ]}
                    margin={{
                      top: 20, right: 30, left: 20, bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Customers']} />
                    <Legend />
                    <Bar dataKey="customers" fill="#4ECDC4" name="Number of Customers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </BackgroundSection>


          
          
        </>
      )}
    </PageContainer>
  );
};

export default ProductDetailsPage;
