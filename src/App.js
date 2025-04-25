import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GlobalStyles from './styles/GlobalStyles';
import { Layout } from './components/Layout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProductsPage from './pages/Products/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage/ProductDetailsPage';
// Routes to be implemented later
const SalesPage = () => <div>Sales Page - Coming Soon</div>;
const CustomersPage = () => <div>Customers Page - Coming Soon</div>;
const PerformancePage = () => <div>Performance Page - Coming Soon</div>;
const TrendsPage = () => <div>Trends Page - Coming Soon</div>;
const InventoryPage = () => <div>Inventory Page - Coming Soon</div>;
const OrdersPage = () => <div>Orders Page - Coming Soon</div>;
const SettingsPage = () => <div>Settings Page - Coming Soon</div>;

function App() {
  return (
    <Router>
      <GlobalStyles />
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
