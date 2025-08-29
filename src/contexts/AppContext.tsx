import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Product, Vehicle, Post, Rating, Banner, AnalyticsEvent } from '@/lib/types';
import { mockUsers, mockProducts, mockVehicles, mockPosts, mockRatings, mockBanners } from '@/lib/data';

interface AppContextType {
  // Auth
  currentUser: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  
  // Data
  products: Product[];
  vehicles: Vehicle[];
  posts: Post[];
  ratings: Rating[];
  banners: Banner[];
  
  // Analytics
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => void;
  
  // Filters
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products] = useState<Product[]>(mockProducts);
  const [vehicles] = useState<Vehicle[]>(mockVehicles);
  const [posts] = useState<Post[]>(mockPosts);
  const [ratings] = useState<Rating[]>(mockRatings);
  const [banners] = useState<Banner[]>(mockBanners);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedBrand, setSelectedBrand] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('tromot_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    // Simple mock authentication
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('tromot_user', JSON.stringify(user));
      trackEvent({ type: 'login', user_id: user.id });
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tromot_user');
  };

  const trackEvent = (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => {
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    
    // In a real app, this would send to analytics service
    console.log('Analytics Event:', fullEvent);
  };

  const value: AppContextType = {
    currentUser,
    login,
    logout,
    products,
    vehicles,
    posts,
    ratings,
    banners,
    trackEvent,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    searchQuery,
    setSearchQuery,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};