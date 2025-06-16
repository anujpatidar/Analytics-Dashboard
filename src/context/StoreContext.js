import React, { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const stores = [
  {
    id: 'myfrido',
    name: 'MyFrido',
    logo: '🛍️',
    color: '#3B82F6',
    description: 'Main Store'
  },
  {
    id: 'mobility',
    name: 'Mobility',
    logo: '🚗',
    color: '#10B981',
    description: 'Mobility Solutions'
  },
  {
    id: 'frido_sa',
    name: 'Frido SA',
    logo: '🇿🇦',
    color: '#F59E0B',
    description: 'Saudi Arabia'
  },
  {
    id: 'frido_uae',
    name: 'Frido UAE',
    logo: '🇦🇪',
    color: '#EF4444',
    description: 'United Arab Emirates'
  },
  {
    id: 'frido_usa',
    name: 'Frido USA',
    logo: '🇺🇸',
    color: '#8B5CF6',
    description: 'United States'
  }
];

export const StoreProvider = ({ children }) => {
  const [currentStore, setCurrentStore] = useState(() => {
    // Try to get from localStorage first
    const savedStore = localStorage.getItem('selectedStore');
    return savedStore ? JSON.parse(savedStore) : stores[0]; // Default to myfrido
  });

  // Save to localStorage whenever store changes
  useEffect(() => {
    localStorage.setItem('selectedStore', JSON.stringify(currentStore));
  }, [currentStore]);

  const switchStore = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      setCurrentStore(store);
    }
  };

  const value = {
    currentStore,
    stores,
    switchStore
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}; 