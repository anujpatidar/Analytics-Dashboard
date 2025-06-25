import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FiPackage, 
  FiRefreshCw, 
  FiDownload, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiCalendar,
  FiBarChart2,
  FiDollarSign,
  FiTarget,
  FiPercent,
  FiUsers,
  FiUserCheck
} from 'react-icons/fi';
import { 
  FaRupeeSign,
  FaBoxes,
  FaMoneyBillWave
} from 'react-icons/fa';
import { 
  HiShoppingCart,
  HiCash,
  HiChartBar
} from 'react-icons/hi';
import StoreIndicator from '../../components/Dashboard/StoreIndicator';
import { useStore } from '../../context/StoreContext';
import { getAllProductsList, getOverallProductMetrics } from '../../api/productsAPI';
import './ProductsPage.css';
import { formatCurrency } from '../../utils/formatters';

// Modern Dashboard Container - matching DashboardPage design
const ModernContainer = styled.div`
  min-height: 100vh;
  padding: 1rem;
  background: #f8fafc;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const ModernContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
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

const ModernHeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const ModernActionButton = styled.button`
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
    background: rgba(255, 255, 255, 0.9);
    color: #64748b;
    border: 1px solid rgba(0, 0, 0, 0.1);
    
    &:hover {
      background: white;
      color: #374151;
      border-color: rgba(0, 0, 0, 0.2);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// Modern Date Controls
const ModernDateControlsSection = styled.div`
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
      background: rgba(102, 126, 234, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
    }
    
    .date-text {
      h3 {
        color: #1e293b;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
        margin-bottom: 0.125rem;
      }
      
      p {
        color: #64748b;
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
      flex-wrap: wrap;
    }
  }
`;

const ModernQuickDateButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ModernQuickDateButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.9)'};
  color: ${props => props.active ? 'white' : '#667eea'};
  border: 1px solid ${props => props.active ? 'transparent' : '#667eea'};
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#667eea'};
    color: white;
    transform: translateY(-1px);
  }
`;

// Modern Tab System
const ModernTabContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  z-index: 100;
`;

const ModernTabHeader = styled.div`
  display: flex;
  background: rgba(248, 250, 252, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ModernTabButton = styled.button`
  flex: 1;
  min-width: 140px;
  padding: 1rem 1.5rem;
  background: ${props => props.active ? 'white' : 'transparent'};
  color: ${props => props.active ? '#667eea' : '#64748b'};
  border: none;
  font-weight: ${props => props.active ? '600' : '500'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-bottom: ${props => props.active ? '3px solid #667eea' : '3px solid transparent'};
  
  &:hover {
    background: ${props => props.active ? 'white' : 'rgba(102, 126, 234, 0.05)'};
    color: #667eea;
  }
  
  .icon {
    margin-right: 0.5rem;
    font-size: 1rem;
  }
  
  .tab-badge {
    background: ${props => props.active ? '#667eea' : '#6b7280'};
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    margin-left: 0.5rem;
    font-weight: 500;
  }
`;

const ModernTabContent = styled.div`
  padding: 1.5rem 2rem 2rem;
  min-height: 60px;
  
  .tab-info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    
    .tab-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .tab-description {
      font-size: 0.875rem;
      opacity: 0.9;
      margin: 0;
    }
  }
`;

// Modern Section Cards
const ModernSectionCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
`;

const ModernSectionHeader = styled.div`
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

const ModernSectionContent = styled.div`
  padding: 1.5rem 2rem 2rem;
`;

// Modern Metrics Grid
const ModernCompactGrid = styled.div`
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

const ModernMiniMetricCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: rgba(102, 126, 234, 0.2);
  }
