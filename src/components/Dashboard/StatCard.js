import React from 'react';
import styled from 'styled-components';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

const CardContainer = styled.div`
  background-color: var(--background-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);
  padding: var(--spacing-lg);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }
`;

const CardIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: var(--border-radius-md);
  background-color: ${props => `var(--${props.color}-color)`};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
`;

const CardTitle = styled.h3`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
`;

const CardValue = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  margin-top: auto;
`;

const PercentageChange = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 0.9rem;
  color: ${props => props.isPositive ? 'var(--success-color)' : 'var(--danger-color)'};
  
  svg {
    margin-right: 4px;
  }
`;

const Period = styled.span`
  margin-left: var(--spacing-sm);
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary', 
  percentageChange, 
  period = 'vs last week'
}) => {
  const isPositive = percentageChange >= 0;
  
  return (
    <CardContainer>
      <CardIcon color={color}>
        <Icon />
      </CardIcon>
      <CardTitle>{title}</CardTitle>
      <CardValue>{value}</CardValue>
      <CardFooter>
        <PercentageChange isPositive={isPositive}>
          {isPositive ? <FiArrowUp /> : <FiArrowDown />}
          {Math.abs(percentageChange)}%
        </PercentageChange>
        <Period>{period}</Period>
      </CardFooter>
    </CardContainer>
  );
};

export default StatCard; 