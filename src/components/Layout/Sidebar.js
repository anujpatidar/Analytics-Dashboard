import React from 'react';
import styled from 'styled-components';
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
  FiDollarSign
} from 'react-icons/fi';

const SidebarContainer = styled.aside`
  width: 260px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background-color: var(--background-light);
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  z-index: 10;
  overflow: hidden;
`;

const Logo = styled.div`
  padding: var(--spacing-lg);
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  
  h1 {
    font-size: 1.5rem;
    color: var(--primary-color);
    margin-bottom: 0;
  }
  
  span {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
`;

const NavSection = styled.div`
  margin-bottom: var(--spacing-lg);
  flex-shrink: 0;
  
  h2 {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin: var(--spacing-md) var(--spacing-lg);
    letter-spacing: 1px;
  }
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin-bottom: 2px;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  color: ${props => props.active ? 'var(--primary-color)' : 'var(--text-primary)'};
  background-color: ${props => props.active ? 'rgba(0, 115, 182, 0.08)' : 'transparent'};
  border-left: 3px solid ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  transition: all 0.2s ease;
  text-decoration: none;
  
  &:hover {
    background-color: rgba(0, 115, 182, 0.05);
    color: var(--primary-color);
  }
  
  svg {
    margin-right: var(--spacing-md);
    font-size: 1.2rem;
  }
`;

const StoreInfo = styled.div`
  margin-top: auto;
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  
  h3 {
    font-size: 0.9rem;
    margin-bottom: var(--spacing-xs);
  }
  
  p {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }
`;

const NavContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: var(--spacing-lg);
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`;

const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <SidebarContainer>
      <Logo>
        <h1>Analytics</h1>
        <span>Shopify Dashboard</span>
      </Logo>
      
      <NavContent>
        <NavSection>
          <h2>Main</h2>
          <NavList>
            <NavItem>
              <NavLink to="/" active={isActive('/')}>
                <FiHome />
                Dashboard
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/sales" active={isActive('/sales')}>
                <FiDollarSign />
                Sales
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/products" active={isActive('/products')}>
                <FiShoppingBag />
                Products
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/customers" active={isActive('/customers')}>
                <FiUsers />
                Customers
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/marketplace-prices" active={isActive('/marketplace-prices')}>
                <FiUsers />
                Marketplace Prices
              </NavLink>
            </NavItem>
          </NavList>
        </NavSection>
        
        <NavSection>
          <h2>Analytics</h2>
          <NavList>
            <NavItem>
              <NavLink to="/performance" active={isActive('/performance')}>
                <FiBarChart2 />
                Performance
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/trends" active={isActive('/trends')}>
                <FiTrendingUp />
                Trends
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/inventory" active={isActive('/inventory')}>
                <FiPackage />
                Inventory
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/orders" active={isActive('/orders')}>
                <FiList />
                Orders
              </NavLink>
            </NavItem>
          </NavList>
        </NavSection>
        
        <NavSection>
          <h2>Settings</h2>
          <NavList>
            <NavItem>
              <NavLink to="/settings" active={isActive('/settings')}>
                <FiSettings />
                Settings
              </NavLink>
            </NavItem>
          </NavList>
        </NavSection>
      </NavContent>
      
      <StoreInfo>
        <h3>Shopify Store</h3>
        <p>Last updated: Today, 11:30 AM</p>
        <p>Next update in: 25 minutes</p>
      </StoreInfo>
    </SidebarContainer>
  );
};

export default Sidebar; 