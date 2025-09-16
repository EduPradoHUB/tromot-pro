import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { DistributorPublic, fetchDistributorsPublic } from '@/lib/distributorUtils';

// Database types
type Profile = Database['public']['Tables']['profiles']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Banner = Database['public']['Tables']['banners']['Row'];
type Advertisement = Database['public']['Tables']['advertisements']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Distributor = Database['public']['Tables']['distributors']['Row'];

// Insert types for creating new records
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type BannerInsert = Database['public']['Tables']['banners']['Insert'];
type AdvertisementInsert = Database['public']['Tables']['advertisements']['Insert'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type DistributorInsert = Database['public']['Tables']['distributors']['Insert'];

// Legacy interfaces for backward compatibility
interface LegacyUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADM' | 'Técnico Tromot' | 'Cliente' | 'Suporte Tromot';
  avatar?: string;
}

interface LegacyVehicle {
  id: string;
  brand: string;
  model: string;
  years: string[];
}

interface LegacyProduct {
  id: string;
  name: string;
  code: string;
  category: string;
  compatibility: LegacyVehicle[];
  manual_url?: string;
  manual_type?: 'pdf' | 'image';
  video_url?: string;
  rating_average: number;
  rating_count: number;
  image_url: string;
  description: string;
  status: 'active' | 'inactive';
  out_of_production?: boolean;
  no_manual_available?: boolean;
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
  type: 'view_product' | 'view_manual' | 'login' | 'new_post' | 'like' | 'rating' | 'question_reply' | 'report_post' | 'ad_impression' | 'ad_click' | 'buy_now_click' | 'distributor_contact_click';
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
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, customerType?: 'lojista_instalador' | 'distribuidor_representante' | 'usuario_final', whatsapp?: string, city?: string, state?: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  
  // User management (admin only)
  fetchAllProfiles: () => Promise<Profile[]>;
  updateUserRole: (userId: string, role: 'ADM' | 'Técnico Tromot' | 'Cliente') => Promise<void>;
  
  // Legacy Auth (for backward compatibility)
  currentUser: LegacyUser | null;
  
  // Data
  products: Product[];
  banners: Banner[];
  advertisements: Advertisement[];
  vehicles: Vehicle[];
  categories: Category[];
  distributors: DistributorPublic[];
  
  // Legacy data (for backward compatibility)
  posts: LegacyPost[];
  ratings: LegacyRating[];
  questions: LegacyQuestion[];
  
  // Legacy products with proper compatibility type
  legacyProducts: LegacyProduct[];
  
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
  updateVehicle: (id: string, data: Partial<VehicleInsert>) => Promise<Vehicle>;
  deleteVehicle: (id: string) => Promise<void>;
  
