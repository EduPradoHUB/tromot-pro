import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Database types
type Profile = Database['public']['Tables']['profiles']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Banner = Database['public']['Tables']['banners']['Row'];
type Advertisement = Database['public']['Tables']['advertisements']['Row'];  
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];
type Rating = Database['public']['Tables']['ratings']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];
type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row'];

// Insert types for creating new records
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type BannerInsert = Database['public']['Tables']['banners']['Insert'];
type AdvertisementInsert = Database['public']['Tables']['advertisements']['Insert'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];

// Legacy interfaces for backward compatibility
interface LegacyUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADM' | 'Técnico Tromot' | 'Cliente';
  avatar?: string;
}

interface LegacyPost {
  id: string;
  product_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  photo_url: string;
  caption: string;
  likes_count: number;
  created_at: string;
  status: 'approved' | 'pending' | 'rejected';
  liked_by_user?: boolean;
  reports_count?: number;
}

interface LegacyRating {
  id: string;
  product_id: string;
  author_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface LegacyQuestion {
  id: string;
  product_id: string;
  author_id: string;
  author_name: string;
  question: string;
  answer?: string;
  answer_by?: string;
  created_at: string;
  answered_at?: string;
}

interface LegacyAnalyticsEvent {
  id: string;
  type: 'view_product' | 'view_manual' | 'login' | 'new_post' | 'like' | 'rating' | 'question_reply' | 'report_post' | 'ad_impression' | 'ad_click';
  product_id?: string;
  user_id?: string;
  ad_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface DashboardStats {
  dau: number;
  mau: number;
  manual_views_today: number;
  posts_today: number;
  likes_today: number;
  avg_rating: number;
}

interface AdStats {
  ad_id: string;
  impressions: number;
  clicks: number;
  ctr: number;
  date: string;
}

interface AppContextType {
  // New Supabase Auth
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Legacy Auth (for backward compatibility)
  currentUser: LegacyUser | null;
  
  // Data
  products: Product[];
  banners: Banner[];
  advertisements: Advertisement[];
  vehicles: Vehicle[];
  
  // Legacy data (for backward compatibility)
  posts: LegacyPost[];
  ratings: LegacyRating[];
  questions: LegacyQuestion[];
  
