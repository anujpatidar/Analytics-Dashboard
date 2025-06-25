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
  FiDownload
} from 'react-icons/fi';

import { formatCurrency } from '../../utils/formatters';
import { getAmazonProductMetrics } from '../../api/amazonAPI';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ProductImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
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

// Modern Dashboard Container - matching DashboardPage design
const ModernContainer = styled.div`
  min-height: 100vh;
  padding: 1rem 0 1rem 1rem; /* Remove right padding, keep left, top, bottom */
  background: #f8fafc;
  
  @media (max-width: 768px) {
    padding: 0.5rem 0 0.5rem 0.5rem; /* Remove right padding on mobile too */
  }
`;

const ModernContent = styled.div`
  width: 100%; /* Use full available width instead of max-width constraint */
  margin: 0;
`;

// Modern Header Section
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

const ModernStatsQuickView = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 968px) {
    display: none;
  }
`;

const ModernQuickStat = styled.div`
  text-align: center;
  padding: 0.5rem 0.75rem;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 8px;
  min-width: 80px;
  
  .label {
    font-size: 0.625rem;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }
  
  .value {
    font-size: 0.875rem;
    font-weight: 700;
    color: #1e293b;
  }
`;

const ModernHeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
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

const ModernDateControlsSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  
  .date-control-header {
  display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
  
  .date-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    .icon-wrapper {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(102, 126, 234, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
    }
    
    .date-text {
      h3 {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }
      
      p {
        font-size: 0.75rem;
        color: #64748b;
        margin: 0;
      }
    }
  }
  
  .date-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    @media (max-width: 768px) {
  flex-wrap: wrap;
      justify-content: center;
    }
  }
`;

const ModernQuickDateButtons = styled.div`
  display: flex;
  gap: 0.375rem;
  margin-left: 0.75rem;
  
  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const ModernQuickDateButton = styled.button`
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 600;
  border: 1px solid rgba(102, 126, 234, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.9)'};
  color: ${props => props.active ? 'white' : '#667eea'};
  
  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#667eea'};
    color: white;
    border-color: #667eea;
  }
`;

// Section Cards - matching dashboard design
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

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
`;

const SectionDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
`;

const SectionContent = styled.div`
  padding: 1.5rem 2rem 2rem;
`;

// Responsive Metrics Grid for more compact layout
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

// Helper functions for formatting values
const formatMetricValue = (value, formatter = formatCurrency) => {
  if (value === undefined || value === null) return 'NA';
    return formatter(value);
};

const formatPercentageValue = (value) => {
  if (value === undefined || value === null) return 'NA';
  if (typeof value === 'number') {
    return `${value.toFixed(2)}%`;
  }
  return `${value}%`;
};

// Create a modern compact metric component with icons - matching dashboard
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

// Add CSS for animations
const GlobalStyles = `
  .spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Modern Tab System - matching DashboardPage exactly
const ModernTabContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  position: relative;
  z-index: 100;
`;

const ModernTabHeader = styled.div`
  display: flex;
  background: rgba(248, 250, 252, 0.8);
  padding: 0.5rem;
  border-radius: 16px 16px 0 0;
`;

const ModernTabButton = styled.button`
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  
  ${props => props.active ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    transform: translateY(-2px);
  ` : `
    background: transparent;
    color: #64748b;
  
  &:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #475569;
    }
  `}
  
  .icon {
    font-size: 1.25rem;
  }
`;

const ModernTabContent = styled.div`
  padding: 2rem;
`;

