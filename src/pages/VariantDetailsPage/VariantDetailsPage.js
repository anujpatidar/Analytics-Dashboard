import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
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
  ResponsiveContainer
} from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
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
  FiDownload,
  FiArrowLeft
} from 'react-icons/fi';

import { formatCurrency } from '../../utils/formatters';

// Reuse styled components from ProductDetailsPage
const ModernContainer = styled.div`
  min-height: 100vh;
  padding: 1rem 0 1rem 1rem;
  background: #f8fafc;
  
  @media (max-width: 768px) {
    padding: 0.5rem 0 0.5rem 0.5rem;
  }
`;

const ModernContent = styled.div`
  width: 100%;
  margin: 0;
`;

const ModernHeaderSection = styled.div`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1000;
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    margin-bottom: 0.75rem;
  }
`;

const ModernHeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const ModernHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const ModernHeaderTitle = styled.div`
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
    line-height: 1.2;
  }
  
  p {
    color: #64748b;
    margin: 0;
    font-size: 0.75rem;
    margin-top: 0.125rem;
  }
  
  @media (max-width: 768px) {
    h1 {
      font-size: 1.25rem;
    }
    p {
      font-size: 0.7rem;
    }
  }
`;

const ModernActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: rgba(255, 255, 255, 0.9);
    color: #64748b;
    border: 1px solid rgba(0, 0, 0, 0.1);
    
    &:hover {
      background: white;
      color: #1e293b;
      border-color: rgba(102, 126, 234, 0.3);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const SectionCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    margin-bottom: 0.25rem;
  }
  
  p {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0;
  }
`;

const SectionContent = styled.div`
  padding: 1.5rem 2rem 2rem;
`;

const CompactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(6, 1fr);
  }
  
  @media (min-width: 768px) and (max-width: 1199px) {
    grid-template-columns: repeat(4, 1fr);
  }
  
  @media (max-width: 767px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MiniMetricCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  
  .metric-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .metric-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }
  
  .metric-change {
    font-size: 0.625rem;
    font-weight: 500;
    color: #64748b;
  }
`;

// Helper functions
const safeDisplayValue = (value, fallback = 'N/A', formatter = null) => {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
    return fallback;
  }
  if (formatter && typeof formatter === 'function') {
    return formatter(value);
  }
  return value;
};

const safePercentageFormat = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
    return fallback;
  }
  return `${parseFloat(value).toFixed(2)}%`;
};

const safeNumberFormat = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
    return fallback;
  }
  return parseInt(value).toLocaleString();
};

const formatPercentageValue = (value) => {
  if (value === undefined || value === null) return 'N/A';
  if (typeof value === 'number') {
    return `${value.toFixed(2)}%`;
  }
  return `${value}%`;
};

const ModernMetricCard = ({ title, value, icon: Icon, change, changeType, color = '#667eea', loading }) => (
  <MiniMetricCard>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <div className="metric-label">{title}</div>
      {Icon && (
        <div 
          className="metric-icon-container"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${color}15, ${color}25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            boxShadow: `0 2px 8px ${color}20`
          }}
        >
          <Icon size={18} />
        </div>
      )}
    </div>
    <div className="metric-value">{loading ? '...' : value}</div>
    <div className="metric-change" style={{ 
      color: changeType === 'increase' ? '#059669' : changeType === 'decrease' ? '#dc2626' : '#64748b' 
    }}>
      {change}
    </div>
  </MiniMetricCard>
);

