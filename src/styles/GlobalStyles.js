import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --primary-color: #0073B6;
    --secondary-color: #03A9F4;
    --success-color: #4CAF50;
    --warning-color: #FFC107;
    --danger-color: #F44336;
    --light-color: #f5f6fa;
    --dark-color: #2c3e50;
    --grey-color: #95a5a6;
    --background-light: #ffffff;
    --background-dark: #1e272e;
    --background-accent: #f7f9fa;
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --border-color: #dcdde1;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    --chart-colors: ['#0073B6', '#03A9F4', '#4CAF50', '#FFC107', '#F44336', '#9C27B0', '#E91E63', '#3F51B5'];
    
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-xxl: 3rem;
    
    --border-radius-sm: 4px;
    --border-radius-md: 8px;
    --border-radius-lg: 12px;
    
    --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: var(--font-family);
    background-color: var(--background-light);
    color: var(--text-primary);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.3;
    margin-bottom: var(--spacing-md);
    color: var(--text-primary);
  }

  h1 {
    font-size: 2.5rem;
  }

  h2 {
    font-size: 2rem;
  }

  h3 {
    font-size: 1.75rem;
  }

  h4 {
    font-size: 1.5rem;
  }

  h5 {
    font-size: 1.25rem;
  }

  h6 {
    font-size: 1rem;
  }

  p {
    margin-bottom: var(--spacing-md);
  }

  a {
    color: var(--primary-color);
    text-decoration: none;
    transition: color 0.3s ease;
    
    &:hover {
      color: var(--secondary-color);
    }
  }

  button {
    cursor: pointer;
  }

  .container {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 var(--spacing-md);
  }

  .card {
    background-color: var(--background-light);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }

  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-center {
    align-items: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .grid {
    display: grid;
   
    gap: var(--spacing-lg);
  }
`;

export default GlobalStyles; 