import React from 'react';
import { FiMoreHorizontal, FiDownload } from 'react-icons/fi';

const ChartCard = ({ 
  title, 
  subtitle, 
  children, 
  legends = [], 
  timeframes = ['Day', 'Week', 'Month', 'Year'],
  activeTimeframe = 'Week',
  onTimeframeChange = () => {},
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
        <div className="h-64 bg-gray-200 rounded mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors duration-200">
            <FiDownload className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors duration-200">
            <FiMoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="min-h-[250px] flex items-center justify-center mb-4">
        {children}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-4">
          {legends.map((legend, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded mr-2" 
                style={{ backgroundColor: legend.color }}
              />
              <span className="text-sm text-gray-500">{legend.label}</span>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-2">
          {timeframes.map(timeframe => (
            <button 
              key={timeframe}
              onClick={() => onTimeframeChange(timeframe)}
              className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                activeTimeframe === timeframe
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartCard; 