const VariantDetailsPage = () => {
  const { productId, variantName } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date filter state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchVariantData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For now, we'll create mock data. In production, you'd call an API endpoint like:
      // const response = await fetch(`/api/v1/variants/${productId}/${variantName}?startDate=${startDate}&endDate=${endDate}`);
      
      // Mock variant data
      setTimeout(() => {
        const mockData = {
          variant: {
            id: variantName,
            name: decodeURIComponent(variantName),
            productName: 'Premium Wireless Headphones',
            sku: 'PH-001-BLK',
            price: 12999,
            image: 'https://cdn.shopify.com/s/files/1/0553/0419/2034/files/products_4july-03_803b519a-125c-458b-bfab-15f0d0009fb1.jpg?v=1720861559&width=648'
          },
          overview: {
            totalOrders: 450,
            totalSales: 5850000,
            aov: 13000,
            quantitySold: 450,
            grossProfit: 2340000,
            profitMargin: 40,
            refundRate: 3.2,
            totalReturns: 187200,
            totalTax: 526500,
            cogs: 3600000,
            sdCost: 292500
          },
          customerInsights: {
            totalCustomers: 380,
            repeatCustomers: 76,
            repeatCustomerRate: 20,
            avgOrdersPerCustomer: 1.18,
            customerAcquisitionCost: 650
          },
          charts: {
            salesTrend: [
              { date: 'Jan', sales: 800000 },
              { date: 'Feb', sales: 950000 },
              { date: 'Mar', sales: 1100000 },
              { date: 'Apr', sales: 980000 },
              { date: 'May', sales: 1200000 },
              { date: 'Jun', sales: 820000 }
            ]
          }
        };
        setData(mockData);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching variant data:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVariantData();
  }, [productId, variantName, startDate, endDate]);

  const handleBackToProduct = () => {
    navigate(`/products/${productId}`);
  };

  if (isLoading) {
    return (
      <ModernContainer>
        <ModernContent>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <FiRefreshCw size={48} className="spin" style={{ color: '#667eea', marginBottom: '1rem' }} />
              <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Loading Variant Data</h2>
              <p style={{ color: '#64748b' }}>Please wait while we fetch the analytics...</p>
            </div>
          </div>
        </ModernContent>
      </ModernContainer>
    );
  }

  if (error || !data) {
    return (
      <ModernContainer>
        <ModernContent>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
              <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Unable to Load Data</h2>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>{error || 'Variant data not found'}</p>
              <ModernActionButton className="primary" onClick={fetchVariantData}>
                <FiRefreshCw />
                Try Again
              </ModernActionButton>
            </div>
          </div>
        </ModernContent>
      </ModernContainer>
    );
  }

  return (
    <ModernContainer>
      <ModernContent>
        {/* Modern Header */}
        <ModernHeaderSection>
          <ModernHeaderContent>
            <ModernHeaderLeft>
              <img 
                src={data.variant.image} 
                alt={data.variant.name}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}
              />
              <ModernHeaderTitle>
                <h1>{data.variant.name}</h1>
                <p>SKU: {data.variant.sku} • Variant analytics for {data.variant.productName}</p>
              </ModernHeaderTitle>
            </ModernHeaderLeft>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <ModernActionButton 
                className="secondary" 
                onClick={handleBackToProduct}
              >
                <FiArrowLeft />
                Back to Product
              </ModernActionButton>
              <ModernActionButton 
                className="secondary" 
                onClick={fetchVariantData}
                disabled={isLoading}
              >
                <FiRefreshCw className={isLoading ? 'spin' : ''} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </ModernActionButton>
              <ModernActionButton className="primary">
                <FiDownload />
                Export
              </ModernActionButton>
            </div>
          </ModernHeaderContent>
        </ModernHeaderSection>

        {/* Sales Metrics Section */}
        <SectionCard>
          <SectionHeader>
            <h2>Sales Metrics</h2>
            <p>Revenue and sales performance for this variant</p>
          </SectionHeader>
          <SectionContent>
            <CompactGrid>
              <ModernMetricCard
                title="Total Sales"
                value={formatCurrency(data.overview.totalSales)}
                icon={FiDollarSign}
                color="#10b981"
              />
              <ModernMetricCard
                title="Total Orders"
                value={safeNumberFormat(data.overview.totalOrders)}
                icon={FiShoppingCart}
                color="#3b82f6"
              />
              <ModernMetricCard
                title="AOV"
                value={formatCurrency(data.overview.aov)}
                icon={FiCreditCard}
                color="#8b5cf6"
              />
              <ModernMetricCard
                title="Units Sold"
                value={safeNumberFormat(data.overview.quantitySold)}
                icon={FiPackage}
                color="#f59e0b"
              />
              <ModernMetricCard
                title="Gross Profit"
                value={formatCurrency(data.overview.grossProfit)}
                icon={FiTrendingUp}
                color="#059669"
              />
              <ModernMetricCard
                title="Profit Margin"
                value={formatPercentageValue(data.overview.profitMargin)}
                icon={FiPercent}
                color="#dc2626"
              />
            </CompactGrid>
          </SectionContent>
        </SectionCard>

        {/* Returns & Tax Section */}
        <SectionCard>
          <SectionHeader>
            <h2>Returns & Tax Analysis</h2>
            <p>Return rates and tax calculations for this variant</p>
          </SectionHeader>
          <SectionContent>
            <CompactGrid>
              <ModernMetricCard
                title="Total Returns"
                value={formatCurrency(data.overview.totalReturns)}
                icon={FiTrendingDown}
                color="#ef4444"
              />
              <ModernMetricCard
                title="Return Rate"
                value={formatPercentageValue(data.overview.refundRate)}
                icon={FiPercent}
                color="#f59e0b"
              />
              <ModernMetricCard
                title="Total Tax"
                value={formatCurrency(data.overview.totalTax)}
                icon={FiDollarSign}
                color="#6b7280"
              />
              <ModernMetricCard
                title="COGS"
                value={formatCurrency(data.overview.cogs)}
                icon={FiPackage}
                color="#8b5cf6"
              />
              <ModernMetricCard
                title="S&D Cost"
                value={formatCurrency(data.overview.sdCost)}
                icon={FiTarget}
                color="#06b6d4"
              />
            </CompactGrid>
          </SectionContent>
        </SectionCard>

        {/* Customer Insights Section */}
        <SectionCard>
          <SectionHeader>
            <h2>Customer Insights</h2>
            <p>Customer behavior and acquisition metrics for this variant</p>
          </SectionHeader>
          <SectionContent>
            <CompactGrid>
              <ModernMetricCard
                title="Total Customers"
                value={safeNumberFormat(data.customerInsights.totalCustomers)}
                icon={FiUsers}
                color="#3b82f6"
              />
              <ModernMetricCard
                title="Repeat Customers"
                value={safeNumberFormat(data.customerInsights.repeatCustomers)}
                icon={FiUsers}
                color="#10b981"
              />
              <ModernMetricCard
                title="Repeat Rate"
                value={formatPercentageValue(data.customerInsights.repeatCustomerRate)}
                icon={FiPercent}
                color="#8b5cf6"
              />
              <ModernMetricCard
                title="Avg Orders/Customer"
                value={data.customerInsights.avgOrdersPerCustomer.toFixed(2)}
                icon={FiShoppingCart}
                color="#f59e0b"
              />
              <ModernMetricCard
                title="Acquisition Cost"
                value={formatCurrency(data.customerInsights.customerAcquisitionCost)}
                icon={FiCreditCard}
                color="#ef4444"
              />
            </CompactGrid>
          </SectionContent>
        </SectionCard>

        {/* Sales Trend Chart */}
        <SectionCard>
          <SectionHeader>
            <h2>Sales Trend</h2>
            <p>Monthly sales performance trend for this variant</p>
          </SectionHeader>
          <SectionContent>
            <div style={{ 
              height: '400px',
              background: 'rgba(248, 250, 252, 0.5)',
              borderRadius: '16px',
              padding: '1rem',
              border: '1px solid rgba(226, 232, 240, 0.5)'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Sales']}
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{
                      fontSize: '0.875rem',
                      color: '#64748b'
                    }}
                  />
                  <Bar 
                    dataKey="sales" 
                    fill="url(#salesGradient)" 
                    name="Sales"
                    radius={[8, 8, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionContent>
        </SectionCard>
      </ModernContent>
    </ModernContainer>
  );
};

export default VariantDetailsPage; 