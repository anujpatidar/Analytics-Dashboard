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
import { FiPackage, FiGrid, FiRefreshCw, FiDownload, FiMoreVertical, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import StatCard from '../../components/Dashboard/StatCard';
import './ProductsPage.css';

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
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const navigate = useNavigate();

  const PRODUCTS_PER_PAGE = 10;

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
      
      // Format dates for API
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };

      // Fetch products list
      const productsResponse = await fetch('http://localhost:8080/api/v1/products/get-all-products');
      const productsData = await productsResponse.json();
      console.log('Products Data:', productsData.data);
      setProductList(productsData.data.map(product => ({
        id: product.id,
        name: product.title,
        sku: product.variants?.[0]?.sku || "N/A",
        totalSold: product.totalSold || 0,
        image: product?.image})));


      // Fetch analytics data with date range
      const analyticsResponse = await fetch(`http://localhost:8080/api/v1/products/get-overall-product-metrics`);
      const analyticsData = await analyticsResponse.json();
      
      setData({
        totalProducts: productsData.data.length || 0,
        averageProductPrice: analyticsData.data.averageProductPrice || 0,
        totalCategories: analyticsData.data.totalCategories || 0,
        averageReturnRate: analyticsData.data.averageReturnRate || 0,
        topSellingProducts: analyticsData.data.topSellingProducts || [],
        topSellingProducts24h: analyticsData.data.topSellingProducts24h || [],
        topCategories: analyticsData.data.topCategories || [],
        topCategories24h: analyticsData.data.topCategories24h || [],
        leastSellingProducts: analyticsData.data.leastSellingProducts || [],
        leastSellingProducts24h: analyticsData.data.leastSellingProducts24h || [],
        mostReturnedProducts: analyticsData.data.mostReturnedProducts || []
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
      <h1 className="page-title">Products Analytics</h1>

      {/* Date Range Filter */}
      <DateRangeFilter>
        <div className="date-picker-container">
          <span className="date-picker-label">From:</span>
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={endDate}
            className="date-picker"
            dateFormat="dd/MM/yyyy"
            placeholderText="DD/MM/YYYY"
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={10}
            showMonthDropdown
            scrollableMonthDropdown
          />
        </div>
        <div className="date-picker-container">
          <span className="date-picker-label">To:</span>
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={new Date()}
            className="date-picker"
            dateFormat="dd/MM/yyyy"
            placeholderText="DD/MM/YYYY"
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={10}
            showMonthDropdown
            scrollableMonthDropdown
          />
        </div>
        <button 
          className="apply-button"
          onClick={handleDateRangeChange}
          disabled={isLoading}
        >
          Apply Filter
        </button>
      </DateRangeFilter>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={data.totalProducts}
          icon={<FiPackage size={24} />}
          change="12%"
          changeType="increase"
          loading={isLoading}
        />
        <StatCard
          title="Average Product Price"
          value={formatCurrency(data.averageProductPrice)}
          icon={<FaRupeeSign className="w-6 h-6" />}
          change="+5%"
          changeType="increase"
          loading={isLoading}
        />
        <StatCard
          title="Total Categories"
          value={data.totalCategories}
          icon={<FiGrid size={24} />}
          change="5%"
          changeType="increase"
          loading={isLoading}
        />
        <StatCard
          title="Average Return Rate"
          value={`${data.averageReturnRate}%`}
          icon={<FiRefreshCw size={24} />}
          change="2%"
          changeType="decrease"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Top Selling Products */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>Top 5 Selling Products (Overall)</h2>
            <div className="chart-actions">
              <button className="chart-action-button">
                <FiDownload size={16} />
              </button>
              <button className="chart-action-button">
                <FiMoreVertical size={16} />
              </button>
            </div>
          </div>
          <div className="chart-container">
            <Bar data={topSellingProductsData} options={topSellingProductsOptions} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2>Top 5 Selling Products (Last 24h)</h2>
            <div className="chart-actions">
              <button className="chart-action-button">
                <FiDownload size={16} />
              </button>
              <button className="chart-action-button">
                <FiMoreVertical size={16} />
              </button>
            </div>
          </div>
          <div className="chart-container">
            <Bar 
              data={{
                ...topSellingProductsData,
                labels: data.topSellingProducts24h.map(item => item.name),
                datasets: [
                  {
                    ...topSellingProductsData.datasets[0],
                    data: data.topSellingProducts24h.map(item => item.quantitySold),
                  },
                  {
                    ...topSellingProductsData.datasets[1],
                    data: data.topSellingProducts24h.map(item => item.revenue),
                  }
                ]
              }} 
              options={topSellingProductsOptions} 
            />
          </div>
        </div>

        {/* Categories */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>Top 5 Categories (Overall)</h2>
            <div className="chart-actions">
              <button className="chart-action-button">
                <FiDownload size={16} />
              </button>
              <button className="chart-action-button">
                <FiMoreVertical size={16} />
              </button>
            </div>
          </div>
          <div className="chart-container">
            <Pie data={categoriesData} options={categoriesOptions} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2>Top 5 Categories (Last 24h)</h2>
            <div className="chart-actions">
              <button className="chart-action-button">
                <FiDownload size={16} />
              </button>
              <button className="chart-action-button">
                <FiMoreVertical size={16} />
              </button>
            </div>
          </div>
          <div className="chart-container">
            <Pie 
              data={{
                ...categoriesData,
                labels: data.topCategories24h.map(item => item.name),
                datasets: [{
                  ...categoriesData.datasets[0],
                  data: data.topCategories24h.map(item => item.value),
                }]
              }} 
              options={categoriesOptions} 
            />
          </div>
        </div>

        {/* Least Selling Products */}
        <div className="chart-card">
          <h2>Least Selling Products (Overall)</h2>
          <div className="list-container">
            {data.leastSellingProducts.map((product, index) => (
              <div key={index} className="list-item">
                <span className="product-name">{product.name}</span>
                <span className="product-value">
                  {product.sales} units ({formatCurrency(product.revenue)})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h2>Least Selling Products (Last 24h)</h2>
          <div className="list-container">
            {data.leastSellingProducts24h.map((product, index) => (
              <div key={index} className="list-item">
                <span className="product-name">{product.name}</span>
                <span className="product-value">
                  {product.sales} units ({formatCurrency(product.revenue)})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Returned Products */}
        <div className="chart-card">
          <h2>Most Returned Products</h2>
          <div className="list-container">
            {data.mostReturnedProducts.map((product, index) => (
              <div key={index} className="list-item">
                <span className="product-name">{product.name}</span>
                <span className="product-value">
                  {product.returns} returns ({product.returnRate})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

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

      {/* Replace the SalesContainer section */}
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
                      {product.sales} units
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
                      {product.sales} units
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
    </div>
  );
};

export default ProductsPage;
