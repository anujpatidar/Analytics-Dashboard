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
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styled from 'styled-components';
import { FiPackage, FiGrid, FiRefreshCw, FiDownload, FiMoreVertical, FiTrendingUp, FiTrendingDown, FiSearch, FiFilter, FiCalendar } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import StatCard from '../../components/Dashboard/StatCard';
import StoreIndicator from '../../components/Dashboard/StoreIndicator';
import { useStore } from '../../context/StoreContext';
import { getAllProductsList, getOverallProductMetrics } from '../../api/productsAPI';
import './ProductsPage.css';
import { formatCurrency } from '../../utils/formatters';

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

// Add styled components for tabs and date filters
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
    return date.toLocaleDateString('en-IN', {
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
    <div className="products-page">
      <StoreIndicator />
      
      <div className="products-header">
        <h1>Products Analytics</h1>
      </div>

      {/* Enhanced Date Filter Section */}
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
        
        <FilterButton onClick={handleDateRangeChange} disabled={isLoading}>
          <FiFilter />
          {isLoading ? 'Loading...' : 'Apply Filter'}
        </FilterButton>
        
        <div style={{ 
          borderLeft: '1px solid var(--border-color)', 
          paddingLeft: 'var(--spacing-md)', 
          marginLeft: 'var(--spacing-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
        </TabContent>
      </TabContainer>

      {/* Stats Grid - Only show when on active tab with data */}
      {(activeTab === 'all' || activeTab === 'website') && (
        <>
          <div className="stats-grid">
            <StatCard
              title="Total Products"
              value={data.totalProducts}
              icon={FiPackage}
              change="12%"
              changeType="increase"
              loading={isLoading}
              tooltip="Total number of active products available in your inventory across all categories and variants"
            />
            <StatCard
              title="Average Product Price"
              value={formatCurrency(data.averageProductPrice)}
              icon={FaRupeeSign}
              change="+5%"
              changeType="increase"
              loading={isLoading}
              tooltip="Average selling price calculated across all products, including variations and different pricing tiers"
            />
            <StatCard
              title="Total Categories"
              value={data.totalCategories}
              icon={FiGrid}
              change="5%"
              changeType="increase"
              loading={isLoading}
              tooltip="Number of distinct product categories used to organize your inventory and improve customer navigation"
            />
            <StatCard
              title="Average Return Rate"
              value={`${data.averageReturnRate}%`}
              icon={FiRefreshCw}
              change="2%"
              changeType="decrease"
              loading={isLoading}
              tooltip="Percentage of products returned by customers, calculated as (returned items / total sold items) × 100"
            />
          </div>

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
    </div>
  );
};

export default ProductsPage;
