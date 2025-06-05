import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { formatNumber } from '../../utils/formatters';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change,
  changeType,
  loading = false,
  color = '#2563eb'
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 animate-pulse" style={{ borderLeftColor: color }}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="p-3 rounded-full bg-gray-200 ml-4">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 hover:shadow-lg transition-shadow duration-300" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'string' ? value : formatNumber(value)}
          </p>
          {change && (
            <div className={`flex items-center mt-2 ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'increase' ? 
                <FiTrendingUp className="w-4 h-4 mr-1" /> : 
                <FiTrendingDown className="w-4 h-4 mr-1" />
              }
              <span className="text-sm font-medium">{change}</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-full ml-4" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color: color }} />
        </div>
      </div>
    </div>
  );
};

export default StatCard; 