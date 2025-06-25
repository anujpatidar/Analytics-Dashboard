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
  FiFilter,
  FiPercent,
  FiBarChart,
  FiTrendingDown,
  FiDownload,
  FiBarChart2,
  FiPackage
} from 'react-icons/fi';
import { 
  FaRupeeSign, 
  FaChartLine, 
  FaCalculator,
  FaShoppingBag,
  FaMoneyBillWave,
  FaBullseye,
  FaUserTie,
  FaChartPie,
  FaBoxes,
  FaShippingFast,
  FaPercentage,
  FaArrowUp,
  FaArrowDown,
  FaCog,
  FaGift,
  FaHandHoldingUsd,
  FaBalanceScale
} from 'react-icons/fa';
import { 
  HiCurrencyRupee,
  HiShoppingCart,
  HiTrendingUp,
  HiTrendingDown,
  HiCalculator,
  HiCash,
  HiChartBar,
  HiScale,
  HiGift
} from 'react-icons/hi';
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
  getRefundMetrics
} from '../../api/ordersAPI';
import { 
  getAmazonOrdersOverview, 
  getAmazonReturnsOverview 
} from '../../api/amazonAPI';
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

// Animated Loading Dots Component
const LoadingDots = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  
  .dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: currentColor;
    opacity: 0.4;
    animation: loadingDots 1.4s infinite ease-in-out;
    
    &:nth-child(1) {
      animation-delay: 0s;
    }
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
  
  @keyframes loadingDots {
    0%, 80%, 100% {
      opacity: 0.4;
      transform: scale(1);
    }
    40% {
      opacity: 1;
      transform: scale(1.2);
    }
  }
`;

// Modern Dashboard Container
const DashboardContainer = styled.div`
  
  min-height: 100vh;
  padding: 1rem 0 1rem 1rem; /* Remove right padding, keep left, top, bottom */
  
  @media (max-width: 768px) {
    padding: 0.5rem 0 0.5rem 0.5rem; /* Remove right padding on mobile too */
  }
`;

const DashboardContent = styled.div`
  width: 100%; /* Use full available width instead of max-width constraint */
  margin: 0;
`;

// Compact Modern Header Section
const HeaderSection = styled.div`
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

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const HeaderTitle = styled.div`
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

const StatsQuickView = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 968px) {
    display: none;
  }
`;

const QuickStat = styled.div`
  text-align: center;
  padding: 0.5rem 0.75rem;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 8px;
  min-width: 80px;
  
  .label {
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .value {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1e293b;
    margin-top: 0.125rem;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: rgba(100, 116, 139, 0.1);
    color: #475569;
    
    &:hover {
      background: rgba(100, 116, 139, 0.2);
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

// Modern Tab Design
const ModernTabContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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

// Date Picker Container with high z-index
const DatePickerContainer = styled.div`
  position: relative;
  z-index: 1001;
  
  .react-datepicker-wrapper {
    position: relative;
    z-index: 1001;
  }
  
  .react-datepicker-popper {
    z-index: 1002 !important;
  }
  
  .react-datepicker {
    z-index: 1002 !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    overflow: hidden;
  }
`;

// Modern Date Controls Section
const DateControlsSection = styled.div`
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1001;
  margin-top: 0.75rem;
  
  .date-control-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
  
  .date-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .icon-wrapper {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .date-text {
      h3 {
        color: white;
        font-size: 0.875rem;
      font-weight: 600;
        margin: 0;
        margin-bottom: 0.125rem;
      }
      
      p {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.75rem;
        margin: 0;
      }
    }
  }
  
  .date-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    @media (max-width: 768px) {
      width: 100%;
      justify-content: center;
    }
  }
`;

// Compact Metric Cards
const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const CompactMetricCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const MetricTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricIcon = styled.div`
  width: 40px;
  height: 40px;
    border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: ${props => props.color || '#667eea'}20;
  color: ${props => props.color || '#667eea'};
`;

const MetricValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
      margin-bottom: 0.5rem;
  line-height: 1;
`;

const MetricChange = styled.div`
      display: flex;
      align-items: center;
  gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  
  ${props => props.type === 'increase' ? `
    color: #059669;
  ` : props.type === 'decrease' ? `
    color: #dc2626;
  ` : `
    color: #64748b;
  `}
`;

// Section Cards
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

// Animated Loading Dots React Component
const AnimatedLoadingDots = () => (
  <LoadingDots>
    <div className="dot"></div>
    <div className="dot"></div>
    <div className="dot"></div>
  </LoadingDots>
);