const ProductDetailsPage = () => {
  // Inject CSS styles for animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GlobalStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const { productId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [amazonData, setAmazonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAmazonLoading, setIsAmazonLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amazonError, setAmazonError] = useState(null);
  
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

  // Add marketplace tab state - matching dashboard exactly
  const [activeTab, setActiveTab] = useState('overall');

  const quickDateFilters = [
    { label: '7D', value: '7d', days: 7 },
    { label: '30D', value: '30d', days: 30 },
    { label: '3M', value: '3m', days: 90 },
    { label: '6M', value: '6m', days: 180 },
    { label: '1Y', value: '1y', days: 365 }
  ];

  // Tab configuration - exactly matching dashboard
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
      console.log('Myfrido data:', result.data);
    } catch (error) {
      console.error('Error fetching product data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAmazonData = async () => {
    if (!data || !data.product || !data.product.sku) {
      console.log('Cannot fetch Amazon data: No SKU available');
      setIsAmazonLoading(false);
      return;
    }

    try {
      setIsAmazonLoading(true);
      setAmazonError(null);
      
      console.log('Fetching Amazon data for SKU:', data.product.sku);
      
      const result = await getAmazonProductMetrics(
        data.product.sku,
        startDate,
        endDate,
        'amazon'
      );
      
      setAmazonData(result.data);
      console.log('Amazon data:', result.data);
    } catch (error) {
      console.error('Error fetching Amazon data:', error);
      setAmazonError(error.message);
    } finally {
      setIsAmazonLoading(false);
    }
  };

  // Function to combine Myfrido and Amazon data for the Overall tab
  const getCombinedData = () => {
    if (!data) return null;
    
    const myfridoData = data;
    const amazonOverview = amazonData?.overview || {};
    
    // Combine financial metrics
    const combinedOverview = {
      totalOrders: (myfridoData.overview.totalOrders || 0) + (amazonOverview.totalOrders || 0),
      totalSales: (myfridoData.overview.totalSales || 0) + (amazonOverview.totalSales || 0),
      grossSales: (myfridoData.overview.grossSales || myfridoData.overview.totalSales || 0) + (amazonOverview.grossSales || amazonOverview.totalSales || 0),
      netSales: (myfridoData.overview.netSales || myfridoData.overview.totalSales || 0) + (amazonOverview.netSales || 0),
      nSales: (myfridoData.overview.netSales || myfridoData.overview.totalSales || 0) + (amazonOverview.netSales || 0) - (myfridoData.overview.cogs || 0) - (amazonOverview.cogs || 0) - (myfridoData.overview.sdCost || 0) - (amazonOverview.sdCost || 0),
      totalQuantitySold: (myfridoData.overview.totalQuantitySold || 0) + (amazonOverview.totalQuantitySold || 0),
      netQuantitySold: (myfridoData.overview.netQuantitySold || 0) + (amazonOverview.netQuantitySold || 0),
      totalReturnsQuantity: (myfridoData.overview.totalReturnsQuantity || 0) + (amazonOverview.totalReturnsQuantity || 0),
      totalReturns: (myfridoData.overview.totalReturns || 0) + (amazonOverview.totalReturns || 0),
      totalTax: (myfridoData.overview.totalTax || 0) + (amazonOverview.totalTax || 0),
      cogs: (myfridoData.overview.cogs || 0) + (amazonOverview.cogs || 0),
      sdCost: (myfridoData.overview.sdCost || 0) + (amazonOverview.sdCost || 0),
      marketingSpend: (myfridoData.overview.marketingSpend || 0) + (amazonOverview.marketingSpend || 0)
    };

    // Calculate derived metrics
    const combinedTotalSales = combinedOverview.totalSales;
    const combinedTotalOrders = combinedOverview.totalOrders;
    const combinedTotalQuantity = combinedOverview.totalQuantitySold;
    
    combinedOverview.aov = combinedTotalOrders > 0 ? combinedTotalSales / combinedTotalOrders : 0;
    combinedOverview.netOrders = combinedTotalOrders - (amazonOverview.cancelledItems || 0);
    combinedOverview.grossSalePercentage = combinedTotalSales > 0 ? (combinedOverview.grossSales / combinedTotalSales) * 100 : 100;
    combinedOverview.netSalePercentage = combinedTotalSales > 0 ? (combinedOverview.netSales / combinedTotalSales) * 100 : 100;
    combinedOverview.totalReturnPercentage = combinedTotalQuantity > 0 ? (combinedOverview.totalReturnsQuantity / combinedTotalQuantity) * 100 : 0;
    combinedOverview.taxRate = combinedTotalSales > 0 ? (combinedOverview.totalTax / combinedTotalSales) * 100 : 0;
    combinedOverview.cogsPercentage = combinedTotalSales > 0 ? (combinedOverview.cogs / combinedTotalSales) * 100 : 0;
    combinedOverview.sdCostPercentage = combinedTotalSales > 0 ? (combinedOverview.sdCost / combinedTotalSales) * 100 : 0;
    
    combinedOverview.grossRoas = combinedOverview.marketingSpend > 0 ? combinedTotalSales / combinedOverview.marketingSpend : 0;
    combinedOverview.netRoas = combinedOverview.marketingSpend > 0 ? combinedOverview.netSales / combinedOverview.marketingSpend : 0;
    combinedOverview.nRoas = combinedOverview.marketingSpend > 0 ? combinedOverview.nSales / combinedOverview.marketingSpend : 0;

    combinedOverview.grossMer = combinedOverview.totalSales > 0 ? (combinedOverview.marketingSpend / combinedOverview.totalSales) * 100 : 0;
    combinedOverview.netMer = combinedOverview.netSales > 0 ? (combinedOverview.marketingSpend / combinedOverview.netSales) * 100 : 0;
    combinedOverview.nMer = combinedOverview.nSales > 0 ? (combinedOverview.marketingSpend / combinedOverview.nSales) * 100 : 0;

    combinedOverview.cm2 = combinedOverview.totalSales - combinedOverview.cogs - combinedOverview.marketingSpend;
    combinedOverview.cm2Percentage = combinedOverview.totalSales > 0 ? (combinedOverview.cm2 / combinedOverview.totalSales) * 100 : 0;
    combinedOverview.cm3 = combinedOverview.totalSales - combinedOverview.cogs - combinedOverview.sdCost - combinedOverview.marketingSpend;
    combinedOverview.cm3Percentage = combinedOverview.totalSales > 0 ? (combinedOverview.cm3 / combinedOverview.totalSales) * 100 : 0;

    
    // Use existing change percentages from Myfrido (placeholder values)
    Object.keys(myfridoData.overview).forEach(key => {
      if (key.includes('ChangePercentage') || key.includes('Change')) {
        combinedOverview[key] = myfridoData.overview[key] || 0;
      }
    });

    // Combine marketing data
    const combinedMarketing = {
      adSpend: (myfridoData.marketing?.adSpend || 0) + (amazonData?.marketing?.adSpend || 0),
      impressions: (myfridoData.marketing?.impressions || 0) + (amazonData?.marketing?.impressions || 0),
      clicks: (myfridoData.marketing?.clicks || 0) + (amazonData?.marketing?.clicks || 0),
      purchases: (myfridoData.marketing?.purchases || 0) + (amazonData?.marketing?.purchases || 0),
      purchaseValue: (myfridoData.marketing?.purchaseValue || 0) + (amazonData?.marketing?.purchaseValue || 0),
      targetingKeyword: 'Combined Multi-Channel Campaign'
    };

   
    // Combine customer data
    const combinedCustomers = {
      totalCustomers: (myfridoData.customers?.totalCustomers || 0) + (amazonData?.customers?.totalCustomers || 0),
      repeatCustomers: (myfridoData.customers?.repeatCustomers || 0) + (amazonData?.customers?.repeatCustomers || 0),
      avgOrdersPerCustomer: (combinedOverview.totalOrders / combinedOverview.totalCustomers) || 0, // Placeholder
      acquisitionCost: (myfridoData.customers?.acquisitionCost || 0) + (amazonData?.customers?.acquisitionCost || 0)
    };

    combinedCustomers.repeatRate = combinedCustomers.totalCustomers > 0 ? 
      (combinedCustomers.repeatCustomers / combinedCustomers.totalCustomers) * 100 : 0;

    // Combine variants data by SKU
    const combinedVariants = [];
    const variantMap = new Map();
    
    // Add MyFrido variants first
    if (myfridoData.variantInsights && Array.isArray(myfridoData.variantInsights)) {
      myfridoData.variantInsights.forEach(variant => {
        const sku = variant.sku || variant.variant_sku;
        if (sku) {
          variantMap.set(sku.toLowerCase(), {
            name: variant.name || variant.variant_name || 'Unknown Variant',
            sku: sku,
            // MyFrido data
            myfridoUnitsSold: parseInt(variant.soldCount || variant.total_units_sold) || 0,
            myfridoRevenue: parseFloat(variant.salesAmount || variant.total_sales_amount) || 0,
            myfridoOrders: parseInt(variant.soldCount || variant.total_units_sold) || 0, // Approximation
            // Combined totals (start with MyFrido)
            unitsSold: parseInt(variant.soldCount || variant.total_units_sold) || 0,
            revenue: parseFloat(variant.salesAmount || variant.total_sales_amount) || 0,
            orders: parseInt(variant.soldCount || variant.total_units_sold) || 0, // Approximation
            // Amazon data (default to 0)
            amazonUnitsSold: 0,
            amazonRevenue: 0,
            amazonOrders: 0,
            returnQuantity: 0,
            returnRate: 0,
            asin: 'N/A'
          });
        }
      });
    }
    
    // Add/merge Amazon variants
    if (amazonData?.variants && Array.isArray(amazonData.variants)) {
      amazonData.variants.forEach(variant => {
        const sku = variant.sku;
        if (sku) {
          const existing = variantMap.get(sku.toLowerCase());
          if (existing) {
            // Merge with existing MyFrido data
            existing.amazonUnitsSold = parseInt(variant.unitsSold) || 0;
            existing.amazonRevenue = parseFloat(variant.revenue) || 0;
            existing.amazonOrders = parseInt(variant.orders) || 0;
            existing.returnQuantity = parseFloat(variant.returnQuantity) || 0;
            existing.returnRate = parseFloat(variant.returnRate) || 0;
            existing.asin = variant.asin || 'N/A';
            // Update combined totals
            existing.unitsSold = existing.myfridoUnitsSold + existing.amazonUnitsSold;
            existing.revenue = existing.myfridoRevenue + existing.amazonRevenue;
            existing.orders = existing.myfridoOrders + existing.amazonOrders;
          } else {
            // Add new Amazon-only variant
            variantMap.set(sku.toLowerCase(), {
              name: variant.name || 'Unknown Variant',
              sku: sku,
              // Amazon data
              amazonUnitsSold: parseInt(variant.unitsSold) || 0,
              amazonRevenue: parseFloat(variant.revenue) || 0,
              amazonOrders: parseInt(variant.orders) || 0,
              returnQuantity: parseFloat(variant.returnQuantity) || 0,
              returnRate: parseFloat(variant.returnRate) || 0,
              asin: variant.asin || 'N/A',
              // MyFrido data (default to 0)
              myfridoUnitsSold: 0,
              myfridoRevenue: 0,
              myfridoOrders: 0,
              // Combined totals
              unitsSold: parseInt(variant.unitsSold) || 0,
              revenue: parseFloat(variant.revenue) || 0,
              orders: parseInt(variant.orders) || 0
            });
          }
        }
      });
    }
    
    // Convert map to array and calculate additional metrics
    Array.from(variantMap.values()).forEach((variant, index) => {
      variant.avgPrice = variant.unitsSold > 0 ? variant.revenue / variant.unitsSold : 0;
      // Determine performance based on combined revenue
      if (index === 0) variant.performance = 'Top Performer';
      else if (index === 1) variant.performance = 'Good';
      else if (variant.revenue < (combinedTotalSales * 0.1)) variant.performance = 'Low';
      else variant.performance = 'Average';
      
      combinedVariants.push(variant);
    });
    
    // Sort by combined revenue (descending)
    combinedVariants.sort((a, b) => b.revenue - a.revenue);

    return {
      product: myfridoData.product,
      overview: combinedOverview,
      marketing: combinedMarketing,
      customers: combinedCustomers,
      variants: combinedVariants,
      charts: myfridoData.charts // Use Myfrido charts as base
    };
  };

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  // Fetch Amazon data after Myfrido data is loaded
  useEffect(() => {
    if (data && data.product && data.product.sku) {
      fetchAmazonData();
    }
  }, [data, startDate, endDate]);

  const handleApplyFilter = () => {
    setActiveQuickFilter(''); // Clear quick filter selection when using custom dates
    fetchProductData();
    // Amazon data will be fetched automatically via useEffect after Myfrido data is loaded
  };

  // Handle variant click navigation
  const handleVariantClick = (variantName) => {
    // URL encode the variant name to handle spaces and special characters
    const encodedVariantName = encodeURIComponent(variantName);
    navigate(`/products/${productId}/${encodedVariantName}`);
  };

  // Custom date formatting function
  const formatDateForDisplay = (date) => {
    // Handle both string and Date inputs
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
              <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Loading Product Data</h2>
              <p style={{ color: '#64748b' }}>Please wait while we fetch the analytics...</p>
              {isAmazonLoading && (
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Also fetching Amazon data...
                </p>
              )}
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
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>{error || 'Product data not found'}</p>
              <ModernActionButton className="primary" onClick={fetchProductData}>
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
        <ProductImage src={data.product.image} alt={data.product.name} />
              <ModernHeaderTitle>
          <h1>{data.product.name}</h1>
                <p>SKU: {data.product.sku} • Detailed product analytics and insights</p>
              </ModernHeaderTitle>
              
              <ModernStatsQuickView>
                <ModernQuickStat>
              <div className="label">Price</div>
              <div className="value">{formatCurrency(data.product.price)}</div>
                </ModernQuickStat>
                <ModernQuickStat>
                  <div className="label">Orders</div>
                  <div className="value">{data.overview.totalOrders || 0}</div>
                </ModernQuickStat>
                <ModernQuickStat>
                  <div className="label">Profit</div>
                  <div className="value">{formatPercentage(data.overview.profitMargin)}%</div>
                </ModernQuickStat>
              </ModernStatsQuickView>
            </ModernHeaderLeft>
            
            <ModernHeaderActions>
              <ModernActionButton 
                className="secondary" 
                onClick={handleApplyFilter}
                disabled={isLoading}
              >
                <FiRefreshCw className={isLoading ? 'spin' : ''} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </ModernActionButton>
              <ModernActionButton className="primary">
                <FiDownload />
                Export
              </ModernActionButton>
            </ModernHeaderActions>
          </ModernHeaderContent>

          {/* Modern Date Controls */}
          <ModernDateControlsSection>
            <div className="date-control-header">
              <div className="date-info">
                <div className="icon-wrapper">
                  <FiCalendar size={14} />
            </div>
                <div className="date-text">
                  <h3>Date Range</h3>
                  <p>{formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}</p>
            </div>
            </div>
              
              <div className="date-controls">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
                  style={{
                    padding: '0.375rem 0.5rem',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.9)'
                  }}
                />
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={new Date().toISOString().split('T')[0]}
                  style={{
                    padding: '0.375rem 0.5rem',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.9)'
                  }}
                />
                
                <ModernQuickDateButtons>
            {quickDateFilters.map((filter) => (
                    <ModernQuickDateButton
                key={filter.value}
                active={activeQuickFilter === filter.value}
                onClick={() => handleQuickDateFilter(filter.value, filter.days)}
              >
                {filter.label}
                    </ModernQuickDateButton>
            ))}
                </ModernQuickDateButtons>
        </div>
            </div>
          </ModernDateControlsSection>
        </ModernHeaderSection>

        {/* Modern Tab System - matching DashboardPage */}
        <ModernTabContainer>
          <ModernTabHeader>
          {tabs.map((tab) => (
              <ModernTabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            >
                <span className="icon">{tab.icon}</span>
                {tab.label}
              </ModernTabButton>
            ))}
          </ModernTabHeader>
          
                    <ModernTabContent>
                        {/* Overall Tab Content */}
            {activeTab === 'overall' && (
              <div>
                {(() => {
                  const combinedData = getCombinedData();
                  if (!combinedData) return <div>Loading combined data...</div>;

                  return (
                    <>
                      {/* Data Source Information */}
                      <div style={{ 
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '12px', 
                        padding: '1rem 1.5rem',
                        marginBottom: '1.5rem',
                        color: '#1e293b'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
                          <strong>Combined Data Sources</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
                          Showing combined analytics from Myfrido and Amazon. 
                          {!amazonData && ' (Amazon data unavailable - showing Myfrido only)'}
                          {amazonError && ` (Amazon error: ${amazonError})`}
                        </p>
                      </div>

                      {/* Sales Matrices Section */}
                      <SectionCard>
                        <SectionHeader>
                          <SectionTitle>
                            <FiDollarSign size={20} style={{ color: '#10b981' }} />
                            Overall Sales Metrics
                          </SectionTitle>
                          <SectionDescription>Combined sales performance across all channels</SectionDescription>
                        </SectionHeader>
                        <SectionContent>
                          <CompactGrid>
                            <ModernMetricCard
                              title="Total Sales"
                              value={formatCurrency(combinedData.overview.totalSales)}
                              icon={FiDollarSign}
                              change={combinedData.overview.revenueChangePercentage}
                              changeType="positive"
                              color="#10b981"
                            />
                            <ModernMetricCard
                              title="Gross Sales"
                              value={formatCurrency(combinedData.overview.grossSales)}
                              icon={FiTrendingUp}
                              change={combinedData.overview.grossSalesChangePercentage}
                              changeType="positive"
                              color="#3b82f6"
                            />
                            <ModernMetricCard
                              title="Net Sales"
                              value={formatCurrency(combinedData.overview.netSales)}
                              icon={FiBarChart2}
                              change={combinedData.overview.netSalesChangePercentage}
                              changeType="positive"
                              color="#8b5cf6"
                            />
                            <ModernMetricCard
                              title="AOV"
                              value={formatCurrency(combinedData.overview.aov)}
                              icon={FiShoppingCart}
                              change={combinedData.overview.aovChangePercentage}
                              changeType="positive"
                              color="#f59e0b"
                            />
                            <ModernMetricCard
                              title="Gross Sale %"
                              value={formatPercentageValue(combinedData.overview.grossSalePercentage)}
                              icon={FiPercent}
                              change="N/A"
                              changeType="info"
                              color="#ef4444"
                            />
                            <ModernMetricCard
                              title="Net Sale %"
                              value={formatPercentageValue(combinedData.overview.netSalePercentage)}
                              icon={FiTarget}
                              change="N/A"
                              changeType="info"
                              color="#84cc16"
                            />
                          </CompactGrid>
                        </SectionContent>
                      </SectionCard>

                      {/* Orders & Quantity Section */}
                      <SectionCard>
                        <SectionHeader>
                          <SectionTitle>
                            <FiPackage size={20} style={{ color: '#3b82f6' }} />
                            Overall Orders & Quantity
                          </SectionTitle>
                          <SectionDescription>Combined order volume and quantity performance metrics</SectionDescription>
                        </SectionHeader>
                        <SectionContent>
                          <CompactGrid>
                            <ModernMetricCard
                              title="Total Orders"
                              value={safeNumberFormat(combinedData.overview.totalOrders)}
                              icon={FiShoppingCart}
                              change={combinedData.overview.ordersChangePercentage}
                              changeType="positive"
                              color="#3b82f6"
                            />
                            <ModernMetricCard
                              title="Net Orders"
                              value={safeNumberFormat(combinedData.overview.netOrders)}
                              icon={FiActivity}
                              change="N/A"
                              changeType="info"
                              color="#10b981"
                            />
                            <ModernMetricCard
                              title="Units Sold"
                              value={safeNumberFormat(combinedData.overview.totalQuantitySold)}
                              icon={FiPackage}
                              change="N/A"
                              changeType="info"
                              color="#f59e0b"
                            />
                            <ModernMetricCard
                              title="Net Units"
                              value={safeNumberFormat(combinedData.overview.netQuantitySold)}
                              icon={FiTarget}
                              change="N/A"
                              changeType="info"
                              color="#8b5cf6"
                            />
                            <ModernMetricCard
                              title="Returned Units"
                              value={safeNumberFormat(combinedData.overview.totalReturnsQuantity)}
                              icon={FiTrendingDown}
                              change="N/A"
                              changeType="info"
                              color="#ef4444"
                            />
                          </CompactGrid>
                        </SectionContent>
                                              </SectionCard>

                      {/* Returns & Tax Section */}
                      <SectionCard>
                        <SectionHeader>
                          <SectionTitle>
                            <FiTrendingDown size={20} style={{ color: '#ef4444' }} />
                            Overall Returns & Tax
                          </SectionTitle>
                          <SectionDescription>Combined return analysis and tax calculations</SectionDescription>
                        </SectionHeader>
                        <SectionContent>
                          <CompactGrid>
                            <ModernMetricCard
                              title="Total Returns"
                              value={formatCurrency(combinedData.overview.totalReturns)}
                              icon={FiTrendingDown}
                              change={combinedData.overview.returnsChangePercentage}
                              changeType="negative"
                              color="#ef4444"
                            />
                            <ModernMetricCard
                              title="Return Rate"
                              value={formatPercentageValue(combinedData.overview.totalReturnPercentage)}
                              icon={FiPercent}
                              change="N/A"
                              changeType="info"
                              color="#f59e0b"
                            />
                            <ModernMetricCard
                              title="Total Tax"
                              value={formatCurrency(combinedData.overview.totalTax)}
                              icon={FiDollarSign}
                              change={combinedData.overview.taxChangePercentage}
                              changeType="neutral"
                              color="#6b7280"
                            />
                            <ModernMetricCard
                              title="Tax Rate"
                              value={`${combinedData.overview.taxRate.toFixed(1)}%`}
                              icon={FiPercent}
                              change="N/A"
                              changeType="info"
                              color="#84cc16"
                            />
                          </CompactGrid>
                        </SectionContent>
                      </SectionCard>

                      {/* Expenses & ROAS Section */}
                      <SectionCard>
                        <SectionHeader>
                          <SectionTitle>
                            <FiCreditCard size={20} style={{ color: '#8b5cf6' }} />
                            Overall Expenses & ROAS
                          </SectionTitle>
                          <SectionDescription>Combined cost analysis and return on ad spend calculations</SectionDescription>
                        </SectionHeader>
                        <SectionContent>
                          <CompactGrid>
                            <ModernMetricCard
                              title="COGS"
                              value={formatCurrency(combinedData.overview.cogs)}
                              icon={FiPackage}
                              change="N/A"
                              changeType="info"
                              color="#ef4444"
                            />
                            <ModernMetricCard
                              title="COGS %"
                              value={formatPercentageValue(combinedData.overview.cogsPercentage)}
                              icon={FiPercent}
                              change="N/A"
                              changeType="info"
                              color="#f59e0b"
                            />
                            <ModernMetricCard
                              title="SD Cost"
                              value={formatCurrency(combinedData.overview.sdCost)}
                              icon={FiTrendingUp}
                              change="N/A"
                              changeType="info"
                              color="#3b82f6"
                            />
                            <ModernMetricCard
                              title="SD Cost %"
                              value={formatPercentageValue(combinedData.overview.sdCostPercentage)}
                              icon={FiPercent}
                              change="N/A"
                              changeType="info"
                              color="#10b981"
                            />
                            <ModernMetricCard
                              title="Gross ROAS"
                              value={combinedData.overview.grossRoas.toFixed(2)}
                              icon={FiBarChart2}
                              change="N/A"
                              changeType="info"
                              color="#8b5cf6"
                            />
                            <ModernMetricCard
                              title="Net ROAS"
                              value={combinedData.overview.netRoas.toFixed(2)}
                              icon={FiActivity}
                              change="N/A"
                              changeType="info"
                              color="#84cc16"
                            />
                            <ModernMetricCard
                              title="N-MER %"
                              value={formatPercentageValue(combinedData.overview.nMer)}
                              icon={FiPercent}
                              change="N/A"
                              changeType="info"
                              color="#ec4899"
                            />
                          </CompactGrid>
                        </SectionContent>
                      </SectionCard>

                      {/* CAC & Contribution Margin Section */}
                      <SectionCard>
                        <SectionHeader>
                          <SectionTitle>
                            <FiUsers size={20} style={{ color: '#10b981' }} />
                            Overall CAC & Contribution Margin
                          </SectionTitle>
                          <SectionDescription>Combined customer acquisition cost and profit margin analysis</SectionDescription>
                        </SectionHeader>
                        <SectionContent>
                          <CompactGrid>
                            <ModernMetricCard
                              title="CAC"
                              value={formatCurrency(data.overview.cac || 0)}
                              icon={FiUsers}
                              change="N/A"
                              changeType="info"
                              color="#3b82f6"
                            />
                            <ModernMetricCard
                              title="CM2"
                              value={formatCurrency(combinedData.overview.cm2)}
                              icon={FiTrendingUp}
                              change="N/A"
                              changeType="info"
                              color="#10b981"
                            />
                            <ModernMetricCard
                              title="CM2 %"
                              value={formatPercentageValue(combinedData.overview.cm2Percentage)}
                              icon={FiPercent}
                              change="N/A"
                              changeType="info"
                              color="#f59e0b"
                            />
                            <ModernMetricCard
                              title="CM3"
                              value={formatCurrency(combinedData.overview.cm3)}
                              icon={FiBarChart2}
                              change="N/A"
                              changeType="info"
                              color="#8b5cf6"
                            />
                            <ModernMetricCard
                              title="CM3 %"
                              value={formatPercentageValue(combinedData.overview.cm3Percentage)}
                              icon={FiPercent}
                              change="N/A"
                              changeType="info"
                              color="#6366f1"
                            />
                          </CompactGrid>
                                                </SectionContent>
                      </SectionCard>

                      {/* Marketing Analytics Section */}
                      <SectionCard>
                        <SectionHeader>
                          <SectionTitle>
                            <FiTarget size={20} style={{ color: '#f59e0b' }} />
                            Overall Marketing Analytics
                          </SectionTitle>
                          <SectionDescription>Combined marketing performance across all channels</SectionDescription>
                        </SectionHeader>
              <SectionContent>
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                  padding: '1.5rem 2rem',
                  borderRadius: '16px',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '700' }}>
                    Targeting Keyword: <span style={{ fontWeight: 'bold', color: '#ffd700' }}>"{data.marketing?.keyword || 'N/A'}"</span>
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', opacity: '0.9' }}>
                    Found {data.marketing?.campaignCount || 0} active campaigns for this product
                </p>
                <p style={{ margin: '0', opacity: '0.8', fontSize: '0.9rem' }}>
                    📅 Marketing data for: {new Date(data.dateFilter?.startDate).toLocaleDateString()} - {new Date(data.dateFilter?.endDate).toLocaleDateString()}
                </p>
            </div>

                <CompactGrid>
                  <ModernMetricCard
                title="Total Ad Spend"
                    value={formatCurrency(data.marketing?.totalSpend || 0)}
                icon={FiDollarSign}
                color="#ef4444"
              />
                  <ModernMetricCard
                title="Total Impressions"
                    value={safeNumberFormat(data.marketing?.totalImpressions || 0)} 
                icon={FiEye}
                color="#3b82f6"
              />
                  <ModernMetricCard
                title="Total Clicks"
                    value={safeNumberFormat(data.marketing?.totalClicks || 0)}
                icon={FiMousePointer}
                color="#10b981"
              />
                  <ModernMetricCard
                title="Total Purchases"
                    value={safeNumberFormat(data.marketing?.totalPurchases || 0)}
                icon={FiShoppingCart}
                color="#8b5cf6"
              />
                  <ModernMetricCard
                title="Purchase Value"
                    value={formatCurrency(data.marketing?.totalPurchaseValue || 0)}
                icon={FiDollarSign}
                color="#059669"
              />
                  <ModernMetricCard
                title="ROAS"
                    value={formatPercentageValue(data.marketing?.averageRoas || 0)}
                icon={FiTrendingUp}
                color="#10b981"
              />
                  <ModernMetricCard
                title="Cost Per Click"
                    value={formatCurrency(data.marketing?.averageCpc || 0)}
                icon={FiTarget}
                color="#f59e0b"
              />
                  <ModernMetricCard
                title="Click-Through Rate"
                    value={formatPercentageValue(data.marketing?.averageCtr || 0)}
                icon={FiActivity}
                color="#6366f1"
              />
                </CompactGrid>
              </SectionContent>
            </SectionCard>

                {/* Variants Analysis */}
                <SectionCard>
                  <SectionHeader>
                    <h2>Overall Variants Analysis</h2>
                    <p>Combined performance breakdown across MyFrido + Amazon channels</p>
                  </SectionHeader>
              <SectionContent>
                <CompactGrid style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: '2rem' }}>
                  <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ECDC4' }}>
                      {safeNumberFormat(getCombinedData()?.variants?.length || 0)}
            </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Total Variants</div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FF6B6B' }}>
                      {safeDisplayValue(getCombinedData()?.variants?.[0]?.name)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Top Performing</div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                      {formatCurrency(getCombinedData()?.variants?.reduce((sum, v) => sum + (v.revenue || 0), 0) || 0)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Total Revenue</div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                      {safeNumberFormat(getCombinedData()?.variants?.reduce((sum, v) => sum + (v.unitsSold || 0), 0) || 0)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Total Units</div>
                  </div>
                </CompactGrid>

                {/* Combined Variants Table */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#1e293b', fontWeight: '600' }}>Combined Product Variants (MyFrido + Amazon)</h3>
              <div style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '1rem 1.5rem',
                      fontWeight: '600',
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                      gap: '1rem',
                      alignItems: 'center'
                    }}>
                      <div>Variant Details</div>
                      <div style={{ textAlign: 'center' }}>Units Sold</div>
                      <div style={{ textAlign: 'center' }}>Revenue</div>
                      <div style={{ textAlign: 'center' }}>Avg Price</div>
                      <div style={{ textAlign: 'center' }}>Orders</div>
                      <div style={{ textAlign: 'center' }}>Performance</div>
              </div>
                    
                    {getCombinedData()?.variants && getCombinedData().variants.length > 0 ? (
                      getCombinedData().variants.map((variant, index) => (
                        <div key={index} style={{ 
                          padding: '1rem 1.5rem',
                          borderBottom: index < getCombinedData().variants.length - 1 ? '1px solid #f1f5f9' : 'none',
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                          gap: '1rem',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                              {variant.name || 'N/A'}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                              SKU: {variant.sku || 'N/A'}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ color: '#059669' }}>MyFrido: {variant.myfridoUnitsSold}</span>
                              <span style={{ color: '#f59e0b' }}>Amazon: {variant.amazonUnitsSold}</span>
                              {variant.asin !== 'N/A' && <span style={{ color: '#64748b' }}>ASIN: {variant.asin}</span>}
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                              {safeNumberFormat(variant.unitsSold)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Combined Total
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '600', color: '#059669' }}>
                              {formatCurrency(variant.revenue)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Combined Total
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                              {formatCurrency(variant.avgPrice)}
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                              {safeNumberFormat(variant.orders)}
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: variant.performance === 'Top Performer' ? '#dcfce7' : 
                                         variant.performance === 'Good' ? '#fef3c7' : '#f1f5f9',
                              color: variant.performance === 'Top Performer' ? '#15803d' : 
                                     variant.performance === 'Good' ? '#d97706' : '#64748b'
                            }}>
                              {variant.performance || 'Average'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ 
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#64748b'
                      }}>
                        No variant data available
                      </div>
                    )}
              </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                        Units Sold Distribution
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        Performance breakdown by variants
                      </p>
                    </div>
                    <div style={{ 
                      height: '280px',
                      background: 'rgba(248, 250, 252, 0.5)',
                      borderRadius: '16px',
                      padding: '1rem',
                      border: '1px solid rgba(226, 232, 240, 0.5)'
                    }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                            data={getCombinedData()?.variants?.map(variant => ({
                              name: variant.name || 'Unknown',
                              value: parseInt(variant.unitsSold),
                            })) || []}
                        cx="50%"
                        cy="50%"
                            outerRadius={90}
                            innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                      >
                            {data.variantInsights?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                          <Tooltip 
                            formatter={(value) => [value.toLocaleString(), 'Units Sold']}
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
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                        Revenue Distribution
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        Sales value by variant performance
                      </p>
                    </div>
                    <div style={{ 
                      height: '280px',
                      background: 'rgba(248, 250, 252, 0.5)',
                      borderRadius: '16px',
                      padding: '1rem',
                      border: '1px solid rgba(226, 232, 240, 0.5)'
                    }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                          data={getCombinedData()?.variants?.map(variant => ({
                            name: variant.name || 'Unknown',
                            revenue: parseFloat(variant.revenue),
                          })) || []}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <Tooltip 
                            formatter={(value) => [formatCurrency(value), 'Revenue']}
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
                            dataKey="revenue" 
                            fill="url(#revenueGradient)" 
                            name="Revenue"
                            radius={[8, 8, 0, 0]}
                          />
                          <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                          </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
              </SectionContent>
            </SectionCard>

                {/* Customer Insights */}
                <SectionCard>
                  <SectionHeader>
                    <h2>Overall Customer Insights</h2>
                    <p>Combined customer behavior across all channels (Currently: Myfrido only)</p>
                  </SectionHeader>
              <SectionContent>
                <CompactGrid>
                  <ModernMetricCard
                title="Total Customers"
                    value={safeNumberFormat(data.customerInsights?.totalCustomers || 0)}
                icon={FiUsers}
                color="#3b82f6"
              />
                  <ModernMetricCard
                title="Repeat Customers"
                    value={safeNumberFormat(data.customerInsights?.repeatCustomers || 0)}
                icon={FiUsers}
                    color="#10b981"
                  />
                  <ModernMetricCard
                    title="Repeat Rate"
                    value={formatPercentageValue(data.customerInsights?.repeatCustomerRate || 0)}
                icon={FiPercent}
                    color="#8b5cf6"
                  />
                  <ModernMetricCard
                    title="Avg Orders/Customer"
                    value={(data.customerInsights?.avgOrdersPerCustomer || 0).toFixed(2)}
                icon={FiUsers}
                    color="#f59e0b"
                  />
                  <ModernMetricCard
                    title="Acquisition Cost"
                    value={formatCurrency(data.customerInsights?.customerAcquisitionCost || 0)}
                icon={FiCreditCard}
                color="#ef4444"
              />
                </CompactGrid>

                {/* Customer Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                        Customer Type Distribution
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        First-time vs returning customers
                      </p>
                    </div>
                    <div style={{ 
                      height: '280px',
                      background: 'rgba(248, 250, 252, 0.5)',
                      borderRadius: '16px',
                      padding: '1rem',
                      border: '1px solid rgba(226, 232, 240, 0.5)'
                    }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                              { name: 'First-time', value: data.customerInsights?.firstTimeCustomers || 0},
                              { name: 'Returning', value: data.customerInsights?.repeatCustomers || 0}
                        ]}
                        cx="50%"
                        cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                            paddingAngle={5}
                      >
                            <Cell fill="url(#firstTimeGradient)" />
                            <Cell fill="url(#returningGradient)" />
                      </Pie>
                          <Tooltip 
                            formatter={(value) => [value.toLocaleString(), 'Customers']}
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
                          <defs>
                            <linearGradient id="firstTimeGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#FF6B6B" />
                              <stop offset="100%" stopColor="#ee5a52" />
                            </linearGradient>
                            <linearGradient id="returningGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#4ECDC4" />
                              <stop offset="100%" stopColor="#44b3ac" />
                            </linearGradient>
                          </defs>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                        Order Frequency
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        Customer purchase behavior patterns
                      </p>
                    </div>
                    <div style={{ 
                      height: '280px',
                      background: 'rgba(248, 250, 252, 0.5)',
                      borderRadius: '16px',
                      padding: '1rem',
                      border: '1px solid rgba(226, 232, 240, 0.5)'
                    }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                            { name: '1 Order', customers: parseInt(data.customerInsights?.frequencyDistribution?.oneOrderCustomers?.customerCount || '0') },
                            { name: '2 Orders', customers: parseInt(data.customerInsights?.frequencyDistribution?.twoOrdersCustomers?.customerCount || '0') },
                            { name: '3 Orders', customers: parseInt(data.customerInsights?.frequencyDistribution?.threeOrdersCustomers?.customerCount || '0') },
                            { name: '4+ Orders', customers: parseInt(data.customerInsights?.frequencyDistribution?.fourOrdersCustomers?.customerCount || '0') },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <Tooltip 
                            formatter={(value) => [value.toLocaleString(), 'Customers']}
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
                            dataKey="customers" 
                            fill="url(#frequencyGradient)" 
                            name="Customers"
                            radius={[8, 8, 0, 0]}
                          />
                          <defs>
                            <linearGradient id="frequencyGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                          </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
              </SectionContent>
            </SectionCard>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Myfrido Tab Content */}
            {activeTab === 'myfrido' && (
              <div>
                {/* Sales Matrices Section */}
                <SectionCard>
                  <SectionHeader>
                    <h2>Myfrido Sales Metrics</h2>
                    <p>Comprehensive sales performance analysis for Myfrido</p>
                  </SectionHeader>
                  <SectionContent>
                    {/* Sales Metrics */}
                    <CompactGrid>
                      <ModernMetricCard
                        title="Total Sales"
                        value={formatCurrency(data.overview.totalSales)}
                        icon={FiDollarSign}
                        color="#3b82f6"
                      />
                      <ModernMetricCard
                        title="Gross Sales"
                        value={formatCurrency(data.overview.grossSales || data.overview.totalSales)}
                        icon={FiDollarSign}
                        color="#10b981"
                      />
                      <ModernMetricCard
                        title="Net Sales"
                        value={formatCurrency(data.overview.netSales || 0)}
                        icon={FiDollarSign}
                        color="#f59e0b"
                      />
                      <ModernMetricCard
                        title="AOV"
                        value={formatCurrency(data.overview.aov)}
                        icon={FiCreditCard}
                        color="#8b5cf6"
                      />
                      <ModernMetricCard
                        title="Gross Sale %"
                        value={formatPercentageValue(data.overview.grossSalePercentage || 100)}
                        icon={FiPercent}
                        color="#dc2626"
                      />
                      <ModernMetricCard
                        title="Net Sale %"
                        value={formatPercentageValue(data.overview.netSalePercentage || 100)}
                        icon={FiPercent}
                        color="#6366f1"
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                {/* Orders & Quantity Metrics */}
                <SectionCard>
                  <SectionHeader>
                    <h2>Myfrido Orders & Quantity</h2>
                    <p>Order volume and quantity analysis for Myfrido</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      <ModernMetricCard
                        title="Total Orders"
                        value={safeNumberFormat(data.overview.totalOrders)}
                        icon={FiShoppingCart}
                        color="#059669"
                      />
                      <ModernMetricCard
                        title="Net Orders"
                        value={safeNumberFormat(data.overview.netOrders)}
                        icon={FiShoppingCart}
                        color="#10b981"
                      />
                      <ModernMetricCard
                        title="Total Quantity"
                        value={safeNumberFormat(data.overview.totalQuantitySold)}
                        icon={FiPackage}
                        color="#f59e0b"
                      />
                      <ModernMetricCard
                        title="Net Quantity"
                        value={safeNumberFormat(data.overview.netQuantitySold)}
                        icon={FiPackage}
                        color="#8b5cf6"
                      />
                      <ModernMetricCard
                        title="Returns Quantity"
                        value={safeNumberFormat(data.overview.totalReturnsQuantity || 0)}
                        icon={FiRefreshCw}
                        color="#ef4444"
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                {/* Add all other sections for Myfrido */}
                {/* Returns & Tax Metrics */}
                <SectionCard>
                  <SectionHeader>
                    <h2>Myfrido Returns & Tax</h2>
                    <p>Return rates and tax analysis for Myfrido</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      <ModernMetricCard
                        title="Total Returns"
                        value={formatCurrency(data.overview.totalReturns || 0)}
                        icon={FiRefreshCw}
                        color="#ef4444"
                      />
                      <ModernMetricCard
                        title="Return Rate"
                        value={formatPercentageValue(data.overview.totalReturnPercentage || 0)}
                        icon={FiPercent}
                        color="#dc2626"
                      />
                      <ModernMetricCard
                        title="Total Tax"
                        value={formatCurrency(data.overview.totalTax || 0)}
                        icon={FiDollarSign}
                        color="#059669"
                      />
                      <ModernMetricCard
                        title="Tax Rate"
                        value={`${data.overview.taxRate || 0}%`}
                        icon={FiPercent}
                        color="#10b981"
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                {/* Expenses & ROAS Metrics */}
                <SectionCard>
                  <SectionHeader>
                    <h2>Myfrido Expenses & ROAS</h2>
                    <p>Cost analysis and return on ad spend for Myfrido</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      <ModernMetricCard
                        title="COGS"
                        value={formatCurrency(data.overview.cogs || 0)}
                        icon={FiPackage}
                        color="#f59e0b"
                      />
                      <ModernMetricCard
                        title="COGS %"
                        value={formatPercentageValue(data.overview.cogsPercentage || 0)}
                        icon={FiPercent}
                        color="#8b5cf6"
                      />
                      <ModernMetricCard
                        title="S&D Cost"
                        value={formatCurrency(data.overview.sdCost || 0)}
                        icon={FiTarget}
                        color="#6366f1"
                      />
                      <ModernMetricCard
                        title="S&D Cost %"
                        value={formatPercentageValue(data.overview.sdCostPercentage || 0)}
                        icon={FiPercent}
                        color="#3b82f6"
                      />
                      <ModernMetricCard
                        title="Gross ROAS"
                        value={(data.overview.grossRoas || 0).toFixed(2)}
                        icon={FiTrendingUp}
                        color="#8b5cf6"
                      />
                      <ModernMetricCard
                        title="Net ROAS"
                        value={(data.overview.netRoas || 0).toFixed(2)}
                        icon={FiTrendingUp}
                        color="#6366f1"
                      />
                      <ModernMetricCard
                        title="N-ROAS"
                        value={(data.overview.nRoas || 0).toFixed(2)}
                        icon={FiTrendingUp}
                        color="#6366f1"
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                {/* CAC & Contribution Margin Metrics */}
                <SectionCard>
                  <SectionHeader>
                    <h2>Myfrido CAC & Contribution Margin</h2>
                    <p>Customer acquisition cost and profitability metrics for Myfrido</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      <ModernMetricCard
                        title="Total CAC"
                        value={formatCurrency(data.overview.cac || 0)}
                        icon={FiDollarSign}
                        color="#ef4444"
                      />
                      <ModernMetricCard
                        title="CM2"
                        value={formatCurrency(data.overview.cm2 || 0)}
                        icon={FiPercent}
                        color="#8b5cf6"
                      />
                      <ModernMetricCard
                        title="CM2 %"
                        value={formatPercentageValue(data.overview.cm2Percentage || 0)}
                        icon={FiPercent}
                        color="#6366f1"
                      />
                      <ModernMetricCard
                        title="CM3"
                        value={formatCurrency(data.overview.cm3 || 0)}
                        icon={FiPercent}
                        color="#6366f1"
                      />
                      <ModernMetricCard
                        title="CM3 %"
                        value={formatPercentageValue(data.overview.cm3Percentage || 0)}
                        icon={FiPercent}
                        color="#6366f1"
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>
                
                {/* Marketing Analytics */}
                <SectionCard>
                  <SectionHeader>
                    <h2>Myfrido Marketing Analytics</h2>
                    <p>Meta Ads performance and insights for Myfrido</p>
                  </SectionHeader>
                  <SectionContent>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '1.5rem 2rem',
                      borderRadius: '16px',
                      marginBottom: '2rem'
                    }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '700' }}>
                        Targeting Keyword: <span style={{ fontWeight: 'bold', color: '#ffd700' }}>"{data.marketing?.keyword || 'N/A'}"</span>
                      </h3>
                      <p style={{ margin: '0 0 0.5rem 0', opacity: '0.9' }}>
                        Found {data.marketing?.campaignCount || 0} active campaigns for this product
                      </p>
                      <p style={{ margin: '0', opacity: '0.8', fontSize: '0.9rem' }}>
                        📅 Marketing data for: {new Date(data.dateFilter?.startDate).toLocaleDateString()} - {new Date(data.dateFilter?.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    <CompactGrid>
                      <ModernMetricCard
                        title="Total Ad Spend"
                        value={formatCurrency(data.marketing?.totalSpend || 0)}
                        icon={FiDollarSign}
                        color="#ef4444"
                      />
                      <ModernMetricCard
                        title="Total Impressions"
                        value={safeNumberFormat(data.marketing?.totalImpressions || 0)} 
                        icon={FiEye}
                        color="#3b82f6"
                      />
                      <ModernMetricCard
                        title="Total Clicks"
                        value={safeNumberFormat(data.marketing?.totalClicks || 0)}
                        icon={FiMousePointer}
                        color="#10b981"
                      />
                      <ModernMetricCard
                        title="Total Purchases"
                        value={safeNumberFormat(data.marketing?.totalPurchases || 0)}
                        icon={FiShoppingCart}
                        color="#8b5cf6"
                      />
                      <ModernMetricCard
                        title="Purchase Value"
                        value={formatCurrency(data.marketing?.totalPurchaseValue || 0)}
                        icon={FiDollarSign}
                        color="#059669"
                      />
                      <ModernMetricCard
                        title="ROAS"
                        value={formatPercentageValue(data.marketing?.averageRoas || 0)}
                        icon={FiTrendingUp}
                        color="#6366f1"
                      />
                      <ModernMetricCard
                        title="CTR"
                        value={formatPercentageValue(data.marketing?.averageCtr || 0)}
                        icon={FiMousePointer}
                        color="#f59e0b"
                      />
                      <ModernMetricCard
                        title="CPC"
                        value={formatCurrency(data.marketing?.averageCpc || 0)}
                        icon={FiDollarSign}
                        color="#dc2626"
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                {/* Variants Analysis */}
                <SectionCard>
                  <SectionHeader>
                    <h2>Myfrido Variants Analysis</h2>
                    <p>Performance breakdown by product variants for Myfrido</p>
                  </SectionHeader>
                  <SectionContent>
                    {/* Top Performing Variants */}
                    <div style={{ marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>
                          Top Performing Variants
                        </h3>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#667eea', 
                          fontWeight: '500',
                          background: 'rgba(102, 126, 234, 0.1)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(102, 126, 234, 0.2)'
                        }}>
                          💡 Click any variant for detailed analysis
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                      }}>
                        {/* Headers */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                          gap: '1rem',
                          padding: '1rem 0',
                          borderBottom: '2px solid #e2e8f0',
                          fontWeight: '600',
                          color: '#64748b',
                          fontSize: '0.875rem'
                        }}>
                          <div>Variant</div>
                          <div style={{ textAlign: 'center' }}>Units Sold</div>
                          <div style={{ textAlign: 'center' }}>Revenue</div>
                          <div style={{ textAlign: 'center' }}>Avg Price</div>
                          <div style={{ textAlign: 'center' }}>Stock</div>
                          <div style={{ textAlign: 'center' }}>Performance</div>
                        </div>
                        
                        {/* Variant Rows */}
                        {data.variantInsights && data.variantInsights.length > 0 ? (
                          data.variantInsights.map((variant, index) => (
                            <div 
                              key={index} 
                              onClick={() => handleVariantClick(variant.name || variant.variant_name)}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                                gap: '1rem',
                                padding: '1rem 0',
                                borderBottom: index < data.variantInsights.length - 1 ? '1px solid #f1f5f9' : 'none',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderRadius: '8px',
                                margin: '0.25rem 0'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.transform = 'translateX(4px)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {variant.name || variant.variant_name || 'N/A'}
                                  <span style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: '500' }}>→</span>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                  SKU: {variant.sku || variant.variant_sku || 'N/A'}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                  Units: {safeNumberFormat(variant.soldCount || variant.total_units_sold)} | 
                                  Share: {formatPercentageValue(variant.unitsPercentage || variant.units_sold_percentage)}
                                </div>
                              </div>
                              
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                  {safeNumberFormat(variant.soldCount || variant.total_units_sold)}
                                </div>
                              </div>
                              
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: '600', color: '#059669' }}>
                                  {formatCurrency(variant.salesAmount || variant.total_sales_amount)}
                                </div>
                              </div>
                              
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                  {formatCurrency((variant.salesAmount || variant.total_sales_amount) / (variant.soldCount || variant.total_units_sold || 1))}
                                </div>
                              </div>
                              
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                  {safeNumberFormat(variant.soldCount || variant.total_units_sold)}
                                </div>
                              </div>
                              
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ 
                                  display: 'inline-block',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  background: index === 0 ? '#dcfce7' : index === 1 ? '#fef3c7' : '#f1f5f9',
                                  color: index === 0 ? '#15803d' : index === 1 ? '#d97706' : '#64748b'
                                }}>
                                  {index === 0 ? 'Top Performer' : index === 1 ? 'Good' : 'Average'}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ 
                            padding: '2rem',
                            textAlign: 'center',
                            color: '#64748b'
                          }}>
                            No variant data available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Charts Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                            Units Sold Distribution
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                            Performance breakdown by variants
                          </p>
                        </div>
                        <div style={{ 
                          height: '280px',
                          background: 'rgba(248, 250, 252, 0.5)',
                          borderRadius: '16px',
                          padding: '1rem',
                          border: '1px solid rgba(226, 232, 240, 0.5)'
                        }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={data.variantInsights?.map(variant => ({
                                  name: variant.name || variant.variant_name || 'Unknown',
                                  value: parseInt(variant.soldCount || variant.total_units_sold),
                                })) || []}
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                innerRadius={40}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {data.variantInsights?.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value) => [value.toLocaleString(), 'Units Sold']}
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
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                            Revenue Distribution
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                            Sales value by variant performance
                          </p>
                        </div>
                        <div style={{ 
                          height: '280px',
                          background: 'rgba(248, 250, 252, 0.5)',
                          borderRadius: '16px',
                          padding: '1rem',
                          border: '1px solid rgba(226, 232, 240, 0.5)'
                        }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={data.variantInsights?.map(variant => ({
                                name: variant.name || variant.variant_name || 'Unknown',
                                revenue: parseFloat(variant.salesAmount || variant.total_sales_amount),
                              })) || []}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                              />
                              <YAxis 
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                              />
                              <Tooltip 
                                formatter={(value) => [formatCurrency(value), 'Revenue']}
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
                                dataKey="revenue" 
                                fill="url(#revenueGradient)" 
                                name="Revenue"
                                radius={[8, 8, 0, 0]}
                              />
                              <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                              </defs>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </SectionContent>
                </SectionCard>

                {/* Customer Insights */}
                <SectionCard>
                  <SectionHeader>
                    <h2>Myfrido Customer Insights</h2>
                    <p>Customer behavior and acquisition metrics for Myfrido</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      <ModernMetricCard
                        title="Total Customers"
                        value={safeNumberFormat(data.customerInsights?.totalCustomers || 0)}
                        icon={FiUsers}
                        color="#3b82f6"
                      />
                      <ModernMetricCard
                        title="Repeat Customers"
                        value={safeNumberFormat(data.customerInsights?.repeatCustomers || 0)}
                        icon={FiUsers}
                        color="#10b981"
                      />
                      <ModernMetricCard
                        title="Repeat Rate"
                        value={formatPercentageValue(data.customerInsights?.repeatCustomerRate || 0)}
                        icon={FiPercent}
                        color="#8b5cf6"
                      />
                      <ModernMetricCard
                        title="Avg Orders/Customer"
                        value={(data.customerInsights?.avgOrdersPerCustomer || 0).toFixed(2)}
                        icon={FiUsers}
                        color="#f59e0b"
                      />
                      <ModernMetricCard
                        title="Acquisition Cost"
                        value={formatCurrency(data.customerInsights?.customerAcquisitionCost || 0)}
                        icon={FiCreditCard}
                        color="#ef4444"
                      />
                    </CompactGrid>

                    {/* Customer Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                            Customer Type Distribution
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                            First-time vs returning customers
                          </p>
                        </div>
                        <div style={{ 
                          height: '280px',
                          background: 'rgba(248, 250, 252, 0.5)',
                          borderRadius: '16px',
                          padding: '1rem',
                          border: '1px solid rgba(226, 232, 240, 0.5)'
                        }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'First-time', value: data.customerInsights?.firstTimeCustomers || 0},
                                  { name: 'Returning', value: data.customerInsights?.repeatCustomers || 0}
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                fill="#8884d8"
                                dataKey="value"
                                paddingAngle={5}
                              >
                                <Cell fill="url(#firstTimeGradient)" />
                                <Cell fill="url(#returningGradient)" />
                              </Pie>
                              <Tooltip 
                                formatter={(value) => [value.toLocaleString(), 'Customers']}
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
                              <defs>
                                <linearGradient id="firstTimeGradient" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0%" stopColor="#FF6B6B" />
                                  <stop offset="100%" stopColor="#ee5a52" />
                                </linearGradient>
                                <linearGradient id="returningGradient" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0%" stopColor="#4ECDC4" />
                                  <stop offset="100%" stopColor="#44b3ac" />
                                </linearGradient>
                              </defs>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                            Order Frequency
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                            Customer purchase behavior patterns
                          </p>
                        </div>
                        <div style={{ 
                          height: '280px',
                          background: 'rgba(248, 250, 252, 0.5)',
                          borderRadius: '16px',
                          padding: '1rem',
                          border: '1px solid rgba(226, 232, 240, 0.5)'
                        }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                { name: '1 Order', customers: parseInt(data.customerInsights?.frequencyDistribution?.oneOrderCustomers?.customerCount || '0') },
                                { name: '2 Orders', customers: parseInt(data.customerInsights?.frequencyDistribution?.twoOrdersCustomers?.customerCount || '0') },
                                { name: '3 Orders', customers: parseInt(data.customerInsights?.frequencyDistribution?.threeOrdersCustomers?.customerCount || '0') },
                                { name: '4+ Orders', customers: parseInt(data.customerInsights?.frequencyDistribution?.fourOrdersCustomers?.customerCount || '0') },
                              ]}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                              />
                              <YAxis 
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                              />
                              <Tooltip 
                                formatter={(value) => [value.toLocaleString(), 'Customers']}
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
                                dataKey="customers" 
                                fill="url(#frequencyGradient)" 
                                name="Customers"
                                radius={[8, 8, 0, 0]}
                              />
                              <defs>
                                <linearGradient id="frequencyGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#7c3aed" />
                                </linearGradient>
                              </defs>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </SectionContent>
                </SectionCard>
              </div>
            )}

            {/* Amazon Tab Content */}
            {activeTab === 'amazon' && (
              <div>
                {isAmazonLoading ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '300px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    backdropFilter: 'blur(20px)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <FiRefreshCw size={32} className="spin" style={{ color: '#667eea', marginBottom: '1rem' }} />
                      <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Loading Amazon Data</h3>
                      <p style={{ color: '#64748b' }}>Fetching metrics from Amazon marketplace...</p>
                    </div>
                  </div>
                ) : amazonError ? (
                  <div style={{ 
                    padding: '3rem 2rem', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    borderRadius: '12px', 
                    textAlign: 'center',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    marginBottom: '2rem'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
                    <h3 style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      Unable to Load Amazon Data
                    </h3>
                    <p style={{ color: '#7f1d1d', fontSize: '1rem', margin: '0 0 1rem 0' }}>
                      {amazonError}
                    </p>
                    <button 
                      onClick={fetchAmazonData}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                ) : !amazonData ? (
                  <div style={{ 
                    padding: '3rem 2rem', 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    borderRadius: '12px', 
                    textAlign: 'center',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    marginBottom: '2rem'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                    <h3 style={{ color: '#2563eb', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      No Amazon Data Found
                    </h3>
                    <p style={{ color: '#1e40af', fontSize: '1rem', margin: '0 0 1rem 0' }}>
                      No Amazon sales data found for SKU: {data?.product?.sku} in the selected date range.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Sales Matrices Section */}
                    <SectionCard>
                      <SectionHeader>
                        <SectionTitle>
                          <FiDollarSign size={20} style={{ color: '#10b981' }} />
                          Amazon Sales Metrics
                        </SectionTitle>
                        <SectionDescription>Current sales performance and revenue analysis</SectionDescription>
                      </SectionHeader>
                      <SectionContent>
                        <CompactGrid>
                          <ModernMetricCard
                            title="Total Sales"
                            value={formatCurrency(amazonData.overview.totalSales)}
                            icon={FiDollarSign}
                            change={amazonData.overview.revenueChangePercentage}
                            changeType="positive"
                            color="#10b981"
                          />
                          <ModernMetricCard
                            title="Gross Sales"
                            value={formatCurrency(amazonData.overview.grossSales || amazonData.overview.totalSales)}
                            icon={FiTrendingUp}
                            change={amazonData.overview.grossSalesChangePercentage}
                            changeType="positive"
                            color="#3b82f6"
                          />
                          <ModernMetricCard
                            title="Net Sales"
                            value={formatCurrency(amazonData.overview.netSales || 0)}
                            icon={FiBarChart2}
                            change={amazonData.overview.netSalesChangePercentage}
                            changeType="positive"
                            color="#8b5cf6"
                          />
                          <ModernMetricCard
                            title="AOV"
                            value={formatCurrency(amazonData.overview.aov)}
                            icon={FiShoppingCart}
                            change={amazonData.overview.aovChangePercentage}
                            changeType="positive"
                            color="#f59e0b"
                          />
                          <ModernMetricCard
                            title="Gross Sale %"
                            value={formatPercentageValue(amazonData.overview.grossSalePercentage || 100)}
                            icon={FiPercent}
                            change="N/A"
                            changeType="info"
                            color="#ef4444"
                          />
                          <ModernMetricCard
                            title="Net Sale %"
                            value={formatPercentageValue(amazonData.overview.netSalePercentage || 100)}
                            icon={FiTarget}
                            change="N/A"
                            changeType="info"
                            color="#84cc16"
                          />
                        </CompactGrid>
                      </SectionContent>
                    </SectionCard>

                    {/* Orders & Quantity Section */}
                    <SectionCard>
                      <SectionHeader>
                        <SectionTitle>
                          <FiPackage size={20} style={{ color: '#3b82f6' }} />
                          Amazon Orders & Quantity
                        </SectionTitle>
                        <SectionDescription>Order volume and quantity performance metrics</SectionDescription>
                      </SectionHeader>
                      <SectionContent>
                        <CompactGrid>
                          <ModernMetricCard
                            title="Total Orders"
                            value={safeNumberFormat(amazonData.overview.totalOrders)}
                            icon={FiShoppingCart}
                            change={amazonData.overview.ordersChangePercentage}
                            changeType="positive"
                            color="#3b82f6"
                          />
                          <ModernMetricCard
                            title="Net Orders"
                            value={safeNumberFormat(amazonData.overview.netOrders)}
                            icon={FiActivity}
                            change="N/A"
                            changeType="info"
                            color="#10b981"
                          />
                          <ModernMetricCard
                            title="Units Sold"
                            value={safeNumberFormat(amazonData.overview.totalQuantitySold)}
                            icon={FiPackage}
                            change="N/A"
                            changeType="info"
                            color="#f59e0b"
                          />
                          <ModernMetricCard
                            title="Net Units"
                            value={safeNumberFormat(amazonData.overview.netQuantitySold)}
                            icon={FiTarget}
                            change="N/A"
                            changeType="info"
                            color="#8b5cf6"
                          />
                          <ModernMetricCard
                            title="Returned Units"
                            value={safeNumberFormat(amazonData.overview.totalReturnsQuantity || 0)}
                            icon={FiTrendingDown}
                            change="N/A"
                            changeType="info"
                            color="#ef4444"
                          />
                        </CompactGrid>
                      </SectionContent>
                    </SectionCard>

                    {/* Returns & Tax Section */}
                    <SectionCard>
                      <SectionHeader>
                        <SectionTitle>
                          <FiTrendingDown size={20} style={{ color: '#ef4444' }} />
                          Amazon Returns & Tax
                        </SectionTitle>
                        <SectionDescription>Return analysis and tax calculations</SectionDescription>
                      </SectionHeader>
                      <SectionContent>
                        <CompactGrid>
                          <ModernMetricCard
                            title="Total Returns"
                            value={formatCurrency(amazonData.overview.totalReturns || 0)}
                            icon={FiTrendingDown}
                            change={amazonData.overview.returnsChangePercentage}
                            changeType="negative"
                            color="#ef4444"
                          />
                          <ModernMetricCard
                            title="Return Rate"
                            value={formatPercentageValue(amazonData.overview.totalReturnPercentage || 0)}
                            icon={FiPercent}
                            change="N/A"
                            changeType="info"
                            color="#f59e0b"
                          />
                          <ModernMetricCard
                            title="Total Tax"
                            value={formatCurrency(amazonData.overview.totalTax || 0)}
                            icon={FiDollarSign}
                            change={amazonData.overview.taxChangePercentage}
                            changeType="neutral"
                            color="#6b7280"
                          />
                          <ModernMetricCard
                            title="Tax Rate"
                            value={`${amazonData.overview.taxRate || 0}%`}
                            icon={FiPercent}
                            change="N/A"
                            changeType="info"
                            color="#84cc16"
                          />
                        </CompactGrid>
                      </SectionContent>
                    </SectionCard>

                    {/* Expenses & ROAS Section */}
                    <SectionCard>
                      <SectionHeader>
                        <SectionTitle>
                          <FiCreditCard size={20} style={{ color: '#8b5cf6' }} />
                          Amazon Expenses & ROAS
                        </SectionTitle>
                        <SectionDescription>Cost analysis and return on ad spend calculations</SectionDescription>
                      </SectionHeader>
                      <SectionContent>
                        <CompactGrid>
                          <ModernMetricCard
                            title="COGS"
                            value={formatCurrency(amazonData.overview.cogs || 0)}
                            icon={FiPackage}
                            change="N/A"
                            changeType="info"
                            color="#ef4444"
                          />
                          <ModernMetricCard
                            title="COGS %"
                            value={formatPercentageValue(amazonData.overview.cogsPercentage || 0)}
                            icon={FiPercent}
                            change="N/A"
                            changeType="info"
                            color="#f59e0b"
                          />
                          <ModernMetricCard
                            title="SD Cost"
                            value={formatCurrency(amazonData.overview.sdCost || 0)}
                            icon={FiTrendingUp}
                            change="N/A"
                            changeType="info"
                            color="#3b82f6"
                          />
                          <ModernMetricCard
                            title="SD Cost %"
                            value={formatPercentageValue(amazonData.overview.sdCostPercentage || 0)}
                            icon={FiPercent}
                            change="N/A"
                            changeType="info"
                            color="#10b981"
                          />
                          <ModernMetricCard
                            title="Gross ROAS"
                            value={(amazonData.overview.grossRoas || 0).toFixed(2)}
                            icon={FiBarChart2}
                            change="N/A"
                            changeType="info"
                            color="#8b5cf6"
                          />
                          <ModernMetricCard
                            title="Net ROAS"
                            value={(amazonData.overview.netRoas || 0).toFixed(2)}
                            icon={FiActivity}
                            change="N/A"
                            changeType="info"
                            color="#84cc16"
                          />
                        </CompactGrid>
                      </SectionContent>
                    </SectionCard>

                    {/* CAC & Contribution Margin Section */}
                    <SectionCard>
                      <SectionHeader>
                        <SectionTitle>
                          <FiUsers size={20} style={{ color: '#10b981' }} />
                          Amazon CAC & Contribution Margin
                        </SectionTitle>
                        <SectionDescription>Customer acquisition cost and profit margin analysis</SectionDescription>
                      </SectionHeader>
                      <SectionContent>
                        <CompactGrid>
                          <ModernMetricCard
                            title="CAC"
                            value={formatCurrency(amazonData.overview.cac || 0)}
                            icon={FiUsers}
                            change="N/A"
                            changeType="info"
                            color="#3b82f6"
                          />
                          <ModernMetricCard
                            title="Paid CAC"
                            value={formatCurrency(amazonData.overview.paidCac || 0)}
                            icon={FiCreditCard}
                            change="N/A"
                            changeType="info"
                            color="#ef4444"
                          />
                          <ModernMetricCard
                            title="Organic CAC"
                            value={formatCurrency(amazonData.overview.organicCac || 0)}
                            icon={FiTrendingUp}
                            change="N/A"
                            changeType="info"
                            color="#10b981"
                          />
                          <ModernMetricCard
                            title="Contribution Margin"
                            value={formatCurrency(amazonData.overview.contributionMargin || 0)}
                            icon={FiBarChart2}
                            change="N/A"
                            changeType="info"
                            color="#8b5cf6"
                          />
                          <ModernMetricCard
                            title="CM %"
                            value={formatPercentageValue(amazonData.overview.contributionMarginPercentage || 0)}
                            icon={FiPercent}
                            change="N/A"
                            changeType="info"
                            color="#f59e0b"
                          />
                        </CompactGrid>
                      </SectionContent>
                    </SectionCard>

                    {/* Marketing Analytics Section */}
                    <SectionCard>
                      <SectionHeader>
                        <SectionTitle>
                          <FiTarget size={20} style={{ color: '#f59e0b' }} />
                          Amazon Marketing Analytics
                        </SectionTitle>
                        <SectionDescription>Amazon advertising performance and metrics</SectionDescription>
                      </SectionHeader>
                      <SectionContent>
                        {/* Targeting Keyword Banner */}
                        <div style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          marginBottom: '2rem',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <FiTarget size={24} />
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                              Targeting Keyword
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
                              {amazonData.marketing?.targetingKeyword || 'Amazon Product Ads'}
                            </p>
                          </div>
                        </div>

                        <CompactGrid>
                          <ModernMetricCard
                            title="Ad Spend"
                            value={formatCurrency(amazonData.marketing?.adSpend || 0)}
                            icon={FiDollarSign}
                            change="N/A"
                            changeType="info"
                            color="#ef4444"
                          />
                          <ModernMetricCard
                            title="Impressions"
                            value={safeNumberFormat(amazonData.marketing?.impressions || 0)}
                            icon={FiEye}
                            change="N/A"
                            changeType="info"
                            color="#3b82f6"
                          />
                          <ModernMetricCard
                            title="Clicks"
                            value={safeNumberFormat(amazonData.marketing?.clicks || 0)}
                            icon={FiMousePointer}
                            change="N/A"
                            changeType="info"
                            color="#10b981"
                          />
                          <ModernMetricCard
                            title="Purchases"
                            value={safeNumberFormat(amazonData.marketing?.purchases || 0)}
                            icon={FiShoppingCart}
                            change="N/A"
                            changeType="info"
                            color="#8b5cf6"
                          />
                          <ModernMetricCard
                            title="Purchase Value"
                            value={formatCurrency(amazonData.marketing?.purchaseValue || 0)}
                            icon={FiDollarSign}
                            change="N/A"
                            changeType="info"
                            color="#f59e0b"
                          />
                          <ModernMetricCard
                            title="ROAS"
                            value={(amazonData.marketing?.roas || 0).toFixed(2)}
                            icon={FiBarChart2}
                            change="N/A"
                            changeType="info"
                            color="#84cc16"
                          />
                          <ModernMetricCard
                            title="CTR"
                            value={`${(amazonData.marketing?.ctr || 0).toFixed(2)}%`}
                            icon={FiPercent}
                            change="N/A"
                            changeType="info"
                            color="#06b6d4"
                          />
                          <ModernMetricCard
                            title="CPC"
                            value={formatCurrency(amazonData.marketing?.cpc || 0)}
                            icon={FiCreditCard}
                            change="N/A"
                            changeType="info"
                            color="#ec4899"
                          />
                        </CompactGrid>
                      </SectionContent>
                    </SectionCard>

                    {/* Variants Analysis Section */}
                    <SectionCard>
                      <SectionHeader>
                        <SectionTitle>
                          <FiPackage size={20} style={{ color: '#8b5cf6' }} />
                          Amazon Variants Analysis
                        </SectionTitle>
                        <SectionDescription>Performance breakdown by product variants</SectionDescription>
                      </SectionHeader>
                      <SectionContent>
                        {/* Amazon Variants Table */}
                        <div style={{ marginBottom: '2rem' }}>
                          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#1e293b', fontWeight: '600' }}>Amazon Product Variants List</h3>
                          <div style={{ 
                            background: 'white', 
                            borderRadius: '16px', 
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                          
                          <div style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '1rem 1.5rem',
                            fontWeight: '600',
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                            gap: '1rem',
                            alignItems: 'center'
                          }}>
                            <div>Variant Details</div>
                            <div style={{ textAlign: 'center' }}>Units Sold</div>
                            <div style={{ textAlign: 'center' }}>Revenue</div>
                            <div style={{ textAlign: 'center' }}>Avg Price</div>
                            <div style={{ textAlign: 'center' }}>Returns</div>
                            <div style={{ textAlign: 'center' }}>Performance</div>
                          </div>
                          
                          {amazonData.variants && amazonData.variants.length > 0 ? (
                            amazonData.variants.map((variant, index) => (
                              <div key={index} style={{ 
                                padding: '1rem 1.5rem',
                                borderBottom: index < amazonData.variants.length - 1 ? '1px solid #f1f5f9' : 'none',
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                                gap: '1rem',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                    {variant.name}
                                  </div>
                                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    SKU: {variant.sku}
                                  </div>
                                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    ASIN: {variant.asin || 'N/A'} | 
                                    Units: {safeNumberFormat(variant.unitsSold)}
                                  </div>
                                </div>
                                
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                    {safeNumberFormat(variant.unitsSold)}
                                  </div>
                                </div>
                                
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontWeight: '600', color: '#059669' }}>
                                    {formatCurrency(variant.revenue || 0)}
                                  </div>
                                </div>
                                
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                    {formatCurrency(variant.avgPrice || 0)}
                                  </div>
                                </div>
                                
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontWeight: '600', color: '#ef4444' }}>
                                    {variant.returnQuantity > 0 ? variant.returnQuantity.toLocaleString() : '0'}
                                  </div>
                                  {variant.returnRate > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                      {variant.returnRate.toFixed(1)}% rate
                                    </div>
                                  )}
                                </div>
                                
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ 
                                    display: 'inline-block',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    background: variant.performance === 'Top Performer' ? '#dcfce7' : 
                                               variant.performance === 'Good' ? '#fef3c7' : '#f1f5f9',
                                    color: variant.performance === 'Top Performer' ? '#15803d' : 
                                           variant.performance === 'Good' ? '#d97706' : '#64748b'
                                  }}>
                                    {variant.performance || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{
                              padding: '2rem',
                              textAlign: 'center',
                              color: '#64748b',
                              background: 'rgba(248, 250, 252, 0.5)',
                              borderRadius: '12px'
                            }}>
                              No variant data available
                            </div>
                          )}
                          </div>
                        </div>

                        {/* Charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                                Units Sold Distribution
                              </h3>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                                Breakdown by variant performance
                              </p>
                            </div>
                            <div style={{ 
                              height: '280px',
                              background: 'rgba(248, 250, 252, 0.5)',
                              borderRadius: '16px',
                              padding: '1rem',
                              border: '1px solid rgba(226, 232, 240, 0.5)'
                            }}>
                              {amazonData.variants && amazonData.variants.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={amazonData.variants.map(variant => ({
                                        name: variant.name || 'Unknown',
                                        value: parseInt(variant.unitsSold) || 0,
                                      }))}
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={90}
                                      innerRadius={40}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {amazonData.variants.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip 
                                      formatter={(value) => [value.toLocaleString(), 'Units Sold']}
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
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : (
                                <div style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '100%',
                                  color: '#64748b'
                                }}>
                                  No variant data available
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                                Revenue Distribution
                              </h3>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                                Revenue contribution by variant
                              </p>
                            </div>
                            <div style={{ 
                              height: '280px',
                              background: 'rgba(248, 250, 252, 0.5)',
                              borderRadius: '16px',
                              padding: '1rem',
                              border: '1px solid rgba(226, 232, 240, 0.5)'
                            }}>
                              {amazonData.variants && amazonData.variants.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={amazonData.variants.map(variant => ({
                                      name: variant.name || 'Unknown',
                                      revenue: parseFloat(variant.revenue) || 0,
                                    }))}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                                    <XAxis 
                                      dataKey="name" 
                                      tick={{ fontSize: 12, fill: '#64748b' }}
                                      axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <YAxis 
                                      tick={{ fontSize: 12, fill: '#64748b' }}
                                      axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <Tooltip 
                                      formatter={(value) => [formatCurrency(value), 'Revenue']}
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
                                    <Bar dataKey="revenue" fill="#667eea" />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '100%',
                                  color: '#64748b'
                                }}>
                                  No variant data available
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </SectionContent>
                    </SectionCard>

                    {/* Customer Insights Section */}
                    <SectionCard>
                      <SectionHeader>
                        <SectionTitle>
                          <FiUsers size={20} style={{ color: '#06b6d4' }} />
                          Amazon Customer Insights
                        </SectionTitle>
                        <SectionDescription>Customer behavior and acquisition metrics</SectionDescription>
                      </SectionHeader>
                      <SectionContent>
                        <CompactGrid>
                          <ModernMetricCard
                            title="Total Customers"
                            value={safeNumberFormat(amazonData.customers?.totalCustomers || 0)}
                            icon={FiUsers}
                            change="N/A"
                            changeType="info"
                            color="#3b82f6"
                          />
                          <ModernMetricCard
                            title="Repeat Customers"
                            value={safeNumberFormat(amazonData.customers?.repeatCustomers || 0)}
                            icon={FiTrendingUp}
                            change="N/A"
                            changeType="info"
                            color="#10b981"
                          />
                          <ModernMetricCard
                            title="Repeat Rate"
                            value={`${(amazonData.customers?.repeatRate || 0).toFixed(1)}%`}
                            icon={FiPercent}
                            change="N/A"
                            changeType="info"
                            color="#f59e0b"
                          />
                          <ModernMetricCard
                            title="Avg Orders per Customer"
                            value={(amazonData.customers?.avgOrdersPerCustomer || 0).toFixed(1)}
                            icon={FiShoppingCart}
                            change="N/A"
                            changeType="info"
                            color="#8b5cf6"
                          />
                          <ModernMetricCard
                            title="Acquisition Cost"
                            value={formatCurrency(amazonData.customers?.acquisitionCost || 0)}
                            icon={FiCreditCard}
                            change="N/A"
                            changeType="info"
                            color="#ef4444"
                          />
                        </CompactGrid>

                        {/* Customer Charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                                Customer Type Distribution
                              </h3>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                                First-time vs returning customers
                              </p>
                            </div>
                            <div style={{ 
                              height: '280px',
                              background: 'rgba(248, 250, 252, 0.5)',
                              borderRadius: '16px',
                              padding: '1rem',
                              border: '1px solid rgba(226, 232, 240, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#64748b'
                            }}>
                              Chart data not available
                            </div>
                          </div>

                          <div style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.25rem' }}>
                                Order Frequency Analysis
                              </h3>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                                Customer purchase behavior patterns
                              </p>
                            </div>
                            <div style={{ 
                              height: '280px',
                              background: 'rgba(248, 250, 252, 0.5)',
                              borderRadius: '16px',
                              padding: '1rem',
                              border: '1px solid rgba(226, 232, 240, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#64748b'
                            }}>
                              Chart data not available
                            </div>
                          </div>
                        </div>
                      </SectionContent>
                    </SectionCard>
                  </div>
                )}
              </div>
            )}
          </ModernTabContent>
        </ModernTabContainer>

        
      </ModernContent>
    </ModernContainer>
  );
};

export default ProductDetailsPage;
