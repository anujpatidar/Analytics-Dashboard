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
import { FiTrendingUp, FiTrendingDown} from 'react-icons/fi';

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
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
`;

const ProductImage = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);
`;

const ProductInfo = styled.div`
  h1 {
    font-size: 2rem;
    margin-bottom: var(--spacing-xs);
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
`;

const StatCard = styled.div`
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);
  
  h3 {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  .value {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
  }
  
  .trend {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    
    &.positive {
      color: var(--success-color);
    }
    
    &.negative {
      color: var(--danger-color);
    }
  }
`;

const Section = styled.div`
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

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:8080/api/v1/products/get-product-metrics-by-id/${productId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Error fetching product data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

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
          <p>{data.product.description}</p>
        </ProductInfo>
      </PageHeader>

      {/* Overview Section */}
      <Section>
        <h2>Overview</h2>
        <StatsGrid>
          <StatCard>
            <h3>Total Orders</h3>
            <div className="value">{data.overview.totalOrders}</div>
            <div className="trend positive">
              <FiTrendingUp /> {formatPercentage(data.overview.orderTrend || 0)}
            </div>
          </StatCard>
          <StatCard>
            <h3>Total Sales</h3>
            <div className="value">{formatCurrency(data.overview.totalSales)}</div>
            <div className="trend positive">
              <FiTrendingUp /> {formatPercentage(data.overview.salesTrend || 0)}
            </div>
          </StatCard>
          <StatCard>
            <h3>AOV</h3>
            <div className="value">{formatCurrency(data.overview.aov)}</div>
            <div className="trend positive">
              <FiTrendingUp /> {formatPercentage(data.overview.aovTrend || 0)}
            </div>
          </StatCard>
          <StatCard>
            <h3>Quantity Sold</h3>
            <div className="value">{data.overview.quantitySold}</div>
            <div className="trend positive">
              <FiTrendingUp /> {formatPercentage(data.overview.quantityTrend || 0)}
            </div>
          </StatCard>
          <StatCard>
            <h3>Gross Profit</h3>
            <div className="value">{formatCurrency(data.overview.grossProfit)}</div>
            <div className="trend positive">
              <FiTrendingUp /> {formatPercentage(data.overview.profitTrend || 0)}
            </div>
          </StatCard>
          <StatCard>
            <h3>Profit Margin</h3>
            <div className="value">{formatPercentage(data.overview.profitMargin)}</div>
            <div className="trend positive">
              <FiTrendingUp /> {formatPercentage(data.overview.marginTrend || 0)}
            </div>
          </StatCard>
          <StatCard>
            <h3>Refund Rate</h3>
            <div className="value">{formatPercentage(data.overview.refundRate)}</div>
            <div className={`trend ${data.overview.refundTrend > 0 ? 'negative' : 'positive'}`}>
              {data.overview.refundTrend > 0 ? <FiTrendingDown /> : <FiTrendingUp />} 
              {formatPercentage(Math.abs(data.overview.refundTrend || 0))}
            </div>
          </StatCard>
        </StatsGrid>
      </Section>

      {/* Sales & Profit Analytics */}
      <Section>
        <h2>Sales & Profit Analytics</h2>
        <StatsGrid>
          <StatCard>
            <h3>Total Revenue</h3>
            <div className="value">{formatCurrency(data.salesAndProfit.totalRevenue)}</div>
          </StatCard>
          <StatCard>
            <h3>Marketing Cost</h3>
            <div className="value">{formatCurrency(data.salesAndProfit.marketingCost)}</div>
          </StatCard>
          <StatCard>
            <h3>Profit After Marketing</h3>
            <div className="value">{formatCurrency(data.salesAndProfit.profitAfterMarketing)}</div>
          </StatCard>
          <StatCard>
            <h3>Profit per Unit</h3>
            <div className="value">{formatCurrency(data.salesAndProfit.profitPerUnit)}</div>
          </StatCard>
          <StatCard>
            <h3>Cost Price per Unit</h3>
            <div className="value">{formatCurrency(data.salesAndProfit.costPricePerUnit)}</div>
          </StatCard>
          <StatCard>
            <h3>Return Rate</h3>
            <div className="value">{formatPercentage(data.salesAndProfit.returnRate)}</div>
          </StatCard>
        </StatsGrid>
      </Section>

      {/* Customer Insights */}
      <Section>
        <h2>Customer Insights</h2>
        
        {/* Customer Overview Stats */}
        <StatsGrid>
          <StatCard>
            <h3>Total Customers</h3>
            <div className="value">{data.customerInsights.totalCustomers}</div> 
            <div className="trend positive">
              <FiTrendingUp /> 12.5%
            </div>
          </StatCard>
          <StatCard>
            <h3>Repeat Customers</h3>
            <div className="value">{data.customerInsights.repeatCustomers}</div> 
            <div className="trend positive">
              <FiTrendingUp /> 8.3%
            </div>
          </StatCard>
          <StatCard>
            <h3>Repeat Customer Rate</h3>
            <div className="value">{data.customerInsights.repeatCustomerRate}%</div> 
            <div className="trend negative">
              <FiTrendingDown /> 1.2%
            </div>
          </StatCard>
          <StatCard>
            <h3>Avg. Orders per Customer</h3>
            <div className="value">{data.customerInsights.avgOrdersPerCustomer}</div> 
            <div className="trend positive">
              <FiTrendingUp /> 5.1%
            </div>
          </StatCard>
          <StatCard>
            <h3>Customer Acquisition Cost</h3>
            <div className="value">{data.customerInsights.customerAcquisitionCost}</div> 
            <div className="trend negative">
              <FiTrendingDown /> 3.2%
            </div>
          </StatCard>
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
                      { name: 'First-time Customers', value: data.customerInsights.firstTimeCustomers }, // TODO: Replace with actual data
                      { name: 'Repeat Customers', value: data.customerInsights.repeatCustomers } // TODO: Replace with actual data
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

        {/* Customer Acquisition Trend */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Customer Acquisition Trend</h3>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { month: 'Jan', newCustomers: 1200, repeatCustomers: 45 }, // TODO: Replace with actual data
                  { month: 'Feb', newCustomers: 1500, repeatCustomers: 62 },
                  { month: 'Mar', newCustomers: 1800, repeatCustomers: 78 },
                  { month: 'Apr', newCustomers: 1650, repeatCustomers: 89 },
                  { month: 'May', newCustomers: 2100, repeatCustomers: 102 },
                  { month: 'Jun', newCustomers: 2200, repeatCustomers: 125 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="newCustomers"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="New Customers"
                />
                <Area
                  type="monotone"
                  dataKey="repeatCustomers"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Repeat Customers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Customer Behavior Insights */}
        <div>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Customer Behavior Insights</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '200px' }}>
            {/* Behavior Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f8f9fa', borderRadius: '6px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ECDC4' }}>
                  {formatCurrency(data.overview.aov)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Average Order Value</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f8f9fa', borderRadius: '6px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FF6B6B' }}>
                  {((data.customerInsights.firstTimeCustomers / data.customerInsights.totalCustomers) * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>First-time Buyers</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f8f9fa', borderRadius: '6px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#45B7D1' }}>
                  {formatCurrency(Math.round(data.overview.totalSales / data.overview.totalOrders))}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Revenue per Order</div>
              </div>
            </div>

            {/* Customer Loyalty Distribution */}
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { 
                        name: 'Single Purchase', 
                        value: data.customerInsights.frequencyDistribution.oneOrderCustomers.customerCount,
                        color: '#FF6B6B'
                      },
                      { 
                        name: 'Loyal (2+ Orders)', 
                        value: data.customerInsights.frequencyDistribution.twoOrdersCustomers.customerCount + 
                               data.customerInsights.frequencyDistribution.threeOrdersCustomers.customerCount +
                               data.customerInsights.frequencyDistribution.fourOrdersCustomers.customerCount,
                        color: '#4ECDC4'
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#FF6B6B" />
                    <Cell fill="#4ECDC4" />
                  </Pie>
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Customers']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Additional Insights Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '0.5rem', background: '#e8f4fd', borderRadius: '6px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#2196F3' }}>
                {Math.round((data.customerInsights.repeatCustomers / data.customerInsights.totalCustomers) * data.customerInsights.avgOrdersPerCustomer * 100)}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Loyalty Index</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem', background: '#fff3e0', borderRadius: '6px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#FF9800' }}>
                {formatCurrency(Math.round(data.customerInsights.customerAcquisitionCost / (data.overview.aov / 1000)))}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>CAC to AOV Ratio</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f3e5f5', borderRadius: '6px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#9C27B0' }}>
                {data.customerInsights.avgOrdersPerCustomer}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Orders per Customer</div>
            </div>
          </div>
        </div>

        {/* Customer Retention Insights */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Customer Retention Analysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#FF6B6B' }}>
                30% {/* TODO: Replace with actual data */}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>1-Month Retention</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4ECDC4' }}>
                18% {/* TODO: Replace with actual data */}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>3-Month Retention</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#45B7D1' }}>
                12% {/* TODO: Replace with actual data */}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>6-Month Retention</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#96CEB4' }}>
                8% {/* TODO: Replace with actual data */}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>12-Month Retention</div>
            </div>
          </div>
        </div>
      </Section>

      {/* Variants Summary */}
      <Section>
        <h2>Variants Performance Analysis</h2>
        
        {/* Variants Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ECDC4' }}>
              {data.variantInsights.length}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Variants</div>
          </div>
          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FF6B6B' }}>
              {data.variantInsights[0]?.VARIANT_TITLE || 'N/A'}
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
              {Math.round(data.variantInsights.reduce((sum, variant) => sum + parseInt(variant.total_units_sold), 0) / data.variantInsights.length).toLocaleString()}
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
                      name: variant.VARIANT_TITLE,
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
                    name: variant.VARIANT_TITLE,
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

        {/* Performance Comparison Chart */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Variant Performance Comparison</h3>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.variantInsights.map(variant => ({
                  name: variant.VARIANT_TITLE,
                  units: parseInt(variant.total_units_sold),
                  revenue: parseFloat(variant.total_sales_amount),
                  avgPrice: parseFloat(variant.total_sales_amount) / parseInt(variant.total_units_sold)
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => {
                  if (name === 'units') return [value.toLocaleString(), 'Units Sold'];
                  if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                  if (name === 'avgPrice') return [formatCurrency(value), 'Avg Price per Unit'];
                  return [value, name];
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="units" fill="#8884d8" name="Units Sold" />
                <Bar yAxisId="right" dataKey="avgPrice" fill="#82ca9d" name="Avg Price per Unit" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
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
                        <strong>{variant.VARIANT_TITLE}</strong>
                      </div>
                    </td>
                    <td>{parseInt(variant.total_units_sold).toLocaleString()}</td>
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
                            width: `${variant.units_sold_percentage}%`, 
                            height: '100%', 
                            backgroundColor: COLORS[index % COLORS.length],
                            borderRadius: '4px'
                          }}></div>
                        </div>
                        <span>{parseFloat(variant.units_sold_percentage).toFixed(1)}%</span>
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
      </Section>

      {/* Charts */}
      <Section>
        <h2>Sales Trend</h2>
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Section>

      <Section>
        <h2>Refunds Over Time</h2>
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.refundsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="refunds" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Section>

      <Section>
        <h2>Profit vs Marketing Spend</h2>
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.profitVsMarketing}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="profit" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="marketing" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Section>

      
    </PageContainer>
  );
};

export default ProductDetailsPage;