`;

// Modern Metric Card Component
const ModernMetricCard = ({ title, value, icon: Icon, change, changeType, color = '#667eea', loading }) => (
  <ModernMiniMetricCard>
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
  </ModernMiniMetricCard>
);

// Mock data - Replace with actual API calls
const mockData = {
  totalProducts: 78,
  averageProductPrice: 160,
  totalCategories: 16,
  averageReturnRate: 5.6,
  topSellingProducts: [
    { name: 'Product A', sales: 1200, revenue: 24000 },
    { name: 'Product B', sales: 950, revenue: 19000 },
    { name: 'Product C', sales: 800, revenue: 16000 },
    { name: 'Product D', sales: 750, revenue: 15000 },
    { name: 'Product E', sales: 600, revenue: 12000 },
  ],
  topSellingProducts24h: [
    { name: 'Product A', sales: 45, revenue: 900 },
    { name: 'Product B', sales: 38, revenue: 760 },
    { name: 'Product C', sales: 32, revenue: 640 },
    { name: 'Product D', sales: 28, revenue: 560 },
    { name: 'Product E', sales: 25, revenue: 500 },
  ],
  topCategories: [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 25 },
    { name: 'Home & Kitchen', value: 20 },
    { name: 'Books', value: 15 },
    { name: 'Sports', value: 5 },
  ],
  topCategories24h: [
    { name: 'Electronics', value: 40 },
    { name: 'Clothing', value: 30 },
    { name: 'Home & Kitchen', value: 15 },
    { name: 'Books', value: 10 },
    { name: 'Sports', value: 5 },
  ],
  leastSellingProducts: [
    { name: 'Product X', sales: 10, revenue: 200 },
    { name: 'Product Y', sales: 15, revenue: 300 },
    { name: 'Product Z', sales: 20, revenue: 400 },
    { name: 'Product W', sales: 25, revenue: 500 },
    { name: 'Product V', sales: 30, revenue: 600 },
  ],
  leastSellingProducts24h: [
    { name: 'Product X', sales: 0, revenue: 0 },
    { name: 'Product Y', sales: 1, revenue: 20 },
    { name: 'Product Z', sales: 2, revenue: 40 },
    { name: 'Product W', sales: 3, revenue: 60 },
    { name: 'Product V', sales: 4, revenue: 80 },
  ],
  mostReturnedProducts: [
    { name: 'Product R', returns: 50, returnRate: '15%' },
    { name: 'Product S', returns: 40, returnRate: '12%' },
    { name: 'Product T', returns: 35, returnRate: '10%' },
    { name: 'Product U', returns: 30, returnRate: '9%' },
    { name: 'Product V', returns: 25, returnRate: '8%' },
  ],
};

// Add mock product list data
const mockProductList = [
  {
    id: 1,
    name: 'Premium Headphones',
    sku: 'PH-001',
    totalSold: 1200,
    image: 'https://via.placeholder.com/50',
  },
  {
    id: 2,
    name: 'Wireless Mouse',
    sku: 'WM-002',
    totalSold: 850,
    image: 'https://via.placeholder.com/50',
  },
  {
    id: 3,
    name: 'Mechanical Keyboard',
    sku: 'MK-003',
    totalSold: 650,
    image: 'https://via.placeholder.com/50',
  },
  {
    id: 4,
    name: 'Gaming Monitor',
    sku: 'GM-004',
    totalSold: 420,
    image: 'https://via.placeholder.com/50',
  },
  {
    id: 5,
    name: 'Laptop Stand',
    sku: 'LS-005',
    totalSold: 780,
    image: 'https://via.placeholder.com/50',
  },
  {
    id: 6,
    name: 'USB-C Hub',
    sku: 'UH-006',
    totalSold: 950,
    image: 'https://via.placeholder.com/50',
  },
  {
    id: 7,
    name: 'Webcam',
    sku: 'WC-007',
    totalSold: 520,
    image: 'https://via.placeholder.com/50',
  },
  {
    id: 8,
    name: 'External SSD',
    sku: 'ES-008',
    totalSold: 380,
    image: 'https://via.placeholder.com/50',
  },
  {
    id: 9,
    name: 'Bluetooth Speaker',
    sku: 'BS-009',
    totalSold: 720,
    image: 'https://via.placeholder.com/50',
  },
  {
    id: 10,
    name: 'Smart Watch',
    sku: 'SW-010',
    totalSold: 890,
    image: 'https://via.placeholder.com/50',
  },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DateRangeFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);

  .date-picker-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .date-picker-label {
    font-weight: 500;
    color: var(--text-secondary);
  }

  .date-picker {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-sm);
    font-size: 0.9rem;
    width: 120px;
  }

  .apply-button {
    padding: 0.5rem 1rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-weight: 500;

    &:hover {
      background: var(--primary-color-dark);
    }

    &:disabled {
      background: var(--text-secondary);
      cursor: not-allowed;
    }
  }
`;

const SalesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin: 2rem 0;
`;

const SalesCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  height: 100%;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;

    h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .trend-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;

      &.positive {
        background: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
      }

      &.negative {
        background: rgba(244, 67, 54, 0.1);
        color: #F44336;
      }
    }
  }

  .product-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .product-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background: #f8f9fa;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      background: #f0f2f5;
      transform: translateX(4px);
    }

    .product-rank {
      font-size: 1.1rem;
      font-weight: 600;
      color: #666;
      min-width: 2rem;
      text-align: center;
    }

    .product-image {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
    }

    .product-info {
      flex: 1;

      .product-name {
        font-weight: 500;
        color: #333;
        margin-bottom: 0.25rem;
      }

      .product-metrics {
        display: flex;
        gap: 1rem;
        font-size: 0.9rem;
        color: #666;

        .metric {
          display: flex;
          align-items: center;
          gap: 0.25rem;

          &.sales {
            color: #4CAF50;
          }

          &.revenue {
            color: #2196F3;
          }
        }
      }
    }
  }
`;

const ProductsPage = () => {
  const { currentStore } = useStore();
  const [data, setData] = useState({
    totalProducts: 0,
    averageProductPrice: 0,
    totalCategories: 0,
    averageReturnRate: 0,
    topSellingProducts: [],
    topSellingProducts24h: [],
    topCategories: [],
    topCategories24h: [],
    leastSellingProducts: [],
    leastSellingProducts24h: [],
    mostReturnedProducts: []
  });
  const [productList, setProductList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Updated date filter state to match ProductDetailsPage
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [activeQuickFilter, setActiveQuickFilter] = useState('30d');

  // Add marketplace tab state
  const [activeTab, setActiveTab] = useState('all');

  const navigate = useNavigate();

  const PRODUCTS_PER_PAGE = 10;

  // Add quick date filters
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
      label: 'Overall', 
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
    console.log(`Switched to tab: ${tabId}`);
    // For now, we'll keep the current data but you can modify this to fetch different data
  };

  const handleQuickDateFilter = (filterValue, days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    setActiveQuickFilter(filterValue);
    // Refetch data with new date range
    fetchData();
  };

  // Filter products based on search term
  const filteredProducts = productList.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handleProductClick = (productName) => {
    const slug = productName.toLowerCase().replace(/ /g, '-'); // Convert to slug format such as "product-name"
    navigate(`/products/${slug}`);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleDateRangeChange = () => {
    setActiveQuickFilter(''); // Clear quick filter selection when using custom dates
    fetchData();
  };

  // Custom date formatting functions
  const formatDateForDisplay = (date) => {
    // Handle both string and Date inputs
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Fetch both products list and analytics data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const storeParams = { store: currentStore.id };

      // Fetch products list
      const productsData = await getAllProductsList(storeParams);
      
      if (productsData) {
        setProductList(productsData.map(product => ({
          id: product.id,
          name: product.title || product.name,
          sku: product.variants?.[0]?.sku || product.sku || "N/A",
          totalSold: product.totalSold || 0,
          image: product?.image || product?.image_url
        })));
      } else {
        setProductList([]);
      }

      // Fetch analytics data
      const analyticsData = await getOverallProductMetrics(storeParams);
      
      if (analyticsData) {
        setData({
          totalProducts: analyticsData.totalProducts || 0,
          averageProductPrice: analyticsData.averageProductPrice || 0,
          totalCategories: analyticsData.totalCategories || 0,
          averageReturnRate: analyticsData.averageReturnRate || 0,
          topSellingProducts: analyticsData.topSellingProducts || [],
          topSellingProducts24h: analyticsData.topSellingProducts24h || [],
          topCategories: analyticsData.topCategories || [],
          topCategories24h: analyticsData.topCategories24h || [],
          leastSellingProducts: analyticsData.leastSellingProducts || [],
          leastSellingProducts24h: analyticsData.leastSellingProducts24h || [],
          mostReturnedProducts: analyticsData.mostReturnedProducts || []
        });
      } else {
        // Reset data for demo stores without full data
        setData({
          totalProducts: 0,
          averageProductPrice: 0,
          totalCategories: 0,
          averageReturnRate: 0,
          topSellingProducts: [],
          topSellingProducts24h: [],
          topCategories: [],
          topCategories24h: [],
          leastSellingProducts: [],
          leastSellingProducts24h: [],
          mostReturnedProducts: []
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch data when store changes
  useEffect(() => {
    fetchData();
  }, [currentStore.id]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  const ProductSkeleton = () => (
    <div className="product-skeleton">
      {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, index) => (
        <div key={index} className="skeleton-row">
          <div className="skeleton-image"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
        </div>
      ))}
    </div>
  );

  // Prepare the top selling products chart data
  const topSellingProductsData = {
    labels: data.topSellingProducts.map(item => item.name),
    datasets: [
      {
        label: 'Units Sold',
        data: data.topSellingProducts.map(item => item.quantitySold),
        backgroundColor: 'rgba(0, 115, 182, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Revenue',
        data: data.topSellingProducts.map(item => item.revenue),
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderRadius: 4,
      }
    ]
  };

  const topSellingProductsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            return `${label}: ${label === 'Revenue' ? formatCurrency(value) : value}`;
          }
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

  // Prepare the categories chart data
  const categoriesData = {
    labels: data.topCategories.map(item => item.name),
    datasets: [
      {
        data: data.topCategories.map(item => item.value),
        backgroundColor: [
          'rgba(0, 115, 182, 0.8)',
          'rgba(3, 169, 244, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(244, 67, 54, 0.8)',
        ],
        borderWidth: 0,
      }
    ]
  };

  const categoriesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      }
    }
  };

  return (
    <ModernContainer>
      <ModernContent>
        
        
        {/* Modern Header */}
        <ModernHeaderSection>
          <ModernHeaderContent>
            <ModernHeaderLeft>
              <ModernHeaderTitle>
                <h1>Products Analytics</h1>
                <p>Track and analyze your product performance across all sales channels</p>
              </ModernHeaderTitle>
              
              <ModernStatsQuickView>
                <ModernQuickStat>
                  <div className="label">Products</div>
                  <div className="value">{data.totalProducts || 0}</div>
                </ModernQuickStat>
                <ModernQuickStat>
                  <div className="label">Sales</div>
                  <div className="value">{formatCurrency(data.totalSales || 0)}</div>
                </ModernQuickStat>
                <ModernQuickStat>
                  <div className="label">Revenue</div>
                  <div className="value">{formatCurrency(data.totalRevenue || 0)}</div>
                </ModernQuickStat>
              </ModernStatsQuickView>
            </ModernHeaderLeft>
            
            <ModernHeaderActions>
              <ModernActionButton 
                className="secondary" 
                onClick={handleDateRangeChange}
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

        {/* Modern Tab System */}
        <ModernTabContainer>
          <ModernTabHeader>
            {tabs.map((tab) => (
              <ModernTabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
              >
                <span className="icon">{tab.icon}</span> {tab.label}
                {activeTab === tab.id && <span className="tab-badge">Active</span>}
              </ModernTabButton>
            ))}
          </ModernTabHeader>
          
          <ModernTabContent>
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
                  {activeTab !== 'website' && activeTab !== 'all' && (
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
                        padding: '1rem', 
                        borderRadius: '8px', 
                        display: 'inline-block',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                          📈 Sales Tracking • 📊 Performance Metrics • 🎯 ROI Analysis
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            ))}
          </ModernTabContent>
        </ModernTabContainer>

        {/* Modern Stats Grid - Only show when on active tab with data */}
        {(activeTab === 'all' || activeTab === 'website') && (
          <>
            {/* Sales Metrics Section */}
            <ModernSectionCard>
              <ModernSectionHeader>
                <h2>Sales Metrics</h2>
                <p>Track your revenue, sales performance, and key financial indicators</p>
              </ModernSectionHeader>
              <ModernSectionContent>
                <ModernCompactGrid>
                  <ModernMetricCard
                    title="Total Sales"
                    value={formatCurrency(data.totalSales || 0)}
                    icon={HiShoppingCart}
                    change="12%"
                    changeType="increase"
                    color="#667eea"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Gross Sales"
                    value={formatCurrency(data.grossSales || 0)}
                    icon={FaMoneyBillWave}
                    change="+5%"
                    changeType="increase"
                    color="#10b981"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Net Sales"
                    value={formatCurrency(data.netSales || 0)}
                    icon={HiCash}
                    change="5%"
                    changeType="increase"
                    color="#059669"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Gross Sales %"
                    value={`${data.grossSalesPercentage || 0}%`}
                    icon={FiPercent}
                    change="2%"
                    changeType="increase"
                    color="#8b5cf6"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Net Sales %"
                    value={`${data.netSalesPercentage || 0}%`}
                    icon={FiPercent}
                    change="2%"
                    changeType="increase"
                    color="#a855f7"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Revenue Growth"
                    value={`+${data.revenueGrowth || 0}%`}
                    icon={FiTrendingUp}
                    change="2%"
                    changeType="increase"
                    color="#ef4444"
                    loading={isLoading}
                  />
                </ModernCompactGrid>
              </ModernSectionContent>
            </ModernSectionCard>

            {/* Returns Section */}
            <ModernSectionCard>
              <ModernSectionHeader>
                <h2>Returns & Refunds</h2>
                <p>Monitor product returns and customer satisfaction</p>
              </ModernSectionHeader>
              <ModernSectionContent>
                <ModernCompactGrid>
                  <ModernMetricCard
                    title="Total Returns"
                    value={formatCurrency(data.totalReturns || 0)}
                    icon={FiRefreshCw}
                    change="2%"
                    changeType="decrease"
                    color="#dc2626"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Return Rate"
                    value={`${data.returnRate || 0}%`}
                    icon={FiPercent}
                    change="2%"
                    changeType="decrease"
                    color="#ef4444"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Return Units"
                    value={data.returnUnits || 0}
                    icon={FiPackage}
                    change="1%"
                    changeType="decrease"
                    color="#f59e0b"
                    loading={isLoading}
                  />
                </ModernCompactGrid>
              </ModernSectionContent>
            </ModernSectionCard>

            {/* Tax Section */}
            <ModernSectionCard>
              <ModernSectionHeader>
                <h2>Tax & Compliance</h2>
                <p>Track tax collection and regulatory compliance</p>
              </ModernSectionHeader>
              <ModernSectionContent>
                <ModernCompactGrid>
                  <ModernMetricCard
                    title="Total Tax"
                    value={formatCurrency(data.totalTax || 0)}
                    icon={FaRupeeSign}
                    change="2%"
                    changeType="increase"
                    color="#3b82f6"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Tax Rate"
                    value={`${data.taxRate || 0}%`}
                    icon={FiPercent}
                    change="2%"
                    changeType="increase"
                    color="#1d4ed8"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="GST Collected"
                    value={formatCurrency(data.gstCollected || 0)}
                    icon={HiChartBar}
                    change="3%"
                    changeType="increase"
                    color="#2563eb"
                    loading={isLoading}
                  />
                </ModernCompactGrid>
              </ModernSectionContent>
            </ModernSectionCard>

            {/* Expenses Section */}
            <ModernSectionCard>
              <ModernSectionHeader>
                <h2>Expenses & Costs</h2>
                <p>Track cost of goods sold, shipping, and operational expenses</p>
              </ModernSectionHeader>
              <ModernSectionContent>
                <ModernCompactGrid>
                  <ModernMetricCard
                    title="COGS"
                    value={formatCurrency(data.cogs || 0)}
                    icon={FaBoxes}
                    change="2%"
                    changeType="increase"
                    color="#f59e0b"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="COGS %"
                    value={`${data.cogsPercentage || 0}%`}
                    icon={FiPercent}
                    change="2%"
                    changeType="increase"
                    color="#d97706"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="S&D Cost"
                    value={formatCurrency(data.sdCost || 0)}
                    icon={FiPackage}
                    change="2%"
                    changeType="increase"
                    color="#0891b2"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="S&D Cost %"
                    value={`${data.sdCostPercentage || 0}%`}
                    icon={FiPercent}
                    change="2%"
                    changeType="increase"
                    color="#0e7490"
                    loading={isLoading}
                  />
                </ModernCompactGrid>
              </ModernSectionContent>
            </ModernSectionCard>

            {/* Marketing Section */}
            <ModernSectionCard>
              <ModernSectionHeader>
                <h2>Marketing & Advertising</h2>
                <p>Monitor marketing spend and channel performance</p>
              </ModernSectionHeader>
              <ModernSectionContent>
                <ModernCompactGrid>
                  <ModernMetricCard
                    title="Total Marketing Cost"
                    value={formatCurrency(data.totalMarketingCost || 0)}
                    icon={FiTarget}
                    change="2%"
                    changeType="increase"
                    color="#8b5cf6"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Marketing Cost %"
                    value={`${data.marketingCostPercentage || 0}%`}
                    icon={FiPercent}
                    change="2%"
                    changeType="increase"
                    color="#7c3aed"
                    loading={isLoading}
                  />
                </ModernCompactGrid>
                
                {/* Marketing Channel Split Table */}
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>Marketing Channel Split</h4>
                  <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                    <table style={{ width: '100%', fontSize: '0.875rem' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Channel</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost (INR)</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.marketingChannels?.map((channel, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                            <td style={{ padding: '0.75rem', color: '#1f2937' }}>{channel.name}</td>
                            <td style={{ padding: '0.75rem', color: '#1f2937' }}>{formatCurrency(channel.cost)}</td>
                            <td style={{ padding: '0.75rem', color: '#1f2937' }}>{channel.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ModernSectionContent>
            </ModernSectionCard>

            {/* ROAS Section */}
            <ModernSectionCard>
              <ModernSectionHeader>
                <h2>ROAS & Marketing Efficiency</h2>
                <p>Measure return on advertising spend and marketing performance</p>
              </ModernSectionHeader>
              <ModernSectionContent>
                <ModernCompactGrid>
                  <ModernMetricCard
                    title="Gross ROAS"
                    value={data.grossRoas?.toFixed(2) || '0.00'}
                    icon={FiTrendingUp}
                    change="2%"
                    changeType="increase"
                    color="#059669"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Gross MER"
                    value={`${data.grossMer || 0}%`}
                    icon={FiBarChart2}
                    change="2%"
                    changeType="increase"
                    color="#0d9488"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Net ROAS"
                    value={data.netRoas?.toFixed(2) || '0.00'}
                    icon={FiTrendingUp}
                    change="2%"
                    changeType="increase"
                    color="#0891b2"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="Net MER"
                    value={`${data.netMer || 0}%`}
                    icon={FiBarChart2}
                    change="2%"
                    changeType="increase"
                    color="#0e7490"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="N-ROAS"
                    value={data.nRoas?.toFixed(2) || '0.00'}
                    icon={FiTrendingUp}
                    change="2%"
                    changeType="increase"
                    color="#dc2626"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="N-MER"
                    value={`${data.nMer || 0}%`}
                    icon={FiBarChart2}
                    change="2%"
                    changeType="increase"
                    color="#b91c1c"
                    loading={isLoading}
                  />
                </ModernCompactGrid>
              </ModernSectionContent>
            </ModernSectionCard>

            {/* CAC Section */}
            <ModernSectionCard>
              <ModernSectionHeader>
                <h2>Customer Acquisition Cost</h2>
                <p>Monitor cost to acquire new customers</p>
              </ModernSectionHeader>
              <ModernSectionContent>
                <ModernCompactGrid>
                  <ModernMetricCard
                    title="CAC"
                    value={formatCurrency(data.cac || 0)}
                    icon={FiUsers}
                    change="2%"
                    changeType="decrease"
                    color="#dc2626"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="N-CAC"
                    value={formatCurrency(data.nCac || 0)}
                    icon={FiUserCheck}
                    change="2%"
                    changeType="decrease"
                    color="#b91c1c"
                    loading={isLoading}
                  />
                </ModernCompactGrid>
              </ModernSectionContent>
            </ModernSectionCard>

            {/* Contribution Margin Section */}
            <ModernSectionCard>
              <ModernSectionHeader>
                <h2>Contribution Margin</h2>
                <p>Track contribution margins at different levels</p>
              </ModernSectionHeader>
              <ModernSectionContent>
                <ModernCompactGrid>
                  <ModernMetricCard
                    title="CM2"
                    value={formatCurrency(data.cm2 || 0)}
                    icon={FiDollarSign}
                    change="2%"
                    changeType="increase"
                    color="#059669"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="CM2 %"
                    value={`${data.cm2Percentage || 0}%`}
                    icon={FiPercent}
                    change="2%"
                    changeType="increase"
                    color="#0d9488"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="CM3"
                    value={formatCurrency(data.cm3 || 0)}
                    icon={FiDollarSign}
                    change="2%"
                    changeType="increase"
                    color="#0891b2"
                    loading={isLoading}
                  />
                  <ModernMetricCard
                    title="CM3 %"
                    value={`${data.cm3Percentage || 0}%`}
                    icon={FiPercent}
                    change="2%"
                    changeType="increase"
                    color="#0e7490"
                    loading={isLoading}
                  />
                </ModernCompactGrid>
              </ModernSectionContent>
            </ModernSectionCard>

          {/* Sales Container - Top and Least Selling Products */}
          <SalesContainer>
            <SalesCard>
              <div className="card-header">
                <h2>
                  <FiTrendingUp style={{ color: '#4CAF50' }} />
                  Top Selling Products
                </h2>
                <div className="trend-indicator positive">
                  <FiTrendingUp />
                  <span>+12% from last period</span>
                </div>
              </div>
              <div className="product-list">
                {data.topSellingProducts.map((product, index) => (
                  <div key={index} className="product-item" onClick={() => handleProductClick(product.id)}>
                    <div className="product-rank">#{index + 1}</div>
                    <img
                      src={product.image || 'https://via.placeholder.com/48'}
                      alt={product.name}
                      className="product-image"
                    />
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-metrics">
                        <div className="metric sales">
                          <FiTrendingUp />
                          {product.quantitySold} units
                        </div>
                        <div className="metric revenue">
                          <FaRupeeSign />
                          {formatCurrency(product.revenue)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SalesCard>

            <SalesCard>
              <div className="card-header">
                <h2>
                  <FiTrendingDown style={{ color: '#F44336' }} />
                  Least Selling Products
                </h2>
                <div className="trend-indicator negative">
                  <FiTrendingDown />
                  <span>-8% from last period</span>
                </div>
              </div>
              <div className="product-list">
                {data.leastSellingProducts.map((product, index) => (
                  <div key={index} className="product-item" onClick={() => handleProductClick(product.id)}>
                    <div className="product-rank">#{index + 1}</div>
                    <img
                      src={product.image || 'https://via.placeholder.com/48'}
                      alt={product.name}
                      className="product-image"
                    />
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-metrics">
                        <div className="metric sales">
                          <FiTrendingDown />
                          {product.quantitySold} units
                        </div>
                        <div className="metric revenue">
                          <FaRupeeSign />
                          {formatCurrency(product.revenue)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SalesCard>
          </SalesContainer>

          {/* Product List Section */}
          <div className="product-list-section">
            <h2>Product List</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="table-container">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Total Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="4">
                        <ProductSkeleton />
                      </td>
                    </tr>
                  ) : (
                    currentProducts.map((product) => (
                      <tr
                        key={product.id}
                        onClick={() => handleProductClick(product.name)}
                        className="product-row"
                      >
                        <td>
                          <img
                            src={product.image}
                            alt={product.name}
                            className="product-image"
                          />
                        </td>
                        <td>{product.name}</td>
                        <td>{product.sku}</td>
                        <td>{product.totalSold}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="pagination-controls">
              <button
                className="pagination-button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`page-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                className="pagination-button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
      </ModernContent>
    </ModernContainer>
  );
};

export default ProductsPage;