  // CRUD Functions
  createProduct: (data: ProductInsert) => Promise<Product>;
  updateProduct: (id: string, data: Partial<ProductInsert>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  
  createBanner: (data: BannerInsert) => Promise<Banner>;
  updateBanner: (id: string, data: Partial<BannerInsert>) => Promise<Banner>;
  deleteBanner: (id: string) => Promise<void>;
  
  createAdvertisement: (data: AdvertisementInsert) => Promise<Advertisement>;
  updateAdvertisement: (id: string, data: Partial<AdvertisementInsert>) => Promise<Advertisement>;
  deleteAdvertisement: (id: string) => Promise<void>;
  
  createVehicle: (data: VehicleInsert) => Promise<Vehicle>;
  
  // File upload
  uploadFile: (bucket: string, path: string, file: File) => Promise<string>;
  
  // Legacy functions (for backward compatibility)
  likePost: (postId: string) => void;
  reportPost: (postId: string) => void;
  submitRating: (productId: string, rating: number, comment: string) => void;
  submitQuestion: (productId: string, question: string) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  getActiveAd: (slot: 'home_hero' | 'product_banner' | 'feed_sponsored') => Advertisement | null;
  getAdStats: (adId?: string) => AdStats[];
  trackEvent: (event: Omit<LegacyAnalyticsEvent, 'id' | 'timestamp'>) => void;
  getDashboardStats: () => DashboardStats;
  
  // Filters
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Refresh data
  fetchData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Legacy state (mock data for backward compatibility)
  const [posts, setPosts] = useState<LegacyPost[]>([]);
  const [ratings, setRatings] = useState<LegacyRating[]>([]);
  const [questions, setQuestions] = useState<LegacyQuestion[]>([]);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedBrand, setSelectedBrand] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth functions
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // File upload function
  const uploadFile = async (bucket: string, path: string, file: File): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  // CRUD Functions for Products
  const createProduct = async (data: ProductInsert): Promise<Product> => {
    const { data: product, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    
    setProducts(prev => [...prev, product]);
    return product;
  };

  const updateProduct = async (id: string, data: Partial<ProductInsert>): Promise<Product> => {
    const { data: product, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    setProducts(prev => prev.map(p => p.id === id ? product : p));
    return product;
  };

  const deleteProduct = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // CRUD Functions for Banners
  const createBanner = async (data: BannerInsert): Promise<Banner> => {
    const { data: banner, error } = await supabase
      .from('banners')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    
    setBanners(prev => [...prev, banner]);
    return banner;
  };

  const updateBanner = async (id: string, data: Partial<BannerInsert>): Promise<Banner> => {
    const { data: banner, error } = await supabase
      .from('banners')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    setBanners(prev => prev.map(b => b.id === id ? banner : b));
    return banner;
  };

  const deleteBanner = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  // CRUD Functions for Advertisements
  const createAdvertisement = async (data: AdvertisementInsert): Promise<Advertisement> => {
    const { data: ad, error } = await supabase
      .from('advertisements')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    
    setAdvertisements(prev => [...prev, ad]);
    return ad;
  };

  const updateAdvertisement = async (id: string, data: Partial<AdvertisementInsert>): Promise<Advertisement> => {
    const { data: ad, error } = await supabase
      .from('advertisements')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    setAdvertisements(prev => prev.map(a => a.id === id ? ad : a));
    return ad;
  };

  const deleteAdvertisement = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setAdvertisements(prev => prev.filter(a => a.id !== id));
  };

  // CRUD Functions for Vehicles
  const createVehicle = async (data: VehicleInsert): Promise<Vehicle> => {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    
    setVehicles(prev => [...prev, vehicle]);
    return vehicle;
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      const [
        { data: productsData },
        { data: bannersData },
        { data: advertisementsData },
        { data: vehiclesData }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('banners').select('*'),
        supabase.from('advertisements').select('*'),
        supabase.from('vehicles').select('*')
      ]);

      if (productsData) setProducts(productsData);
      if (bannersData) setBanners(bannersData);
      if (advertisementsData) setAdvertisements(advertisementsData);
      if (vehiclesData) setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Legacy functions for backward compatibility
  const likePost = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes_count: post.likes_count + 1, liked_by_user: true }
          : post
      )
    );
  };

  const reportPost = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, reports_count: (post.reports_count || 0) + 1 }
          : post
      )
    );
  };

  const submitRating = (productId: string, rating: number, comment: string) => {
    if (!profile) return;
    
    const newRating: LegacyRating = {
      id: Math.random().toString(36).substr(2, 9),
      product_id: productId,
      author_id: profile.id,
      author_name: profile.name,
      rating,
      comment,
      created_at: new Date().toISOString(),
    };
    
    setRatings(prev => [newRating, ...prev]);
  };

  const submitQuestion = (productId: string, question: string) => {
    if (!profile) return;
    
    const newQuestion: LegacyQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      product_id: productId,
      author_id: profile.id,
      author_name: profile.name,
      question,
      created_at: new Date().toISOString(),
    };
    
    setQuestions(prev => [newQuestion, ...prev]);
  };

  const answerQuestion = (questionId: string, answer: string) => {
    if (!profile) return;
    
    setQuestions(prevQuestions => 
      prevQuestions.map(question => 
        question.id === questionId 
          ? { ...question, answer, answer_by: profile.name, answered_at: new Date().toISOString() }
          : question
      )
    );
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
    
    return activeAds[0] || null;
  };

  const getAdStats = (adId?: string): AdStats[] => {
    // Mock data for now
    return [];
  };

  const getDashboardStats = (): DashboardStats => {
    return {
      dau: 147,
      mau: 2834,
      manual_views_today: 89,
      posts_today: 0,
      likes_today: 0,
      avg_rating: 4.2,
    };
  };

  const trackEvent = (event: Omit<LegacyAnalyticsEvent, 'id' | 'timestamp'>) => {
    console.log('Analytics Event:', event);
  };

  // Legacy currentUser for backward compatibility
  const currentUser: LegacyUser | null = profile ? {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone || undefined,
    role: profile.role,
    avatar: profile.avatar_url || undefined
  } : null;

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          setProfile(profileData);
          
          // Fetch app data
          await fetchData();
        } else {
          setProfile(null);
          setProducts([]);
          setBanners([]);
          setAdvertisements([]);
          setVehicles([]);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value: AppContextType = {
    // New Supabase
    user,
    profile,
    loading,
    login,
    logout,
    products,
    banners,
    advertisements,
    vehicles,
    createProduct,
    updateProduct,
    deleteProduct,
    createBanner,
    updateBanner,
    deleteBanner,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    createVehicle,
    uploadFile,
    fetchData,
    
    // Legacy compatibility
    currentUser,
    posts,
    ratings,
    questions,
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
    setSearchQuery
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};