import React from 'react';
import styled from 'styled-components';
import { FiMoreHorizontal, FiDownload } from 'react-icons/fi';

const ChartCardContainer = styled.div`
  background-color: var(--background-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
`;

const ChartTitle = styled.div`
  h3 {
    font-size: 1.1rem;
    margin-bottom: var(--spacing-xs);
  }
  
  p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0;
  }
`;

const ChartActions = styled.div`
  display: flex;
  align-items: center;
`;

const IconButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--spacing-sm);
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--primary-color);
  }
`;

const ChartContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
  min-height: 250px;
`;

const ChartFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const LegendList = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: var(--spacing-md);
  margin-bottom: var(--spacing-xs);
  
  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    background-color: ${props => props.color};
    margin-right: var(--spacing-xs);
  }
  
  .legend-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
`;

const TimeframeSelector = styled.div`
  display: flex;
  
  button {
    border: none;
    background-color: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
    color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    font-size: 0.8rem;
    margin-left: 5px;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: ${props => props.active ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.05)'};
    }
  }
`;

const ChartCard = ({ 
  title, 
  subtitle, 
  children, 
  legends = [], 
  timeframes = ['Day', 'Week', 'Month', 'Year'],
  activeTimeframe = 'Week',
  onTimeframeChange = () => {}
}) => {
  return (
    <ChartCardContainer>
      <ChartHeader>
        <ChartTitle>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </ChartTitle>
        <ChartActions>
          <IconButton>
            <FiDownload />
          </IconButton>
          <IconButton>
            <FiMoreHorizontal />
          </IconButton>
        </ChartActions>
      </ChartHeader>
      
      <ChartContent>
        {children}
      </ChartContent>
      
      <ChartFooter>
        <LegendList>
          {legends.map((legend, index) => (
            <LegendItem key={index} color={legend.color}>
              <div className="legend-color" />
              <div className="legend-label">{legend.label}</div>
            </LegendItem>
          ))}
        </LegendList>
        
        <TimeframeSelector>
          {timeframes.map(timeframe => (
            <button 
              key={timeframe}
              className={activeTimeframe === timeframe ? 'active' : ''}
              onClick={() => onTimeframeChange(timeframe)}
            >
              {timeframe}
            </button>
          ))}
        </TimeframeSelector>
      </ChartFooter>
    </ChartCardContainer>
  );
};

export default ChartCard; 