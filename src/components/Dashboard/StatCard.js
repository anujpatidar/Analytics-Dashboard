import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change,
  changeType,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
          {Icon}
        </div>
        <div className={`flex items-center text-sm font-medium ${
          changeType === 'increase' ? 'text-green-600' : 'text-red-600'
        }`}>
          {changeType === 'increase' ? <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
          {change}
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
    </div>
  );
};

export default StatCard; 