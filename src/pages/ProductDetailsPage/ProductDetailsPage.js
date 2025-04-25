import React, { useState } from 'react';
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
const mockProductData = {
  product: {
    id: 1,
    name: 'Premium Wireless Headphones',
    image: 'https://cdn.shopify.com/s/files/1/0553/0419/2034/files/products_4july-03_803b519a-125c-458b-bfab-15f0d0009fb1.jpg?v=1720861559&width=648',
    description: 'High-quality wireless headphones with noise cancellation',
    sku: 'PH-001',
    price: 12999,
    costPrice: 8000,
  },
  overview: {
    totalOrders: 1250,
    totalSales: 15623750,
    aov: 12500,
    quantitySold: 1250,
    grossProfit: 6249500,
    profitMargin: 40,
    refundRate: 5.2,
  },
  salesAndProfit: {
    totalRevenue: 15623750,
    marketingCost: 1250000,
    profitAfterMarketing: 4999500,
    profitPerUnit: 4000,
    costPricePerUnit: 8000,
    returnUnits: 65,
    returnRate: 5.2,
  },
  customerInsights: {
    repeatCustomerRate: 35,
    customerBreakdown: [
      { name: 'First-time', value: 65 },
      { name: 'Returning', value: 35 },
    ],
  },
  variants: [
    { name: 'Black', soldCount: 500, profit: 2000000 },
    { name: 'White', soldCount: 450, profit: 1800000 },
    { name: 'Blue', soldCount: 300, profit: 1200000 },
  ],
  salesTrend: [
    { date: 'Jan', sales: 1200000 },
    { date: 'Feb', sales: 1500000 },
    { date: 'Mar', sales: 1800000 },
    { date: 'Apr', sales: 1600000 },
    { date: 'May', sales: 2000000 },
    { date: 'Jun', sales: 2200000 },
  ],
  refundsOverTime: [
    { date: 'Jan', refunds: 5 },
    { date: 'Feb', refunds: 8 },
    { date: 'Mar', refunds: 6 },
    { date: 'Apr', refunds: 7 },
    { date: 'May', refunds: 4 },
    { date: 'Jun', refunds: 3 },
  ],
  profitVsMarketing: [
    { date: 'Jan', profit: 1200000, marketing: 200000 },
    { date: 'Feb', profit: 1500000, marketing: 250000 },
    { date: 'Mar', profit: 1800000, marketing: 300000 },
    { date: 'Apr', profit: 1600000, marketing: 200000 },
    { date: 'May', profit: 2000000, marketing: 250000 },
    { date: 'Jun', profit: 2200000, marketing: 300000 },
  ],
};

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
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};

const ProductDetailsPage = () => {
const { productId } = useParams();
  const [data] = useState(mockProductData);

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
              <FiTrendingUp /> +12.5%
            </div>
          </StatCard>
          <StatCard>
            <h3>Total Sales</h3>
            <div className="value">{formatCurrency(data.overview.totalSales)}</div>
            <div className="trend positive">
              <FiTrendingUp /> +15.2%
            </div>
          </StatCard>
          <StatCard>
            <h3>AOV</h3>
            <div className="value">{formatCurrency(data.overview.aov)}</div>
            <div className="trend positive">
              <FiTrendingUp /> +2.3%
            </div>
          </StatCard>
          <StatCard>
            <h3>Quantity Sold</h3>
            <div className="value">{data.overview.quantitySold}</div>
            <div className="trend positive">
              <FiTrendingUp /> +10.5%
            </div>
          </StatCard>
          <StatCard>
            <h3>Gross Profit</h3>
            <div className="value">{formatCurrency(data.overview.grossProfit)}</div>
            <div className="trend positive">
              <FiTrendingUp /> +18.7%
            </div>
          </StatCard>
          <StatCard>
            <h3>Profit Margin</h3>
            <div className="value">{formatPercentage(data.overview.profitMargin)}</div>
            <div className="trend positive">
              <FiTrendingUp /> +3.2%
            </div>
          </StatCard>
          <StatCard>
            <h3>Refund Rate</h3>
            <div className="value">{formatPercentage(data.overview.refundRate)}</div>
            <div className="trend negative">
              <FiTrendingDown /> +0.5%
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
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h3>Repeat Customer Rate</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {formatPercentage(data.customerInsights.repeatCustomerRate)}
            </div>
          </div>
          <div style={{ flex: 1, height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.customerInsights.customerBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.customerInsights.customerBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* Variants Summary */}
      <Section>
        <h2>Variants Summary</h2>
        <VariantsTable>
          <thead>
            <tr>
              <th>Variant Name</th>
              <th>Sold Count</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {data.variants.map((variant, index) => (
              <tr key={index}>
                <td>{variant.name}</td>
                <td>{variant.soldCount}</td>
                <td>{formatCurrency(variant.profit)}</td>
              </tr>
            ))}
          </tbody>
        </VariantsTable>
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

      <Section>
        <h2>Variant-wise Sales</h2>
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.variants}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="soldCount"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.variants.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Section>
    </PageContainer>
  );
};

export default ProductDetailsPage;
