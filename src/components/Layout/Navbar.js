import React from 'react';
import styled from 'styled-components';
import { 
  FiBell, 
  FiMail, 
  FiSearch, 
  FiCalendar, 
  FiChevronDown 
} from 'react-icons/fi';

const NavbarContainer = styled.header`
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  background-color: var(--background-light);
  border-bottom: 1px solid var(--border-color);
`;

const SearchBar = styled.div`
  position: relative;
  width: 350px;
  
  input {
    width: 100%;
    height: 40px;
    border-radius: 20px;
    border: 1px solid var(--border-color);
    padding: 0 var(--spacing-md) 0 var(--spacing-xl);
    font-size: 0.9rem;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(0, 115, 182, 0.2);
    }
  }
  
  svg {
    position: absolute;
    left: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  margin-right: var(--spacing-xl);
  padding-right: var(--spacing-xl);
  border-right: 1px solid var(--border-color);
  
  svg {
    margin-right: var(--spacing-sm);
    color: var(--text-secondary);
  }
  
  span {
    font-size: 0.9rem;
    color: var(--text-primary);
  }
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  color: var(--text-secondary);
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--spacing-sm);
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--primary-color);
  }
  
  .notification-indicator {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--danger-color);
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  margin-left: var(--spacing-xl);
  cursor: pointer;
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    margin-right: var(--spacing-sm);
  }
  
  .user-info {
    margin-right: var(--spacing-sm);
    
    h4 {
      font-size: 0.9rem;
      margin-bottom: 0;
    }
    
    p {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 0;
    }
  }
`;

const Navbar = () => {
  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <NavbarContainer>
      <SearchBar>
        <FiSearch />
        <input type="text" placeholder="Search for products, customers, orders..." />
      </SearchBar>
      
      <NavActions>
        <DateDisplay>
          <FiCalendar />
          <span>{currentDate}</span>
        </DateDisplay>
        
        <IconButton>
          <FiMail />
        </IconButton>
        
        <IconButton>
          <FiBell />
          <div className="notification-indicator"></div>
        </IconButton>
        
        <UserProfile>
          <div className="avatar">AP</div>
          <div className="user-info">
            <h4>Anuj Patidar</h4>
            <p>Store Owner</p>
          </div>
          <FiChevronDown />
        </UserProfile>
      </NavActions>
    </NavbarContainer>
  );
};

export default Navbar; 