// Create a modern compact metric component with icons
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
    <div className="metric-value">{loading ? <AnimatedLoadingDots /> : value}</div>
    <div className="metric-change" style={{ 
      color: changeType === 'increase' ? '#059669' : changeType === 'decrease' ? '#dc2626' : '#64748b' 
    }}>
      {change}
    </div>
  </MiniMetricCard>
);

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
  const initialDates = getInitialDates();
  const [dateRange, setDateRange] = useState([initialDates.start, initialDates.end]);
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  
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



  // Function to fetch Amazon data
  const fetchAmazonData = async (dateRange) => {
    try {
      setAmazonLoading(true);
      const { startDate, endDate, store } = dateRange;
      
      const [overviewResponse, returnsResponse] = await Promise.all([
        getAmazonOrdersOverview(startDate, endDate, store),
        getAmazonReturnsOverview(startDate, endDate, store)
      ]);

      setAmazonData(overviewResponse.data);
      setAmazonReturns(returnsResponse.data);
    } catch (error) {
      console.error('Error fetching Amazon data:', error);
      setAmazonData(null);
      setAmazonReturns(null);
    } finally {
      setAmazonLoading(false);
    }
  };

  // Refetch data when store changes
  useEffect(() => {
    console.log('ov',ordersOverview);
    const dateRangeWithStore = getCurrentDateRange();
    refetchAllData(dateRangeWithStore);
    // Also fetch Amazon data
    fetchAmazonData(dateRangeWithStore);
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
    // Also refetch Amazon data
    fetchAmazonData(params);
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

  // Add state for Amazon data
  const [amazonData, setAmazonData] = useState(null);
  const [amazonReturns, setAmazonReturns] = useState(null);
  const [amazonLoading, setAmazonLoading] = useState(false);

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

  // Helper function to safely add values
  const safeAdd = (a, b) => {
    const valueA = (a === null || a === undefined || isNaN(a)) ? 0 : Number(a);
    const valueB = (b === null || b === undefined || isNaN(b)) ? 0 : Number(b);
    return valueA + valueB;
  };

  // Combined metrics for Overall tab
  const combinedOrderStats = [
    {
      title: 'Total Orders',
      value: formatNumber(safeAdd(ordersOverview?.overview?.totalOrders, amazonData?.total_orders)),
      icon: FiShoppingCart,
      change: 'Combined',
      changeType: 'increase',
      color: '#3b82f6',
      tooltip: 'Total orders from MyFrido + Amazon'
    },
    {
      title: 'Average Order Value',
      value: formatCurrency((safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales)) / Math.max(1, safeAdd(ordersOverview?.overview?.totalOrders, amazonData?.total_orders))),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#f59e0b',
      tooltip: 'Combined average order value'
    }
  ];

  const combinedSalesMetrics = [
    {
      title: 'Total Sales',
      value: formatMetricValue(safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales)),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#10b981',
      tooltip: 'Combined sales from all channels'
    },
    {
      title: 'Gross Sales',
      value: formatMetricValue(safeAdd(ordersOverview?.overview?.grossSales, amazonData?.gross_sales)),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#059669',
      tooltip: 'Combined gross sales from all channels'
    },
    {
      title: 'Net Sales',
      value: formatMetricValue(safeAdd(ordersOverview?.overview?.netSales, amazonData?.net_sales)),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#047857',
      tooltip: 'Combined net sales from all channels'
    },
    {
      title: 'Gross Sales %',
      value: formatPercentage(
        ((safeAdd(ordersOverview?.overview?.grossSales, amazonData?.gross_sales)) / 
         Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
      ),
      icon: FiTrendingUp,
      change: 'Combined',
      changeType: 'increase',
      color: '#0d9488',
      tooltip: 'Combined gross sales percentage'
    },
    {
      title: 'Net Sales %',
      value: formatPercentage(
        ((safeAdd(ordersOverview?.overview?.netSales, amazonData?.net_sales)) / 
         Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
      ),
      icon: FiTrendingUp,
      change: 'Combined',
      changeType: 'increase',
      color: '#0d9488',
      tooltip: 'Combined net sales percentage'
    }
  ];

  const combinedReturnMetrics = [
    {
      title: 'Total Returns',
      value: formatMetricValue(safeAdd(ordersOverview?.overview?.totalReturns, amazonReturns?.total_return_amount || amazonData?.total_returns)),
      icon: FiRefreshCw,
      change: 'Combined',
      changeType: 'decrease',
      color: '#ef4444',
      tooltip: 'Combined returns from all channels'
    },
    {
      title: 'Return Rate',
      value: formatPercentage(
        ((safeAdd(ordersOverview?.overview?.totalReturns, amazonReturns?.total_return_amount || amazonData?.total_returns)) / 
         Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
      ),
      icon: FiRefreshCw,
      change: 'Combined',
      changeType: 'decrease',
      color: '#dc2626',
      tooltip: 'Combined return rate percentage'
    }
  ];

  const combinedTaxMetrics = [
    {
      title: 'Total Tax',
      value: formatMetricValue(safeAdd(ordersOverview?.overview?.totalTax, amazonData?.total_tax)),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#6366f1',
      tooltip: 'Combined tax from all channels'
    },
    {
      title: 'Tax Rate',
      value: formatPercentage(
        ((safeAdd(ordersOverview?.overview?.totalTax, amazonData?.total_tax)) / 
         Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
      ),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#4f46e5',
      tooltip: 'Combined tax rate percentage'
    }
  ];

  const combinedExpenseMetrics = [
    {
      title: 'COGS',
      value: formatMetricValue(safeAdd(ordersOverview?.overview?.cogs, amazonData?.cogs)),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#f59e0b',
      tooltip: 'Combined Cost of Goods Sold'
    },
    {
      title: 'COGS %',
      value: formatPercentage(
        ((safeAdd(ordersOverview?.overview?.cogs, amazonData?.cogs)) / 
         Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
      ),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#d97706',
      tooltip: 'Combined COGS percentage'
    },
    {
      title: 'S&D Cost',
      value: formatMetricValue(safeAdd(ordersOverview?.overview?.sdCost, amazonData?.sd_cost || amazonData?.total_shipping)),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#f97316',
      tooltip: 'Combined Shipping and Delivery Costs'
    },
    {
      title: 'S&D Cost %',
      value: formatPercentage(
        ((safeAdd(ordersOverview?.overview?.sdCost, amazonData?.sd_cost || amazonData?.total_shipping)) / 
         Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
      ),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#ea580c',
      tooltip: 'Combined S&D Cost percentage'
    }
  ];

  const combinedMarketingMetrics = [
    {
      title: 'Total Marketing Cost',
      value: formatMetricValue(safeAdd(ordersOverview?.marketing?.totalSpend, 0)), // Amazon marketing data not available
      icon: FaRupeeSign,
      change: 'MyFrido Only',
      changeType: 'increase',
      color: '#8b5cf6',
      tooltip: 'Marketing costs (Amazon data not available)'
    },
    {
      title: 'Marketing Cost %',
      value: formatPercentage(
        ((safeAdd(ordersOverview?.marketing?.totalSpend, 0)) / 
         Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
      ),
      icon: FaRupeeSign,
      change: 'MyFrido Only',
      changeType: 'increase',
      color: '#7c3aed',
      tooltip: 'Marketing cost percentage (Amazon data not available)'
    }
  ];

  const combinedRoasMetrics = [
    {
      title: 'Gross ROAS',
      value: 'N/A',
      icon: FiTrendingUp,
      change: 'Needs Marketing Data',
      changeType: 'increase',
      color: '#06b6d4',
      tooltip: 'Combined ROAS calculation pending marketing data'
    },
    {
      title: 'Gross MER',
      value: 'N/A',
      icon: FiTrendingUp,
      change: 'Needs Marketing Data',
      changeType: 'increase',
      color: '#0891b2',
      tooltip: 'Combined MER calculation pending marketing data'
    },
    {
      title: 'Net ROAS',
      value: 'N/A',
      icon: FiTrendingUp,
      change: 'Needs Marketing Data',
      changeType: 'increase',
      color: '#0e7490',
      tooltip: 'Combined Net ROAS calculation pending marketing data'
    },
    {
      title: 'Net MER',
      value: 'N/A',
      icon: FiTrendingUp,
      change: 'Needs Marketing Data',
      changeType: 'increase',
      color: '#155e75',
      tooltip: 'Combined Net MER calculation pending marketing data'
    },
    {
      title: 'N-ROAS',
      value: 'N/A',
      icon: FiTrendingUp,
      change: 'Needs Marketing Data',
      changeType: 'increase',
      color: '#164e63',
      tooltip: 'Combined N-ROAS calculation pending marketing data'
    },
    {
      title: 'N-MER',
      value: 'N/A',
      icon: FiTrendingUp,
      change: 'Needs Marketing Data',
      changeType: 'increase',
      color: '#134e4a',
      tooltip: 'Combined N-MER calculation pending marketing data'
    }
  ];

  const combinedCacMetrics = [
    {
      title: 'CAC',
      value: 'N/A',
      icon: FaRupeeSign,
      change: 'Needs Marketing Data',
      changeType: 'increase',
      color: '#ec4899',
      tooltip: 'Combined CAC calculation pending marketing data'
    },
    {
      title: 'N-CAC',
      value: 'N/A',
      icon: FaRupeeSign,
      change: 'Needs Marketing Data',
      changeType: 'increase',
      color: '#db2777',
      tooltip: 'Combined N-CAC calculation pending marketing data'
    }
  ];

  const combinedContributionMarginMetrics = [
    {
      title: 'CM2',
      value: formatMetricValue(safeAdd(ordersOverview?.overview?.cm2, amazonData?.cm2)),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#14b8a6',
      tooltip: 'Combined Contribution Margin Level 2'
    },
    {
      title: 'CM2 %',
      value: formatPercentage(
        ((safeAdd(ordersOverview?.overview?.cm2, amazonData?.cm2)) / 
         Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
      ),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#0d9488',
      tooltip: 'Combined CM2 percentage'
    },
    {
      title: 'CM3',
      value: formatMetricValue(safeAdd(ordersOverview?.overview?.cm3, amazonData?.cm3)),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#0f766e',
      tooltip: 'Combined Contribution Margin Level 3'
    },
    {
      title: 'CM3 %',
      value: formatPercentage(
        ((safeAdd(ordersOverview?.overview?.cm3, amazonData?.cm3)) / 
         Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
      ),
      icon: FaRupeeSign,
      change: 'Combined',
      changeType: 'increase',
      color: '#115e59',
      tooltip: 'Combined CM3 percentage'
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

  console.log(ordersOverview,'data');

  return (
    <DashboardContainer>
      <DashboardContent>
        {/* Modern Header */}
        <HeaderSection>
          <HeaderContent>
            <HeaderLeft>
              <HeaderTitle>
                <h1>Analytics Dashboard</h1>
                <p>Real-time insights across all your sales channels</p>
              </HeaderTitle>
              
              <StatsQuickView>
                <QuickStat>
                  <div className="label">Orders</div>
                  <div className="value">
                    {ordersOverviewLoading || amazonLoading ? <AnimatedLoadingDots /> : formatNumber(safeAdd(ordersOverview?.overview?.totalOrders, amazonData?.total_orders))}
              </div>
                </QuickStat>
                <QuickStat>
                  <div className="label">Revenue</div>
                  <div className="value">
                    {ordersOverviewLoading || amazonLoading ? <AnimatedLoadingDots /> : formatMetricValue(safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))}
            </div>
                </QuickStat>
                <QuickStat>
                  <div className="label">AOV</div>
                  <div className="value">
                    {ordersOverviewLoading || amazonLoading ? <AnimatedLoadingDots /> : formatCurrency((safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales)) / Math.max(1, safeAdd(ordersOverview?.overview?.totalOrders, amazonData?.total_orders)))}
                  </div>
                </QuickStat>
              </StatsQuickView>
            </HeaderLeft>
            
            <HeaderActions>
              <ActionButton 
                className="primary"
                onClick={() => refetchAllData(getCurrentDateRange())}
                disabled={ordersOverviewLoading || refundMetricsLoading || amazonLoading}
              >
                <FiRefreshCw size={14} className={`${(ordersOverviewLoading || refundMetricsLoading || amazonLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </ActionButton>
              <ActionButton 
                className="secondary"
                onClick={() => {/* Add export functionality */}}
                disabled={ordersOverviewLoading}
              >
                <FiDownload size={14} />
                Export
              </ActionButton>
            </HeaderActions>
          </HeaderContent>

          {/* Modern Date Range Controls */}
          <DateControlsSection>
            <div className="date-control-header">
              <div className="date-info">
                <div className="icon-wrapper">
                  <FiBarChart2 size={20} />
            </div>
                <div className="date-text">
                  <h3>Date Range Selection</h3>
                  <p>
                    {isCustomDateRange && dateRange[0] && dateRange[1]
                      ? `${format(dateRange[0], 'MMM d, yyyy')} - ${format(dateRange[1], 'MMM d, yyyy')}`
                      : `Last ${timeframe === 'day' ? '24 hours' : timeframe === 'week' ? '7 days' : timeframe === 'month' ? '30 days' : 'year'}`
                    }
                  </p>
          </div>
                </div>
              
              <div className="date-controls">
                <select
                  value={isCustomDateRange ? 'custom' : timeframe}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomDateRange(true);
                    } else {
                      handleTimeframeChange(e.target.value);
                    }
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    color: '#374151',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                
                <DatePickerContainer>
                <DatePicker
                  selected={dateRange[0]}
                  onChange={handleDateRangeChange}
                  startDate={dateRange[0]}
                  endDate={dateRange[1]}
                  selectsRange
                  dateFormat="MMM dd, yyyy"
                  showTimeSelect={false}
                    className="px-3 py-2 border border-white/20 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-white/30 bg-white/90 backdrop-blur-md shadow-lg min-w-[200px] font-medium"
                  placeholderText="Select date range"
                  maxDate={new Date()}
                    calendarClassName="modern-datepicker"
                    popperClassName="datepicker-popper"
                />
                </DatePickerContainer>
                
                {isCustomDateRange && (
                  <ActionButton
                    className="secondary"
                    onClick={() => {
                      setIsCustomDateRange(false);
                      setTimeframe('week');
                      const dateRange = getDateRange('week');
                      refetchAllData(dateRange);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    Reset
                  </ActionButton>
                )}
              </div>
            </div>
          </DateControlsSection>
        </HeaderSection>

        {/* Modern Marketplace Tabs */}
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
                <SectionCard>
                  <SectionHeader>
                    <h2>📊 Key Performance Overview</h2>
                    <p>Combined metrics across all sales channels</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      <ModernMetricCard
                        title="Total Orders"
                        value={formatNumber(safeAdd(ordersOverview?.overview?.totalOrders, amazonData?.total_orders))}
                        icon={HiShoppingCart}
                        change="Combined"
                        changeType="increase"
                        color="#3b82f6"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="Average Order Value"
                        value={formatCurrency((safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales)) / Math.max(1, safeAdd(ordersOverview?.overview?.totalOrders, amazonData?.total_orders)))}
                        icon={FaMoneyBillWave}
                        change="Combined"
                        changeType="increase"
                        color="#f59e0b"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="Total Sales"
                        value={formatMetricValue(safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))}
                        icon={FaChartLine}
                        change="Combined"
                        changeType="increase"
                        color="#10b981"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="Gross Sales"
                        value={formatMetricValue(safeAdd(ordersOverview?.overview?.grossSales, amazonData?.gross_sales))}
                        icon={HiCash}
                        change="Combined"
                        changeType="increase"
                        color="#059669"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="Net Sales"
                        value={formatMetricValue(safeAdd(ordersOverview?.overview?.netSales, amazonData?.net_sales))}
                        icon={FaBalanceScale}
                        change="Combined"
                        changeType="increase"
                        color="#047857"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="Gross Sales %"
                        value={formatPercentage(
                          ((safeAdd(ordersOverview?.overview?.grossSales, amazonData?.gross_sales)) / 
                           Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
                        )}
                        icon={FaPercentage}
                        change="Combined"
                        changeType="increase"
                        color="#0d9488"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                <SectionCard>
                  <SectionHeader>
                    <h2>💰 Financial Metrics</h2>
                    <p>Revenue, costs, and profitability</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      {/* Returns */}
                      <ModernMetricCard
                        title="Total Returns"
                        value={formatMetricValue(safeAdd(ordersOverview?.overview?.totalReturns, amazonReturns?.total_return_amount || amazonData?.total_returns))}
                        icon={HiTrendingDown}
                        change="Combined"
                        changeType="decrease"
                        color="#ef4444"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="Return Rate"
                        value={formatPercentage(
                          ((safeAdd(ordersOverview?.overview?.totalReturns, amazonReturns?.total_return_amount || amazonData?.total_returns)) / 
                           Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
                        )}
                        icon={FiTrendingDown}
                        change="Combined"
                        changeType="decrease"
                        color="#dc2626"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      {/* Tax */}
                      <ModernMetricCard
                        title="Total Tax"
                        value={formatMetricValue(safeAdd(ordersOverview?.overview?.totalTax, amazonData?.total_tax))}
                        icon={HiCalculator}
                        change="Combined"
                        changeType="increase"
                        color="#6366f1"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="Tax Rate"
                        value={formatPercentage(
                          ((safeAdd(ordersOverview?.overview?.totalTax, amazonData?.total_tax)) / 
                           Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
                        )}
                        icon={FaCalculator}
                        change="Combined"
                        changeType="increase"
                        color="#4f46e5"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      {/* Expenses */}
                      <ModernMetricCard
                        title="COGS"
                        value={formatMetricValue(safeAdd(ordersOverview?.overview?.cogs, amazonData?.cogs))}
                        icon={FaBoxes}
                        change="Combined"
                        changeType="increase"
                        color="#f59e0b"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="COGS %"
                        value={formatPercentage(
                          ((safeAdd(ordersOverview?.overview?.cogs, amazonData?.cogs)) / 
                           Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
                        )}
                        icon={FaChartPie}
                        change="Combined"
                        changeType="increase"
                        color="#d97706"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="S&D Cost"
                        value={formatMetricValue(safeAdd(ordersOverview?.overview?.sdCost, amazonData?.sd_cost || amazonData?.total_shipping))}
                        icon={FaShippingFast}
                        change="Combined"
                        changeType="increase"
                        color="#f97316"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="S&D Cost %"
                        value={formatPercentage(
                          ((safeAdd(ordersOverview?.overview?.sdCost, amazonData?.sd_cost || amazonData?.total_shipping)) / 
                           Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
                        )}
                        icon={FiPackage}
                        change="Combined"
                        changeType="increase"
                        color="#ea580c"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                <SectionCard>
                  <SectionHeader>
                    <h2>📈 Marketing & Performance</h2>
                    <p>ROAS, CAC, and marketing efficiency</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      {/* Marketing - MyFrido Only */}
                      <ModernMetricCard
                        title="Marketing Spend"
                        value={formatMetricValue(ordersOverview?.overview?.marketingSpend)}
                        icon={FaBullseye}
                        change="MyFrido Only"
                        changeType="increase"
                        color="#8b5cf6"
                        loading={ordersOverviewLoading}
                      />
                      <ModernMetricCard
                        title="Marketing %"
                        value={formatPercentage((ordersOverview?.overview?.marketingSpend / Math.max(1, ordersOverview?.overview?.totalSales)) * 100)}
                        icon={FiTarget}
                        change="MyFrido Only"
                        changeType="increase"
                        color="#7c3aed"
                        loading={ordersOverviewLoading}
                      />
                      {/* ROAS - Not Available for Combined */}
                      <ModernMetricCard
                        title="ROAS"
                        value="N/A"
                        icon={FaHandHoldingUsd}
                        change="Data Not Available"
                        changeType="neutral"
                        color="#64748b"
                        loading={false}
                      />
                      <ModernMetricCard
                        title="Target ROAS"
                        value="N/A"
                        icon={FaBullseye}
                        change="Data Not Available"
                        changeType="neutral"
                        color="#64748b"
                        loading={false}
                      />
                      {/* CAC - Not Available for Combined */}
                      <ModernMetricCard
                        title="CAC"
                        value="N/A"
                        icon={FaUserTie}
                        change="Data Not Available"
                        changeType="neutral"
                        color="#64748b"
                        loading={false}
                      />
                      <ModernMetricCard
                        title="LTV/CAC"
                        value="N/A"
                        icon={FaChartLine}
                        change="Data Not Available"
                        changeType="neutral"
                        color="#64748b"
                        loading={false}
                      />
                      {/* Contribution Margin */}
                      <ModernMetricCard
                        title="CM2"
                        value={formatMetricValue(safeAdd(ordersOverview?.overview?.cm2, amazonData?.cm2))}
                        icon={HiChartBar}
                        change="Combined"
                        changeType="increase"
                        color="#059669"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="CM2 %"
                        value={formatPercentage(
                          ((safeAdd(ordersOverview?.overview?.cm2, amazonData?.cm2)) / 
                           Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
                        )}
                        icon={FiBarChart}
                        change="Combined"
                        changeType="increase"
                        color="#047857"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="CM3"
                        value={formatMetricValue(safeAdd(ordersOverview?.overview?.cm3, amazonData?.cm3))}
                        icon={HiScale}
                        change="Combined"
                        changeType="increase"
                        color="#0d9488"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                      <ModernMetricCard
                        title="CM3 %"
                        value={formatPercentage(
                          ((safeAdd(ordersOverview?.overview?.cm3, amazonData?.cm3)) / 
                           Math.max(1, safeAdd(ordersOverview?.overview?.totalSales, amazonData?.total_sales))) * 100
                        )}
                        icon={FiBarChart2}
                        change="Combined"
                        changeType="increase"
                        color="#0f766e"
                        loading={ordersOverviewLoading || amazonLoading}
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>
                    </div>
            )}
                  
            {/* MyFrido Tab Content */}
                  {activeTab === 'myfrido' && (
              <div>
                <SectionCard>
                  <SectionHeader>
                    <h2>🏪 MyFrido Performance</h2>
                    <p>Direct sales and website analytics</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      <ModernMetricCard
                        title="Total Orders"
                        value={formatNumber(ordersOverview?.overview?.totalOrders)}
                        icon={HiShoppingCart}
                        change="vs last period"
                        changeType="increase"
                        color="#3b82f6"
                              loading={ordersOverviewLoading}
                            />
                      <ModernMetricCard
                        title="Average Order Value"
                        value={formatCurrency(ordersOverview?.overview?.aov)}
                        icon={FaMoneyBillWave}
                        change="vs last period"
                        changeType="increase"
                        color="#f59e0b"
                              loading={ordersOverviewLoading}
                            />
                      <ModernMetricCard
                        title="Total Sales"
                        value={formatMetricValue(ordersOverview?.overview?.totalSales)}
                        icon={FaChartLine}
                        change="vs last period"
                        changeType="increase"
                        color="#10b981"
                              loading={ordersOverviewLoading}
                            />
                      <ModernMetricCard
                        title="Gross Sales"
                        value={formatMetricValue(ordersOverview?.overview?.grossSales)}
                        icon={HiCash}
                        change="vs last period"
                        changeType="increase"
                        color="#059669"
                              loading={ordersOverviewLoading}
                            />
                      <ModernMetricCard
                        title="Net Sales"
                        value={formatMetricValue(ordersOverview?.overview?.netSales)}
                        icon={FaBalanceScale}
                        change="vs last period"
                        changeType="increase"
                        color="#047857"
                              loading={ordersOverviewLoading}
                            />
                      <ModernMetricCard
                        title="Gross Sales %"
                        value={formatPercentage(ordersOverview?.overview?.grossSalesPercentage)}
                        icon={FaPercentage}
                        change="vs last period"
                        changeType="increase"
                        color="#0d9488"
                              loading={ordersOverviewLoading}
                            />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                <SectionCard>
                  <SectionHeader>
                    <h2>💰 Financial Metrics</h2>
                    <p>Revenue, costs, and profitability</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      {/* Returns */}
                      <ModernMetricCard
                        title="Total Returns"
                        value={formatMetricValue(ordersOverview?.overview?.totalReturns)}
                        icon={HiTrendingDown}
                        change="vs last period"
                        changeType="decrease"
                        color="#ef4444"
                            loading={ordersOverviewLoading}
                          />
                      <ModernMetricCard
                        title="Return Rate"
                        value={formatPercentage(ordersOverview?.overview?.returnRate)}
                        icon={FiTrendingDown}
                        change="vs last period"
                        changeType="decrease"
                        color="#dc2626"
                            loading={ordersOverviewLoading}
                          />
                      {/* Tax */}
                      <ModernMetricCard
                        title="Total Tax"
                        value={formatMetricValue(ordersOverview?.overview?.totalTax)}
                        icon={HiCalculator}
                        change="vs last period"
                        changeType="increase"
                        color="#6366f1"
                            loading={ordersOverviewLoading}
                          />
                      <ModernMetricCard
                        title="Tax Rate"
                        value={formatPercentage(ordersOverview?.overview?.taxRate)}
                        icon={FaCalculator}
                        change="vs last period"
                        changeType="increase"
                        color="#4f46e5"
                        loading={ordersOverviewLoading}
                      />
                      {/* Expenses */}
                      <ModernMetricCard
                        title="COGS"
                        value={formatMetricValue(ordersOverview?.overview?.cogs)}
                        icon={FaBoxes}
                        change="vs last period"
                        changeType="increase"
                        color="#f59e0b"
                        loading={ordersOverviewLoading}
                      />
                      <ModernMetricCard
                        title="COGS %"
                        value={formatPercentage(ordersOverview?.overview?.cogsPercentage)}
                        icon={FaChartPie}
                        change="vs last period"
                        changeType="increase"
                        color="#d97706"
                        loading={ordersOverviewLoading}
                      />
                      <ModernMetricCard
                        title="S&D Cost"
                        value={formatMetricValue(ordersOverview?.overview?.sdCost)}
                        icon={FaShippingFast}
                        change="vs last period"
                        changeType="increase"
                        color="#f97316"
                        loading={ordersOverviewLoading}
                      />
                      <ModernMetricCard
                        title="S&D Cost %"
                        value={formatPercentage(ordersOverview?.overview?.sdCostPercentage)}
                        icon={FiPackage}
                        change="vs last period"
                        changeType="increase"
                        color="#ea580c"
                        loading={ordersOverviewLoading}
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                <SectionCard>
                  <SectionHeader>
                    <h2>📈 Marketing & Performance</h2>
                    <p>ROAS, CAC, and marketing efficiency</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      {/* Marketing */}
                      <ModernMetricCard
                        title="Marketing Spend"
                        value={formatMetricValue(ordersOverview?.marketing?.totalSpend)}
                        icon={FaBullseye}
                        change="vs last period"
                        changeType="increase"
                        color="#8b5cf6"
                        loading={ordersOverviewLoading}
                      />
                      <ModernMetricCard
                        title="Marketing %"
                        value={formatPercentage((ordersOverview?.marketing?.totalSpend / Math.max(1, ordersOverview?.overview?.totalSales)) * 100)}
                        icon={FiTarget}
                        change="vs last period"
                        changeType="increase"
                        color="#7c3aed"
                        loading={ordersOverviewLoading}
                      />
                      {/* ROAS */}
                      <ModernMetricCard
                        title="GrossROAS"
                        value={(ordersOverview?.overview?.grossRoas?.toFixed(2))}
                        icon={FaHandHoldingUsd}
                        change="vs last period"
                        changeType="increase"
                        color="#10b981"
                        loading={ordersOverviewLoading}
                      />
                      <ModernMetricCard
                        title="NetROAS"
                        value={(ordersOverview?.overview?.netRoas?.toFixed(2))}
                        icon={FaBullseye}
                        change="vs last period"
                        changeType="increase"
                        color="#059669"
                        loading={ordersOverviewLoading}
                      />
                      <ModernMetricCard
                        title="N-ROAS"
                        value={(ordersOverview?.overview?.nRoas?.toFixed(2))}
                        icon={FaBullseye}
                        change="vs last period"
                        changeType="increase"
                        color="#059669"
                        loading={ordersOverviewLoading}
                      />
                      {/* CAC */}
                      <ModernMetricCard
                        title="CAC"
                        value={formatCurrency(ordersOverview?.overview?.cac)}
                        icon={FaUserTie}
                        change="vs last period"
                        changeType="decrease"
                        color="#ef4444"
                        loading={ordersOverviewLoading}
                      />
                     
                      {/* Contribution Margin */}
                      <ModernMetricCard
                        title="CM2"
                        value={formatMetricValue(ordersOverview?.overview?.cm2)}
                        icon={HiChartBar}
                        change="vs last period"
                        changeType="increase"
                        color="#059669"
                        loading={ordersOverviewLoading}
                      />
                      <ModernMetricCard
                        title="CM2 %"
                        value={formatPercentage(ordersOverview?.overview?.cm2Percentage)}
                        icon={FiBarChart}
                        change="vs last period"
                        changeType="increase"
                        color="#047857"
                        loading={ordersOverviewLoading}
                      />
                      <ModernMetricCard
                        title="CM3"
                        value={formatMetricValue(ordersOverview?.overview?.cm3)}
                        icon={HiScale}
                        change="vs last period"
                        changeType="increase"
                        color="#0d9488"
                        loading={ordersOverviewLoading}
                      />
                      <ModernMetricCard
                        title="CM3 %"
                        value={formatPercentage(ordersOverview?.overview?.cm3Percentage)}
                        icon={FiBarChart2}
                        change="vs last period"
                        changeType="increase"
                        color="#0f766e"
                        loading={ordersOverviewLoading}
                      />
                    </CompactGrid>
                  </SectionContent>=-6780-=
                </SectionCard>
                            </div>
                          )}

            {/* Amazon Tab Content */}
            {activeTab === 'amazon' && (
              <div>
                <SectionCard>
                  <SectionHeader>
                    <h2>📦 Amazon Performance</h2>
                    <p>Marketplace sales and analytics</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      {/* Amazon Orders Metrics */}
                      <ModernMetricCard
                        title="Total Orders"
                        value={formatNumber(amazonData?.total_orders || 0)}
                        icon={HiShoppingCart}
                        change="vs last period"
                        changeType="increase"
                        color="#3b82f6"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="Average Order Value"
                        value={formatCurrency(amazonData?.average_order_value || 0)}
                        icon={FaMoneyBillWave}
                        change="vs last period"
                        changeType="increase"
                        color="#f59e0b"
                        loading={amazonLoading}
                      />
                      {/* Amazon Sales Metrics */}
                      <ModernMetricCard
                        title="Total Sales"
                        value={formatCurrency(amazonData?.total_sales || 0)}
                        icon={FaChartLine}
                        change="vs last period"
                        changeType="increase"
                        color="#10b981"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="Gross Sales"
                        value={formatCurrency(amazonData?.gross_sales || 0)}
                        icon={HiCash}
                        change="vs last period"
                        changeType="increase"
                        color="#059669"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="Net Sales"
                        value={formatCurrency(amazonData?.net_sales || 0)}
                        icon={FaBalanceScale}
                        change="vs last period"
                        changeType="increase"
                        color="#047857"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="Gross Sales %"
                        value={formatPercentage(amazonData?.gross_sales_percentage || (amazonData?.gross_sales && amazonData?.total_sales ? (amazonData.gross_sales / amazonData.total_sales) * 100 : null))}
                        icon={FaPercentage}
                        change="vs last period"
                        changeType="increase"
                        color="#0d9488"
                        loading={amazonLoading}
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                <SectionCard>
                  <SectionHeader>
                    <h2>💰 Financial Metrics</h2>
                    <p>Revenue, costs, and profitability</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      {/* Returns */}
                      <ModernMetricCard
                        title="Total Returns"
                        value={formatCurrency(amazonReturns?.total_return_amount || amazonData?.total_returns || 0)}
                        icon={HiTrendingDown}
                        change="vs last period"
                        changeType="decrease"
                        color="#ef4444"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="Return Rate %"
                        value={formatPercentage(amazonReturns?.return_rate_percentage || amazonData?.return_rate || 0)}
                        icon={FiTrendingDown}
                        change="vs last period"
                        changeType="decrease"
                        color="#dc2626"
                        loading={amazonLoading}
                      />
                      {/* Tax */}
                      <ModernMetricCard
                        title="Total Tax"
                        value={formatCurrency(amazonData?.total_tax || 0)}
                        icon={HiCalculator}
                        change="vs last period"
                        changeType="increase"
                        color="#6366f1"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="Tax Rate %"
                        value={formatPercentage(amazonData?.tax_rate ? amazonData.tax_rate * 100 : 0)}
                        icon={FaCalculator}
                        change="vs last period"
                        changeType="increase"
                        color="#4f46e5"
                        loading={amazonLoading}
                      />
                      {/* Expenses */}
                      <ModernMetricCard
                        title="COGS"
                        value={formatCurrency(amazonData?.cogs || 0)}
                        icon={FaBoxes}
                        change="vs last period"
                        changeType="increase"
                        color="#f59e0b"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="COGS %"
                        value={formatPercentage(amazonData?.cogs_percentage || 0)}
                        icon={FaChartPie}
                        change="vs last period"
                        changeType="increase"
                        color="#d97706"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="S&D Cost"
                        value={formatCurrency(amazonData?.sd_cost || amazonData?.total_shipping || 0)}
                        icon={FaShippingFast}
                        change="vs last period"
                        changeType="increase"
                        color="#f97316"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="S&D Cost %"
                        value={formatPercentage(amazonData?.sd_cost_percentage || (amazonData?.sd_cost && amazonData?.total_sales ? (amazonData.sd_cost / amazonData.total_sales) * 100 : 0))}
                        icon={FiPackage}
                        change="vs last period"
                        changeType="increase"
                        color="#ea580c"
                        loading={amazonLoading}
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>

                <SectionCard>
                  <SectionHeader>
                    <h2>📈 Marketing & Performance</h2>
                    <p>ROAS, CAC, and marketing efficiency</p>
                  </SectionHeader>
                  <SectionContent>
                    <CompactGrid>
                      {/* Marketing */}
                      <ModernMetricCard
                        title="Total Marketing Cost"
                        value="N/A"
                        icon={FaBullseye}
                        change="Amazon data not available"
                        changeType="neutral"
                        color="#64748b"
                        loading={false}
                      />
                      <ModernMetricCard
                        title="Marketing Cost %"
                        value="N/A"
                        icon={FiTarget}
                        change="Amazon data not available"
                        changeType="neutral"
                        color="#64748b"
                        loading={false}
                      />
                      {/* ROAS */}
                      <ModernMetricCard
                        title="Gross ROAS"
                        value="N/A"
                        icon={FaHandHoldingUsd}
                        change="Needs marketing data"
                        changeType="neutral"
                        color="#64748b"
                        loading={false}
                      />
                      <ModernMetricCard
                        title="Net ROAS"
                        value="N/A"
                        icon={FaBullseye}
                        change="Needs marketing data"
                        changeType="neutral"
                        color="#64748b"
                        loading={false}
                      />
                      {/* CAC */}
                      <ModernMetricCard
                        title="CAC"
                        value="N/A"
                        icon={FaUserTie}
                        change="Needs marketing data"
                        changeType="neutral"
                        color="#64748b"
                        loading={false}
                      />
                      <ModernMetricCard
                        title="N-CAC"
                        value="N/A"
                        icon={FaChartLine}
                        change="Needs marketing data"
                        changeType="neutral"
                        color="#64748b"
                        loading={false}
                      />
                      {/* Contribution Margin */}
                      <ModernMetricCard
                        title="CM2"
                        value={formatCurrency(amazonData?.cm2 || 0)}
                        icon={HiChartBar}
                        change="vs last period"
                        changeType="increase"
                        color="#059669"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="CM2 %"
                        value={formatPercentage(amazonData?.cm2_percentage || (amazonData?.cm2 && amazonData?.total_sales ? (amazonData.cm2 / amazonData.total_sales) * 100 : 0))}
                        icon={FiBarChart}
                        change="vs last period"
                        changeType="increase"
                        color="#047857"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="CM3"
                        value={formatCurrency(amazonData?.cm3 || 0)}
                        icon={HiScale}
                        change="vs last period"
                        changeType="increase"
                        color="#0d9488"
                        loading={amazonLoading}
                      />
                      <ModernMetricCard
                        title="CM3 %"
                        value={formatPercentage(amazonData?.cm3_percentage || (amazonData?.cm3 && amazonData?.total_sales ? (amazonData.cm3 / amazonData.total_sales) * 100 : 0))}
                        icon={FiBarChart2}
                        change="vs last period"
                        changeType="increase"
                        color="#0f766e"
                        loading={amazonLoading}
                      />
                    </CompactGrid>
                  </SectionContent>
                </SectionCard>
                    </div>
                  )}
                            </ModernTabContent>
        </ModernTabContainer>
      </DashboardContent>
    </DashboardContainer>
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
