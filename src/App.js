import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GlobalStyles from './styles/GlobalStyles';
import { Layout } from './components/Layout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProductsPage from './pages/Products/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage/ProductDetailsPage';
import MarketPlacePrices from './pages/MarketPlacePrices/MarketPlacePrices';
import MetaAdsAnalytics from './components/MetaAds/MetaAdsAnalytics';
import GoogleAdsAnalytics from './components/GoogleAds/GoogleAdsAnalytics';
import CombinedMarketingAnalytics from './components/Marketing/CombinedMarketingAnalytics';
import PasswordProtection from './components/PasswordProtection';
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
    <PasswordProtection>
      <Router>
        <GlobalStyles />
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:productId" element={<ProductDetailsPage />} />
            <Route path="/marketplace-prices" element={<MarketPlacePrices />} />
            <Route path="/meta-ads" element={<MetaAdsAnalytics />} />
            <Route path="/google-ads" element={<GoogleAdsAnalytics />} />
            <Route path="/combined-marketing" element={<CombinedMarketingAnalytics />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/trends" element={<TrendsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </Router>
    </PasswordProtection>
  );
}

export default App;
