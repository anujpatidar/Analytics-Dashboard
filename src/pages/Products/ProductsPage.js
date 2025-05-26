import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import './ProductsPage.css';

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

const StatCard = ({ title, value, subtitle }) => (
  <div className="stat-card">
    <h3 className="stat-title">{title}</h3>
    <div className="stat-value">{value}</div>
    {subtitle && <div className="stat-subtitle">{subtitle}</div>}
  </div>
);

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

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Fetch both products list and analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products list
        const productsResponse = await fetch('http://localhost:8080/api/v1/get-all-products');
        const productsData = await productsResponse.json();
        setProductList(productsData.data.map(product => ({
          id: product.id,
          name: product.title,
          sku: product.variants?.[0]?.sku || "N/A",
          totalSold: product.totalSold || 0,
          image: product?.images?.[0]?.src
        })));

        // Fetch analytics data
        const analyticsResponse = await fetch('http://localhost:8080/api/v1/get-overall-product-metrics');
        const analyticsJSON = await analyticsResponse.json();
        const analyticsData = analyticsJSON.data;
        // Update the data state with the API response
        console.log('analyticsData', analyticsData);
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

      } catch (error) {
        console.error('Error fetching data:', error);
        // Optionally set error state or show error message to user
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
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

  return (
    <div className="products-page">
      <h1 className="page-title">Products Analytics</h1>

      {/* KPIs */}
      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={data.totalProducts}
          subtitle="Active products in store"
        />
        <StatCard
          title="Average Product Price"
          value={formatCurrency(data.averageProductPrice)}
          subtitle="Based on all products"
        />
        <StatCard
          title="Total Categories"
          value={data.totalCategories}
          subtitle="Product categories"
        />
        <StatCard
          title="Average Return Rate"
          value={data.averageReturnRate}
          subtitle="Last 30 days"
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Top Selling Products */}
        <div className="chart-card">
          <h2>Top 5 Selling Products (Overall)</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topSellingProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" name="Units Sold" />
                <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h2>Top 5 Selling Products (Last 24h)</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topSellingProducts24h}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" name="Units Sold" />
                <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories */}
        <div className="chart-card">
          <h2>Top 5 Categories (Overall)</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.topCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h2>Top 5 Categories (Last 24h)</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.topCategories24h}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.topCategories24h.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
                    onClick={() => handleProductClick(product.id)}
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
    </div>
  );
};

export default ProductsPage;
