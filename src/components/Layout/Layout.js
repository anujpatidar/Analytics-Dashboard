import React from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Content = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  background-color: var(--background-accent);
  margin-left: 260px; /* Same as sidebar width */
`;

const MainContent = styled.div`
  padding: var(--spacing-lg);
  flex: 1;
`;

const Layout = ({ children }) => {
  return (
    <LayoutContainer>
      <Sidebar />
      <Content>
        <Navbar />
        <MainContent>
          {children}
        </MainContent>
      </Content>
    </LayoutContainer>
  );
};

export default Layout; 