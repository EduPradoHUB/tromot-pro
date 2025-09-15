import React, { createContext, useContext, ReactNode } from 'react';

interface SimpleAppContextType {
  loading: boolean;
}

const SimpleAppContext = createContext<SimpleAppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(SimpleAppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('[AppProvider] Rendering simplified version');
  
  const value: SimpleAppContextType = {
    loading: false
  };

  return (
    <SimpleAppContext.Provider value={value}>
      {children}
    </SimpleAppContext.Provider>
  );
};