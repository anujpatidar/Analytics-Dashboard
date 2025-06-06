import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiShoppingBag, 
  FiUsers, 
  FiBarChart2, 
  FiList, 
  FiSettings,
  FiTrendingUp,
  FiPackage,
  FiDollarSign,
  FiActivity
} from 'react-icons/fi';
import { FaFacebook, FaGoogle } from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const NavItem = ({ to, icon: Icon, children, badge }) => (
    <li>
      <Link
        to={to}
        className={`group flex items-center px-4 py-3 mx-3 rounded-xl transition-all duration-200 relative ${
          isActive(to)
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-105'
            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600 hover:scale-105'
        }`}
      >
        <div className={`p-2 rounded-lg mr-3 transition-all duration-200 ${
          isActive(to)
            ? 'bg-white/20 text-white'
            : 'bg-gray-200 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium text-sm">{children}</span>
        {badge && (
          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
        {isActive(to) && (
          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-full shadow-lg"></div>
        )}
      </Link>
    </li>
  );

  const SectionTitle = ({ children }) => (
    <div className="px-7 mb-3 mt-8 first:mt-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {children}
      </h3>
    </div>
  );

  return (
    <aside className="h-screen fixed left-0 top-0 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 flex flex-col shadow-xl z-10" style={{width: '272px'}}>
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <FiActivity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Analytics Pro
            </h1>
            <p className="text-sm text-gray-500">Shopify Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1">
          <SectionTitle>Main</SectionTitle>
          <NavItem to="/" icon={FiHome}>Dashboard</NavItem>
          <NavItem to="/sales" icon={FiDollarSign}>Sales</NavItem>
          <NavItem to="/products" icon={FiShoppingBag}>Products</NavItem>
          <NavItem to="/customers" icon={FiUsers}>Customers</NavItem>
          <NavItem to="/marketplace-prices" icon={FiTrendingUp}>Marketplace Prices</NavItem>

          <SectionTitle>Marketing</SectionTitle>
          <NavItem to="/combined-marketing" icon={FiBarChart2}>Combined Analytics</NavItem>
          <NavItem to="/meta-ads" icon={FaFacebook}>Meta Ads</NavItem>
          <NavItem to="/google-ads" icon={FaGoogle}>Google Ads</NavItem>

          <SectionTitle>Analytics</SectionTitle>
          <NavItem to="/performance" icon={FiBarChart2}>Performance</NavItem>
          <NavItem to="/trends" icon={FiTrendingUp}>Trends</NavItem>
          <NavItem to="/inventory" icon={FiPackage}>Inventory</NavItem>
          <NavItem to="/orders" icon={FiList}>Orders</NavItem>

          <SectionTitle>Settings</SectionTitle>
          <NavItem to="/settings" icon={FiSettings}>Settings</NavItem>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 