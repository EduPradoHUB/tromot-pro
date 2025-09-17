import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';

// Progressive loading version to avoid React hooks conflicts
interface SimpleAppContextType {
  // Mock data for basic functionality
  banners: any[];
  legacyProducts: any[];
  trackEvent: (event: any) => Promise<void>;
  findProductByBarcode: (barcode: string) => Promise<any>;
  getEditableContent: (section: string) => any;
  editableContent: any[];
  loading: boolean;
  
  // Auth related
  user: any | null;
  profile: any | null;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, customerType?: string, whatsapp?: string, city?: string, state?: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  
  // Product data
  products: any[];
  posts: any[];
  ratings: any[];
  questions: any[];
  currentUser: any | null;
  
  // Functions
  answerQuestion: (id: string, answer: string) => void;
  updateEditableContent: (section: string, content: any) => Promise<boolean>;
}

// Mock data
const mockProducts = [
  {
    id: '1',
    name: 'Produto Exemplo 1',
    code: 'PROD001',
    category: 'Eletrônicos',
    compatibility: [],
    rating_average: 4.5,
    rating_count: 10,
    image_url: '',
    description: 'Produto de exemplo',
    status: 'active'
  },
  {
    id: '2',
    name: 'Produto Exemplo 2', 
    code: 'PROD002',
    category: 'Acessórios',
    compatibility: [],
    rating_average: 4.0,
    rating_count: 5,
    image_url: '',
    description: 'Produto de exemplo 2',
    status: 'active'
  },
  {
    id: '3',
    name: 'Produto Exemplo 3', 
    code: 'PROD003',
    category: 'Som',
    compatibility: [],
    rating_average: 4.8,
    rating_count: 15,
    image_url: '',
    description: 'Produto de exemplo 3',
    status: 'active'
  },
  {
    id: '4',
    name: 'Produto Exemplo 4', 
    code: 'PROD004',
    category: 'Alarmes',
    compatibility: [],
    rating_average: 4.2,
    rating_count: 8,
    image_url: '',
    description: 'Produto de exemplo 4',
    status: 'active'
  },
  {
    id: '5',
    name: 'Produto Exemplo 5', 
    code: 'PROD005',
    category: 'Multimidia',
    compatibility: [],
    rating_average: 4.6,
    rating_count: 12,
    image_url: '',
    description: 'Produto de exemplo 5',
    status: 'active'
  },
  {
    id: '6',
    name: 'Produto Exemplo 6', 
    code: 'PROD006',
    category: 'Trava',
    compatibility: [],
    rating_average: 4.3,
    rating_count: 7,
    image_url: '',
    description: 'Produto de exemplo 6',
    status: 'active'
  }
];

const AppContextSimple = createContext<SimpleAppContextType>({
  banners: [],
  legacyProducts: [],
  trackEvent: async () => {},
  findProductByBarcode: async () => null,
  getEditableContent: () => ({ visible: true }),
  editableContent: [],
  loading: true,
  user: null,
  profile: null,
  logout: async () => {},
  login: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  products: [],
  posts: [],
  ratings: [],
  questions: [],
  currentUser: null,
  answerQuestion: () => {},
  updateEditableContent: async () => false
});

export const useApp = () => {
  return useContext(AppContextSimple);
};

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Simple progressive loading without complex hooks initially
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay to ensure React is properly initialized
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const contextValue: SimpleAppContextType = {
    banners: [],
    legacyProducts: mockProducts,
    trackEvent: async () => {
      console.log('Event tracked');
    },
    findProductByBarcode: async (barcode: string) => {
      // Simple mock search
      return mockProducts.find(p => p.code === barcode) || null;
    },
    getEditableContent: (section: string) => ({ 
      visible: true,
      title: `Título ${section}`,
      subtitle: `Subtítulo ${section}`,
      description: `Descrição ${section}`
    }),
    editableContent: [],
    loading,
    
    // Auth mocks - assuming logged in as admin for now
    user: { id: '1', email: 'admin@tromot.com' },
    profile: { id: '1', user_id: '1', role: 'ADM' },
    logout: async () => {
      console.log('Logout called');
    },
    login: async (email: string, password: string) => {
      console.log('Login attempt:', email);
      // Mock login success for now
      return { error: null };
    },
    signUp: async (email: string, password: string, name: string) => {
      console.log('Sign up attempt:', email, name);
      // Mock signup success for now
      return { error: null };
    },
    resetPassword: async (email: string) => {
      console.log('Reset password for:', email);
      // Mock reset success for now
      return { error: null };
    },
    
    // Data mocks
    products: mockProducts,
    posts: [],
    ratings: [],
    questions: [],
    currentUser: { id: '1', name: 'Admin', role: 'ADM' },
    
    // Function mocks
    answerQuestion: (id: string, answer: string) => {
      console.log('Answer question:', id, answer);
    },
    updateEditableContent: async (section: string, content: any) => {
      console.log('Update content:', section, content);
      return true;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando TROMOT PRO...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContextSimple.Provider value={contextValue}>
      {children}
    </AppContextSimple.Provider>
  );
};