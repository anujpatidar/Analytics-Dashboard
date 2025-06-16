import React from 'react';
import { useStore } from '../../context/StoreContext';
import { FiInfo } from 'react-icons/fi';

const StoreIndicator = () => {
  const { currentStore } = useStore();

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
      <div className="flex items-center space-x-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-semibold shadow-sm"
          style={{ backgroundColor: currentStore.color }}
        >
          {currentStore.logo}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            Viewing {currentStore.name} Analytics
          </h3>
          <p className="text-sm text-gray-600">
            {currentStore.id === 'myfrido' 
              ? 'Real-time data from BigQuery' 
              : 'Demo data for this store'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2 text-blue-600">
          <FiInfo className="w-4 h-4" />
          <span className="text-sm font-medium">
            {currentStore.id === 'myfrido' ? 'Live Data' : 'Demo Data'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StoreIndicator; 