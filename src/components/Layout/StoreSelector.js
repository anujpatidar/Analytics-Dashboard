import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { useStore } from '../../context/StoreContext';

const StoreSelector = () => {
  const { currentStore, stores, switchStore } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStoreSelect = (storeId) => {
    switchStore(storeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 mx-3 rounded-xl transition-all duration-200 group ${
          isOpen 
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
            : 'bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md border border-gray-200'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div 
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-semibold transition-all duration-200 ${
              isOpen 
                ? 'bg-white/20 text-white' 
                : 'text-white shadow-sm'
            }`}
            style={{ 
              backgroundColor: isOpen ? 'rgba(255,255,255,0.2)' : currentStore.color 
            }}
          >
            {currentStore.logo}
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${isOpen ? 'text-white' : 'text-gray-900'}`}>
              {currentStore.name}
            </div>
            <div className={`text-xs ${isOpen ? 'text-white/80' : 'text-gray-500'}`}>
              {currentStore.description}
            </div>
          </div>
        </div>
        <FiChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : 'text-gray-400'
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-3 right-3 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleStoreSelect(store.id)}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors duration-150 ${
                currentStore.id === store.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: store.color }}
                >
                  {store.logo}
                </div>
                <div className="text-left">
                  <div className={`font-medium text-sm ${
                    currentStore.id === store.id ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {store.name}
                  </div>
                  <div className={`text-xs ${
                    currentStore.id === store.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {store.description}
                  </div>
                </div>
              </div>
              {currentStore.id === store.id && (
                <FiCheck className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreSelector; 