import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Product, Vehicle, Post, Rating, Banner, AnalyticsEvent, Question, DashboardStats, Advertisement, AdStats } from '@/lib/types';
import { mockUsers, mockProducts, mockVehicles, mockPosts, mockRatings, mockBanners, mockQuestions, mockAdvertisements, mockAdStats } from '@/lib/data';

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
  questions: Question[];
  advertisements: Advertisement[];
  
  // Actions
  likePost: (postId: string) => void;
  reportPost: (postId: string) => void;
  submitRating: (productId: string, rating: number, comment: string) => void;
  submitQuestion: (productId: string, question: string) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  
  // Ads
  getActiveAd: (slot: 'home_hero' | 'product_banner' | 'feed_sponsored') => Advertisement | null;
  getAdStats: (adId?: string) => AdStats[];
  
  // Analytics
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => void;
  getDashboardStats: () => DashboardStats;
  
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
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [ratings, setRatings] = useState<Rating[]>(mockRatings);
  const [banners] = useState<Banner[]>(mockBanners);
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [advertisements] = useState<Advertisement[]>(mockAdvertisements);
  
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

  const likePost = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes_count: post.likes_count + 1, liked_by_user: true }
          : post
      )
    );
    trackEvent({ type: 'like', product_id: posts.find(p => p.id === postId)?.product_id, user_id: currentUser?.id });
  };

  const reportPost = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, reports_count: (post.reports_count || 0) + 1 }
          : post
      )
    );
    trackEvent({ type: 'report_post', product_id: posts.find(p => p.id === postId)?.product_id, user_id: currentUser?.id });
  };

  const submitRating = (productId: string, rating: number, comment: string) => {
    if (!currentUser) return;
    
    const newRating: Rating = {
      id: Math.random().toString(36).substr(2, 9),
      product_id: productId,
      author_id: currentUser.id,
      author_name: currentUser.name,
      rating,
      comment,
      created_at: new Date().toISOString(),
    };
    
    setRatings(prev => [newRating, ...prev]);
    trackEvent({ type: 'rating', product_id: productId, user_id: currentUser.id, metadata: { rating, comment } });
  };

  const submitQuestion = (productId: string, question: string) => {
    if (!currentUser) return;
    
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      product_id: productId,
      author_id: currentUser.id,
      author_name: currentUser.name,
      question,
      created_at: new Date().toISOString(),
    };
    
    setQuestions(prev => [newQuestion, ...prev]);
    trackEvent({ type: 'question_reply', product_id: productId, user_id: currentUser.id, metadata: { question } });
  };

  const answerQuestion = (questionId: string, answer: string) => {
    if (!currentUser) return;
    
    setQuestions(prevQuestions => 
      prevQuestions.map(question => 
        question.id === questionId 
          ? { ...question, answer, answer_by: currentUser.name, answered_at: new Date().toISOString() }
          : question
      )
    );
    trackEvent({ type: 'question_reply', user_id: currentUser.id, metadata: { questionId, answer } });
  };

  const getDashboardStats = (): DashboardStats => {
    return {
      dau: 147,
      mau: 2834,
      manual_views_today: 89,
      posts_today: posts.filter(p => {
        const today = new Date().toDateString();
        const postDate = new Date(p.created_at).toDateString();
        return today === postDate;
      }).length,
      likes_today: posts.reduce((sum, post) => sum + post.likes_count, 0),
      avg_rating: ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length || 0,
    };
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

  const getActiveAd = (slot: 'home_hero' | 'product_banner' | 'feed_sponsored'): Advertisement | null => {
    const now = new Date();
    const activeAds = advertisements.filter(ad => {
      const startDate = new Date(ad.start_date);
      const endDate = new Date(ad.end_date);
      return ad.status === 'active' && 
             ad.slot === slot &&
             now >= startDate && 
             now <= endDate;
    });
    
    // Return the first active ad for the slot (in real app, would consider capping)
    return activeAds[0] || null;
  };

  const getAdStats = (adId?: string): AdStats[] => {
    if (adId) {
      return mockAdStats.filter(stat => stat.ad_id === adId);
    }
    return mockAdStats;
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
    questions,
    advertisements,
    likePost,
    reportPost,
    submitRating,
    submitQuestion,
    answerQuestion,
    getActiveAd,
    getAdStats,
    trackEvent,
    getDashboardStats,
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