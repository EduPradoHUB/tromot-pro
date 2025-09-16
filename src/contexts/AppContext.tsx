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
  post_id?: string;
  ad_id?: string;
  distributor_id?: string;
  user_id?: string;
  timestamp: string;
  metadata?: any;
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
  // Auth
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, customerType?: string, whatsapp?: string, city?: string, state?: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updateProfile: (updates: any) => Promise<boolean>;
  
  // Data
  products: Product[];
  banners: Banner[];
  advertisements: Advertisement[];
  vehicles: Vehicle[];
  categories: Category[];
  distributors: DistributorPublic[];
  
  // CRUD operations
  createProduct: (product: any) => Promise<boolean>;
  updateProduct: (id: string, updates: any) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  createBanner: (banner: any) => Promise<boolean>;
  updateBanner: (id: string, updates: any) => Promise<boolean>;
  deleteBanner: (id: string) => Promise<boolean>;
  createAdvertisement: (ad: any) => Promise<boolean>;
  updateAdvertisement: (id: string, updates: any) => Promise<boolean>;
  deleteAdvertisement: (id: string) => Promise<boolean>;
  createVehicle: (vehicle: any) => Promise<boolean>;
  updateVehicle: (id: string, updates: any) => Promise<boolean>;
  deleteVehicle: (id: string) => Promise<boolean>;
  createCategory: (category: any) => Promise<boolean>;
  updateCategory: (id: string, updates: any) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  
  // User management
  fetchAllProfiles: () => Promise<any[]>;
  updateUserRole: (userId: string, role: string) => Promise<boolean>;
  
  // File upload
  uploadFile: (file: File, bucket: string, path?: string) => Promise<string | null>;
  
  // Post moderation
  moderatePost: (postId: string, action: string) => Promise<boolean>;
  
  // Legacy compatibility
  currentUser: LegacyUser | null;
  posts: LegacyPost[];
  ratings: LegacyRating[];
  questions: LegacyQuestion[];
  legacyProducts: LegacyProduct[];
  likePost: (postId: string) => void;
  reportPost: (postId: string) => void;
  submitRating: (productId: string, rating: number, comment: string) => void;
  submitQuestion: (productId: string, question: string) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  getActiveAd: (slot: string, productId?: string, productCategory?: string) => any;
  trackEvent: (event: any) => Promise<void>;
  findProductByBarcode: (barcode: string) => Promise<LegacyProduct | null>;
  
  // Analytics functions
  getDashboardStatsReal: () => Promise<DashboardStats>;
  getAnalyticsChartData: (days?: number) => Promise<any[]>;
  getCategoryDistribution: () => Promise<Array<{ name: string; value: number }>>;
  trackAdImpression: (adId: string) => Promise<void>;
  trackAdClick: (adId: string) => Promise<void>;
  
  // Editable content
  editableContent: any[];
  getEditableContent: (section: string) => any;
  updateEditableContent: (section: string, content: any) => Promise<boolean>;
  updateSectionVisibility: (section: string, visible: boolean) => Promise<boolean>;
  
  // Filters
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Utils
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

  // Stub functions for missing functionality
  const signUp = React.useCallback(async (email: string, password: string, name: string) => {
    return { error: null };
  }, []);

  const resetPassword = React.useCallback(async (email: string) => {
    return { error: null };
  }, []);

  const updateProfile = React.useCallback(async (updates: any) => {
    return true;
  }, []);

  const createProduct = React.useCallback(async (product: any) => {
    return true;
  }, []);

  const updateProduct = React.useCallback(async (id: string, updates: any) => {
    return true;
  }, []);

  const deleteProduct = React.useCallback(async (id: string) => {
    return true;
  }, []);

  const createBanner = React.useCallback(async (banner: any) => {
    return true;
  }, []);

  const updateBanner = React.useCallback(async (id: string, updates: any) => {
    return true;
  }, []);

  const deleteBanner = React.useCallback(async (id: string) => {
    return true;
  }, []);

  const createAdvertisement = React.useCallback(async (ad: any) => {
    return true;
  }, []);

  const updateAdvertisement = React.useCallback(async (id: string, updates: any) => {
    return true;
  }, []);

  const deleteAdvertisement = React.useCallback(async (id: string) => {
    return true;
  }, []);

  const createVehicle = React.useCallback(async (vehicle: any) => {
    return true;
  }, []);

  const updateVehicle = React.useCallback(async (id: string, updates: any) => {
    return true;
  }, []);

  const deleteVehicle = React.useCallback(async (id: string) => {
    return true;
  }, []);

  const createCategory = React.useCallback(async (category: any) => {
    return true;
  }, []);

  const updateCategory = React.useCallback(async (id: string, updates: any) => {
    return true;
  }, []);

  const deleteCategory = React.useCallback(async (id: string) => {
    return true;
  }, []);

  const fetchAllProfiles = React.useCallback(async () => {
    return [];
  }, []);

  const updateUserRole = React.useCallback(async (userId: string, role: string) => {
    return true;
  }, []);

  const uploadFile = React.useCallback(async (file: File, bucket: string, path?: string) => {
    return null;
  }, []);

  const moderatePost = React.useCallback(async (postId: string, action: 'approve' | 'reject' | 'approved' | 'rejected') => {
    return true;
  }, []);

  const likePost = React.useCallback((postId: string) => {
    console.log('Like post:', postId);
  }, []);

  const reportPost = React.useCallback((postId: string) => {
    console.log('Report post:', postId);
  }, []);

  const submitRating = React.useCallback((productId: string, rating: number, comment: string) => {
    console.log('Submit rating:', productId, rating, comment);
  }, []);

  const submitQuestion = React.useCallback((productId: string, question: string) => {
    console.log('Submit question:', productId, question);
  }, []);

  const answerQuestion = React.useCallback((questionId: string, answer: string) => {
    console.log('Answer question:', questionId, answer);
  }, []);

  const getActiveAd = React.useCallback((slot: string) => {
    return null;
  }, []);

  const trackEvent = React.useCallback(async (event: any) => {
    console.log('Track event:', event);
  }, []);

  const findProductByBarcode = React.useCallback(async (barcode: string) => {
    return null;
  }, []);

  const getEditableContent = React.useCallback((section: string) => {
    return editableContent.find(item => item.section === section);
  }, [editableContent]);

  const updateEditableContent = React.useCallback(async (section: string, content: any) => {
    return true;
  }, []);

  const updateSectionVisibility = React.useCallback(async (section: string, visible: boolean) => {
    return true;
  }, []);

  // Analytics functions
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

  // Get category distribution for pie chart
  const getCategoryDistribution = React.useCallback(async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('name');

      if (!categoriesData) return [];

      const distribution = await Promise.all(
        categoriesData.map(async (category) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category', category.name);

          return {
            name: category.name,
            value: count || 0
          };
        })
      );

      return distribution.filter(item => item.value > 0);
    } catch (error) {
      console.error('Error fetching category distribution:', error);
      return [];
    }
  }, []);

  // Track ad events
  const trackAdImpression = React.useCallback(async (adId: string) => {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'ad_impression',
          metadata: { ad_id: adId },
          user_id: user?.id || null
        });
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  }, [user?.id]);

  const trackAdClick = React.useCallback(async (adId: string) => {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'ad_click',
          metadata: { ad_id: adId },
          user_id: user?.id || null
        });
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  }, [user?.id]);

  // Auth functions
  const login = React.useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const logout = React.useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        productsResult,
        bannersResult,
        advertisementsResult,
        vehiclesResult,
        categoriesResult,
        distributorsResult
      ] = await Promise.allSettled([
        supabase.from('products').select('*'),
        supabase.from('banners').select('*').eq('status', 'active'),
        supabase.from('advertisements').select('*'),
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

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    // Auth
    user,
    session,
    profile,
    loading,
    login,
    signUp,
    resetPassword,
    logout,
    updateProfile,
    
    // Data
    products,
    banners,
    advertisements,
    vehicles,
    categories,
    distributors,
    
    // CRUD operations
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
    
    // User management
    fetchAllProfiles,
    updateUserRole,
    
    // File upload
    uploadFile,
    
    // Post moderation
    moderatePost,
    
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
    trackEvent,
    findProductByBarcode,
    
    // Analytics functions
    getDashboardStatsReal,
    getAnalyticsChartData,
    getCategoryDistribution,
    trackAdImpression,
    trackAdClick,
    
    // Editable content
    editableContent,
    getEditableContent,
    updateEditableContent,
    updateSectionVisibility,
    
    // Filters
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    searchQuery,
    setSearchQuery,
    
    // Utils
    fetchData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;