  createCategory: (data: CategoryInsert) => Promise<Category>;
  updateCategory: (id: string, data: Partial<CategoryInsert>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  
  createDistributor: (data: DistributorInsert) => Promise<Distributor>;
  updateDistributor: (id: string, data: Partial<DistributorInsert>) => Promise<Distributor>;
  deleteDistributor: (id: string) => Promise<void>;
  
  // Post moderation functions
  moderatePost: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  
  // Profile management
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  
  // File upload
  uploadFile: (bucket: string, path: string, file: File) => Promise<string>;
  
  // Real analytics functions
  getDashboardStatsReal: () => Promise<DashboardStats>;
  getAnalyticsChartData: (days?: number) => Promise<Array<{
    date: string;
    day: string;
    manual_views: number;
    posts: number;
    likes: number;
  }>>;
  getCategoryDistribution: () => Promise<Array<{
    name: string;
    value: number;
  }>>;
  trackAdImpression: (adId: string) => Promise<void>;
  trackAdClick: (adId: string) => Promise<void>;
  
  // Legacy functions (for backward compatibility)
  likePost: (postId: string) => void;
  reportPost: (postId: string) => void;
  submitRating: (productId: string, rating: number, comment: string) => void;
  submitQuestion: (productId: string, question: string) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  getActiveAd: (slot: 'home_hero' | 'product_banner' | 'feed_sponsored', productId?: string, productCategory?: string) => Advertisement | null;
  getAdStats: (adId?: string) => AdStats[];
  trackEvent: (event: Omit<LegacyAnalyticsEvent, 'id' | 'timestamp'>) => Promise<void>;
  getDashboardStats: () => DashboardStats;
  
  // Barcode scanning
  findProductByBarcode: (barcode: string) => Promise<LegacyProduct | null>;
  
  // Editable content
  editableContent: any[];
  fetchEditableContent: () => Promise<void>;
  updateEditableContent: (section: string, content: { title?: string; subtitle?: string; description?: string }) => Promise<boolean>;
  updateSectionVisibility: (section: string, visible: boolean) => Promise<boolean>;
  getEditableContent: (section: string) => any;
  
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

export const AppProvider = ({ children }: { children: ReactNode }) => {
  console.log('🚀 AppProvider iniciando - React disponível:', !!React);
  console.log('🚀 React.useState disponível:', !!React.useState);
  
  // State declarations
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [advertisements, setAdvertisements] = React.useState<Advertisement[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [distributors, setDistributors] = React.useState<DistributorPublic[]>([]);
  
  // Legacy state (mock data for backward compatibility)
  const [posts, setPosts] = React.useState<LegacyPost[]>([]);
  const [ratings, setRatings] = React.useState<LegacyRating[]>([]);
  const [questions, setQuestions] = React.useState<LegacyQuestion[]>([]);
  
  // Editable content state
  const [editableContent, setEditableContent] = React.useState<any[]>([]);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = React.useState('Todos');
  const [selectedBrand, setSelectedBrand] = React.useState('Todos');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Analytics and dashboard functions - DEFINED FIRST
  const getDashboardStatsReal = React.useCallback(async (): Promise<DashboardStats> => {
    try {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get DAU (users active today)
      const { count: dauCount } = await supabase
        .from('analytics_events')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString())
        .not('user_id', 'is', null);

      // Get MAU (users active this month)
      const { count: mauCount } = await supabase
        .from('analytics_events')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .not('user_id', 'is', null);

      // Get manual views today
      const { count: manualViewsToday } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'view_manual')
        .gte('created_at', startOfToday.toISOString());

      // Get posts created today
      const { count: postsToday } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString());

      // Get likes today
      const { count: likesToday } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString());

      // Get average rating
      const { data: avgRatingData } = await supabase
        .from('ratings')
        .select('rating');

      let avgRating = 0;
      if (avgRatingData && avgRatingData.length > 0) {
        const sum = avgRatingData.reduce((acc, rating) => acc + rating.rating, 0);
        avgRating = sum / avgRatingData.length;
      }

      return {
        dau: dauCount || 0,
        mau: mauCount || 0,
        manual_views_today: manualViewsToday || 0,
        posts_today: postsToday || 0,
        likes_today: likesToday || 0,
        avg_rating: avgRating
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        dau: 0,
        mau: 0,
        manual_views_today: 0,
        posts_today: 0,
        likes_today: 0,
        avg_rating: 0
      };
    }
  }, []);

  // Get analytics data for charts
  const getAnalyticsChartData = React.useCallback(async (days: number = 7) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data } = await supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (!data) return [];

      // Group by day
      const groupedData: Record<string, { manual_views: number; posts: number; likes: number }> = {};

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        groupedData[dateKey] = { manual_views: 0, posts: 0, likes: 0 };
      }

      data.forEach(event => {
        const dateKey = event.created_at.split('T')[0];
        if (groupedData[dateKey]) {
          if (event.event_type === 'view_manual') {
            groupedData[dateKey].manual_views++;
          } else if (event.event_type === 'new_post') {
            groupedData[dateKey].posts++;
          } else if (event.event_type === 'like') {
            groupedData[dateKey].likes++;
          }
        }
      });

      return Object.entries(groupedData)
        .map(([date, data]) => ({
          date,
          day: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
          manual_views: data.manual_views,
          posts: data.posts,
          likes: data.likes
        }))
        .reverse();

    } catch (error) {
      console.error('Error fetching analytics chart data:', error);
      return [];
    }
  }, []);

  // Get category distribution
  const getCategoryDistribution = React.useCallback(async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('category')
        .eq('status', 'active');

      if (!data) return [];

      const categoryCount: Record<string, number> = {};
      data.forEach(product => {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
      });

      return Object.entries(categoryCount).map(([name, value]) => ({
        name,
        value
      }));
    } catch (error) {
      console.error('Error fetching category distribution:', error);
      return [];
    }
  }, []);

  // Legacy getDashboardStats for compatibility
  const getDashboardStats = React.useCallback((): DashboardStats => {
    return {
      dau: 147,
      mau: 2834,
      manual_views_today: 89,
      posts_today: 0,
      likes_today: 0,
      avg_rating: 4.2,
    };
  }, []);

  // Track event function
  const trackEvent = React.useCallback(async (event: Omit<LegacyAnalyticsEvent, 'id' | 'timestamp'>) => {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: event.type,
          product_id: event.product_id || null,
          user_id: event.user_id || (user?.id || null),
          ad_id: event.ad_id || null,
          metadata: event.metadata || {}
        });
      
      if (error) {
        console.error('Error tracking event:', error);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, [user]);

  // Ad impression tracking
  const trackAdImpression = React.useCallback(async (adId: string) => {
    try {
      // Get current count and increment
      const { data: ad } = await supabase
        .from('advertisements')
        .select('impressions_count')
        .eq('id', adId)
        .single();

      if (ad) {
        const { error } = await supabase
          .from('advertisements')
          .update({ 
            impressions_count: (ad.impressions_count || 0) + 1
          })
          .eq('id', adId);

        if (error) {
          console.error('Error tracking ad impression:', error);
        }
      }

      // Track analytics event
      await trackEvent({
        type: 'ad_impression',
        ad_id: adId
      });
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  }, [trackEvent]);

  // Ad click tracking
  const trackAdClick = React.useCallback(async (adId: string) => {
    try {
      // Get current count and increment
      const { data: ad } = await supabase
        .from('advertisements')
        .select('clicks_count')
        .eq('id', adId)
        .single();

      if (ad) {
        const { error } = await supabase
          .from('advertisements')
          .update({ 
            clicks_count: (ad.clicks_count || 0) + 1
          })
          .eq('id', adId);

        if (error) {
          console.error('Error tracking ad click:', error);
        }
      }

      // Track analytics event
      await trackEvent({
        type: 'ad_click',
        ad_id: adId
      });
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  }, [trackEvent]);

  // Auth functions
  const login = React.useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signUp = React.useCallback(async (
    email: string, 
    password: string, 
    name: string, 
    customerType?: 'lojista_instalador' | 'distribuidor_representante' | 'usuario_final',
    whatsapp?: string,
    city?: string,
    state?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            customer_type: customerType,
            whatsapp,
            city,
            state
          }
        }
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const resetPassword = React.useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  // Profile management
  const fetchAllProfiles = React.useCallback(async (): Promise<Profile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
  }, []);

  const updateUserRole = React.useCallback(async (userId: string, role: 'ADM' | 'Técnico Tromot' | 'Cliente') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }, []);

  const updateProfile = React.useCallback(async (data: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [user]);

  // CRUD Functions
  const createProduct = React.useCallback(async (data: ProductInsert): Promise<Product> => {
    const { data: product, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    
    setProducts(prev => [...prev, product]);
    return product;
  }, []);

  const updateProduct = React.useCallback(async (id: string, data: Partial<ProductInsert>): Promise<Product> => {
    const { data: product, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setProducts(prev => prev.map(p => p.id === id ? product : p));
    return product;
  }, []);

  const deleteProduct = React.useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const createBanner = React.useCallback(async (data: BannerInsert): Promise<Banner> => {
    const { data: banner, error } = await supabase
      .from('banners')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    
    setBanners(prev => [...prev, banner]);
    return banner;
  }, []);

  const updateBanner = React.useCallback(async (id: string, data: Partial<BannerInsert>): Promise<Banner> => {
    const { data: banner, error } = await supabase
      .from('banners')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setBanners(prev => prev.map(b => b.id === id ? banner : b));
    return banner;
  }, []);

  const deleteBanner = React.useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setBanners(prev => prev.filter(b => b.id !== id));
  }, []);

  const createAdvertisement = React.useCallback(async (data: AdvertisementInsert): Promise<Advertisement> => {
    const { data: advertisement, error } = await supabase
      .from('advertisements')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    
    setAdvertisements(prev => [...prev, advertisement]);
    return advertisement;
  }, []);

  const updateAdvertisement = React.useCallback(async (id: string, data: Partial<AdvertisementInsert>): Promise<Advertisement> => {
    const { data: advertisement, error } = await supabase
      .from('advertisements')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setAdvertisements(prev => prev.map(a => a.id === id ? advertisement : a));
    return advertisement;
  }, []);

  const deleteAdvertisement = React.useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setAdvertisements(prev => prev.filter(a => a.id !== id));
  }, []);

  const createVehicle = React.useCallback(async (data: VehicleInsert): Promise<Vehicle> => {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    
    setVehicles(prev => [...prev, vehicle]);
    return vehicle;
  }, []);

  const updateVehicle = React.useCallback(async (id: string, data: Partial<VehicleInsert>): Promise<Vehicle> => {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setVehicles(prev => prev.map(v => v.id === id ? vehicle : v));
    return vehicle;
  }, []);

  const deleteVehicle = React.useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  const createCategory = React.useCallback(async (data: CategoryInsert): Promise<Category> => {
    const { data: category, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    
    setCategories(prev => [...prev, category]);
    return category;
  }, []);

  const updateCategory = React.useCallback(async (id: string, data: Partial<CategoryInsert>): Promise<Category> => {
    const { data: category, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setCategories(prev => prev.map(c => c.id === id ? category : c));
    return category;
  }, []);

  const deleteCategory = React.useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const createDistributor = React.useCallback(async (data: DistributorInsert): Promise<Distributor> => {
    const { data: distributor, error } = await supabase
      .from('distributors')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    
    return distributor;
  }, []);

  const updateDistributor = React.useCallback(async (id: string, data: Partial<DistributorInsert>): Promise<Distributor> => {
    const { data: distributor, error } = await supabase
      .from('distributors')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return distributor;
  }, []);

  const deleteDistributor = React.useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('distributors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, []);

  // Post moderation
  const moderatePost = React.useCallback(async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('Error moderating post:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error moderating post:', error);
      throw error;
    }
  }, []);

  // File upload
  const uploadFile = React.useCallback(async (bucket: string, path: string, file: File): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }, []);

  // Legacy functions for backward compatibility
  const likePost = React.useCallback((postId: string) => {
    console.log('Legacy likePost called for:', postId);
  }, []);

  const reportPost = React.useCallback((postId: string) => {
    console.log('Legacy reportPost called for:', postId);
  }, []);

  const submitRating = React.useCallback((productId: string, rating: number, comment: string) => {
    console.log('Legacy submitRating called for:', productId, rating, comment);
  }, []);

  const submitQuestion = React.useCallback((productId: string, question: string) => {
    console.log('Legacy submitQuestion called for:', productId, question);
  }, []);

  const answerQuestion = React.useCallback((questionId: string, answer: string) => {
    console.log('Legacy answerQuestion called for:', questionId, answer);
  }, []);

  const getActiveAd = React.useCallback((slot: 'home_hero' | 'product_banner' | 'feed_sponsored', productId?: string, productCategory?: string): Advertisement | null => {
    const activeAds = advertisements.filter(ad => 
      ad.status === 'active' && 
      ad.slot === slot &&
      (!ad.start_date || new Date(ad.start_date) <= new Date()) &&
      (!ad.end_date || new Date(ad.end_date) >= new Date())
    );

    if (activeAds.length === 0) return null;

    // Simple random selection for now
    return activeAds[Math.floor(Math.random() * activeAds.length)];
  }, [advertisements]);

  const getAdStats = React.useCallback((adId?: string): AdStats[] => {
    // Mock data for backward compatibility
    return [];
  }, []);

  const findProductByBarcode = React.useCallback(async (barcode: string): Promise<LegacyProduct | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (error || !data) return null;

      // Convert to legacy format
      return {
        id: data.id,
        name: data.name,
        code: data.code || '',
        category: data.category,
        compatibility: [], // Would need to fetch from relationships
        manual_url: data.manual_url,
        manual_type: data.manual_type as 'pdf' | 'image',
        video_url: data.video_url,
        rating_average: data.rating_average || 0,
        rating_count: data.rating_count || 0,
        image_url: data.image_url || '',
        description: data.description || '',
        status: data.status as 'active' | 'inactive',
        out_of_production: data.out_of_production,
        no_manual_available: data.no_manual_available
      };
    } catch (error) {
      console.error('Error finding product by barcode:', error);
      return null;
    }
  }, []);

  // Editable content functions
  const fetchEditableContent = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('editable_content')
        .select('*');

      if (error) {
        console.error('Error fetching editable content:', error);
        return;
      }

      setEditableContent(data || []);
    } catch (error) {
      console.error('Error fetching editable content:', error);
    }
  }, []);

  const updateEditableContent = React.useCallback(async (section: string, content: { title?: string; subtitle?: string; description?: string }): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('editable_content')
        .upsert({
          section,
          content
        });

      if (error) {
        console.error('Error updating editable content:', error);
        return false;
      }

      await fetchEditableContent();
      return true;
    } catch (error) {
      console.error('Error updating editable content:', error);
      return false;
    }
  }, [fetchEditableContent]);

  const updateSectionVisibility = React.useCallback(async (section: string, visible: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('editable_content')
        .upsert({
          section,
          visible
        });

      if (error) {
        console.error('Error updating section visibility:', error);
        return false;
      }

      await fetchEditableContent();
      return true;
    } catch (error) {
      console.error('Error updating section visibility:', error);
      return false;
    }
  }, [fetchEditableContent]);

  const getEditableContent = React.useCallback((section: string) => {
    return editableContent.find(content => content.section === section);
  }, [editableContent]);

  // Fetch all data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        productsResult,
        bannersResult,
        advertisementsResult,
        vehiclesResult,
        categoriesResult,
        distributorsResult
      ] = await Promise.allSettled([
        supabase.from('products').select('*').eq('status', 'active'),
        supabase.from('banners').select('*').eq('status', 'active'),
        supabase.from('advertisements').select('*').eq('status', 'active'),
        supabase.from('vehicles').select('*'),
        supabase.from('categories').select('*'),
        fetchDistributorsPublic()
      ]);

      if (productsResult.status === 'fulfilled' && productsResult.value.data) {
        setProducts(productsResult.value.data);
      }

      if (bannersResult.status === 'fulfilled' && bannersResult.value.data) {
        setBanners(bannersResult.value.data);
      }

      if (advertisementsResult.status === 'fulfilled' && advertisementsResult.value.data) {
        setAdvertisements(advertisementsResult.value.data);
      }

      if (vehiclesResult.status === 'fulfilled' && vehiclesResult.value.data) {
        setVehicles(vehiclesResult.value.data);
      }

      if (categoriesResult.status === 'fulfilled' && categoriesResult.value.data) {
        setCategories(categoriesResult.value.data);
      }

      if (distributorsResult.status === 'fulfilled') {
        setDistributors(distributorsResult.value);
      }

      await fetchEditableContent();

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchEditableContent]);

  // Initialize auth state
  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setProfile(profile);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setProfile(profile);
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data on mount
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Legacy computed properties
  const currentUser: LegacyUser | null = React.useMemo(() => {
    if (!user || !profile) return null;
    
    return {
      id: user.id,
      name: profile.name || user.email || '',
      email: user.email || '',
      phone: profile.whatsapp,
      role: profile.role as 'ADM' | 'Técnico Tromot' | 'Cliente' | 'Suporte Tromot',
      avatar: profile.avatar_url
    };
  }, [user, profile]);

  const legacyProducts: LegacyProduct[] = React.useMemo(() => {
    return products.map(product => ({
      id: product.id,
      name: product.name,
      code: product.code || '',
      category: product.category,
      compatibility: [], // Would need to fetch from relationships
      manual_url: product.manual_url,
      manual_type: product.manual_type as 'pdf' | 'image',
      video_url: product.video_url,
      rating_average: product.rating_average || 0,
      rating_count: product.rating_count || 0,
      image_url: product.image_url || '',
      description: product.description || '',
      status: product.status as 'active' | 'inactive',
      out_of_production: product.out_of_production,
      no_manual_available: product.no_manual_available
    }));
  }, [products]);

  const value: AppContextType = {
    // New Supabase
    user,
    session,
    profile,
    loading,
    login,
    signUp,
    resetPassword,
    logout,
    fetchAllProfiles,
    updateUserRole,
    products,
    banners,
    advertisements,
    vehicles,
    categories,
    distributors,
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
    updateVehicle,
    deleteVehicle,
    createCategory,
    updateCategory,
    deleteCategory,
    createDistributor,
    updateDistributor,
    deleteDistributor,
    moderatePost,
    updateProfile,
    uploadFile,
    fetchData,
    
    // Legacy compatibility
    currentUser,
    posts,
    ratings,
    questions,
    legacyProducts,
    likePost,
    reportPost,
    submitRating,
    submitQuestion,
    answerQuestion,
    getActiveAd,
    getAdStats,
    trackEvent,
    getDashboardStats,
    // Real analytics functions
    getDashboardStatsReal,
    getAnalyticsChartData,
    getCategoryDistribution,
    trackAdImpression,
    trackAdClick,
    findProductByBarcode,
    
    // Editable content
    editableContent,
    fetchEditableContent,
    updateEditableContent,
    updateSectionVisibility,
    getEditableContent,
    
    // Filters
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    searchQuery,
    setSearchQuery,
  };

  return React.createElement(AppContext.Provider, { value }, children);
};

export default AppProvider;
