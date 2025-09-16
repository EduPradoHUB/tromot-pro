import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Simple types to avoid deep type issues
interface SimpleProduct {
  id: string;
  name: string;
  code: string;
  barcode_ean?: string;
  category: string;
  description: string;
  image_url?: string;
  manual_url?: string;
  manual_type: string;
  video_url?: string;
  compatibility: any;
  out_of_production: boolean;
  no_manual_available?: boolean;
  rating?: number;
  rating_count?: number;
  rating_average?: number;
  created_at: string;
  updated_at: string;
}

interface SimpleBanner {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  active: boolean;
  created_at: string;
}

interface SimpleAdvertisement {
  id: string;
  advertiser: string;
  slot: string;
  creative_url: string;
  creative_aspect_ratio: string;
  target_url: string;
  start_date: string;
  end_date: string;
  daily_cap: number;
  active: boolean;
  status?: string;
  impressions_count?: number;
  clicks_count?: number;
  created_at: string;
}

interface SimpleVehicle {
  id: string;
  brand: string;
  model: string;
  years: string[];
  created_at: string;
}

interface SimpleCategory {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created_at: string;
}

interface SimpleDistributor {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  state: string;
  city: string;
  cover_entire_state: boolean;
  active: boolean;
  created_at: string;
}

interface SimpleProfile {
  id: string;
  user_id: string;
  display_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  state?: string;
  avatar_url?: string;
  role: string;
  customer_type?: string;
  created_at: string;
  updated_at: string;
}

interface LegacyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface LegacyPost {
  id: string;
  product_id: string;
  author_id: string;
  author_name?: string;
  author_role?: string;
  photo_url: string;
  caption: string;
  likes_count: number;
  status: string;
  created_at: string;
}

interface LegacyRating {
  id: string;
  product_id: string;
  user_id: string;
  author_id?: string;
  author_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface LegacyQuestion {
  id: string;
  product_id: string;
  user_id: string;
  author_id?: string;
  author_name?: string;
  question: string;
  answer?: string;
  created_at: string;
}

interface AppContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  profile: SimpleProfile | null;
  loading: boolean;

  // Data
  products: SimpleProduct[];
  banners: SimpleBanner[];
  advertisements: SimpleAdvertisement[];
  vehicles: SimpleVehicle[];
  categories: SimpleCategory[];
  distributors: SimpleDistributor[];
  editableContent: any;
  legacyProducts: SimpleProduct[];

  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: any }>;
  login: (email: string, password: string) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;

  // Data methods
  fetchData: () => Promise<void>;
  updateSectionVisibility: (section: string, visible: boolean) => Promise<boolean>;
  getEditableContent: (section: string) => any;
  updateEditableContent: (section: string, content: any) => Promise<boolean>;

  // Product methods
  createProduct: (data: any) => Promise<boolean>;
  updateProduct: (id: string, updates: any) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  findProductByBarcode: (barcode: string) => SimpleProduct | null;

  // Banner methods
  createBanner: (data: any) => Promise<boolean>;
  updateBanner: (id: string, updates: any) => Promise<boolean>;
  deleteBanner: (id: string) => Promise<boolean>;

  // Advertisement methods
  createAdvertisement: (data: any) => Promise<boolean>;
  updateAdvertisement: (id: string, updates: any) => Promise<boolean>;
  deleteAdvertisement: (id: string) => Promise<boolean>;
  getActiveAd: (slot: string) => SimpleAdvertisement | null;
  trackAdImpression: (adId: string) => void;
  trackAdClick: (adId: string) => void;

  // Vehicle methods
  createVehicle: (data: any) => Promise<boolean>;
  updateVehicle: (id: string, updates: any) => Promise<boolean>;
  deleteVehicle: (id: string) => Promise<boolean>;

  // Category methods
  createCategory: (data: any) => Promise<boolean>;
  updateCategory: (id: string, updates: any) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;

  // User management
  fetchAllProfiles: () => Promise<any[]>;
  updateUserRole: (userId: string, role: string) => Promise<boolean>;
  updateProfile: (updates: any) => Promise<boolean>;

  // File upload
  uploadFile: (file: File, bucket: string, path?: string) => Promise<string | null>;

  // Post moderation
  moderatePost: (postId: string, action: string) => Promise<boolean>;
  reportPost: (postId: string, reason: string) => Promise<boolean>;

  // Legacy compatibility
  currentUser: LegacyUser | null;
  posts: LegacyPost[];
  ratings: LegacyRating[];
  questions: LegacyQuestion[];
  dashboardStats: any;
  getDashboardStats: () => Promise<any>;
  getDashboardStatsReal: () => Promise<any>;
  getAnalyticsChartData: () => Promise<any>;
  getCategoryDistribution: () => Promise<any>;

  // Legacy methods
  likePost: (postId: string) => void;
  submitQuestion: (productId: string, question: string) => Promise<boolean>;
  submitRating: (productId: string, rating: number, comment: string) => Promise<boolean>;
  answerQuestion: (questionId: string, answer: string) => Promise<boolean>;
  trackEvent: (event: string, data?: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Fetch distributors function
const fetchDistributorsPublic = async (): Promise<SimpleDistributor[]> => {
  try {
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .eq('active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching distributors:', error);
    return [];
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<SimpleProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [banners, setBanners] = useState<SimpleBanner[]>([]);
  const [advertisements, setAdvertisements] = useState<SimpleAdvertisement[]>([]);
  const [vehicles, setVehicles] = useState<SimpleVehicle[]>([]);
  const [categories, setCategories] = useState<SimpleCategory[]>([]);
  const [distributors, setDistributors] = useState<SimpleDistributor[]>([]);
  const [editableContent, setEditableContent] = useState<any>({});

  // Legacy state
  const [currentUser, setCurrentUser] = useState<LegacyUser | null>(null);
  const [posts] = useState<LegacyPost[]>([]);
  const [ratings] = useState<LegacyRating[]>([]);
  const [questions] = useState<LegacyQuestion[]>([]);
  const [dashboardStats] = useState<any>({});

  // Auth methods
  const signIn = React.useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUp = React.useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
        },
      },
    });
    return { error };
  }, []);

  const logout = React.useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Data methods
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const productsResult = await supabase.from('products').select('*');
      const bannersResult = await supabase.from('banners').select('*').eq('status', 'active');
      const advertisementsResult = await supabase.from('advertisements').select('*');
      const vehiclesResult = await supabase.from('vehicles').select('*');
      const categoriesResult = await supabase.from('categories').select('*');
      const distributorsResult = await fetchDistributorsPublic();

      if (productsResult.data) {
        setProducts(productsResult.data);
      }

      if (bannersResult.data) {
        setBanners(bannersResult.data);
      }

      if (advertisementsResult.data) {
        setAdvertisements(advertisementsResult.data.map((ad: any) => ({
          ...ad,
          active: ad.active !== false
        })));
      }

      if (vehiclesResult.data) {
        setVehicles(vehiclesResult.data);
      }

      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (distributorsResult) {
        setDistributors(distributorsResult);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Stub implementations for all required methods
  const updateSectionVisibility = React.useCallback(async (section: string, visible: boolean) => {
    return true;
  }, []);

  const getEditableContent = React.useCallback((section: string) => {
    return editableContent[section] || {};
  }, [editableContent]);

  const updateEditableContent = React.useCallback(async (section: string, content: any) => {
    return true;
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    return await signIn(email, password);
  }, [signIn]);

  const resetPassword = React.useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }, []);

  const findProductByBarcode = React.useCallback((barcode: string) => {
    return products.find(p => p.barcode_ean === barcode) || null;
  }, [products]);

  const getActiveAd = React.useCallback((slot: string) => {
    return advertisements.find(ad => ad.slot === slot && ad.active) || null;
  }, [advertisements]);

  const trackAdImpression = React.useCallback((adId: string) => {
    console.log('Track ad impression:', adId);
  }, []);

  const trackAdClick = React.useCallback((adId: string) => {
    console.log('Track ad click:', adId);
  }, []);

  const reportPost = React.useCallback(async (postId: string, reason: string) => {
    return true;
  }, []);

  const updateProfile = React.useCallback(async (updates: any) => {
    return true;
  }, []);

  const submitQuestion = React.useCallback(async (productId: string, question: string) => {
    return true;
  }, []);

  const submitRating = React.useCallback(async (productId: string, rating: number, comment: string) => {
    return true;
  }, []);

  const answerQuestion = React.useCallback(async (questionId: string, answer: string) => {
    return true;
  }, []);

  const trackEvent = React.useCallback((event: string, data?: any) => {
    console.log('Track event:', event, data);
  }, []);

  const getAnalyticsChartData = React.useCallback(async () => {
    return {};
  }, []);

  const getCategoryDistribution = React.useCallback(async () => {
    return {};
  }, []);

  const createProduct = React.useCallback(async (data: any) => {
    return true;
  }, []);

  const updateProduct = React.useCallback(async (id: string, updates: any) => {
    return true;
  }, []);

  const deleteProduct = React.useCallback(async (id: string) => {
    return true;
  }, []);

  const createBanner = React.useCallback(async (data: any) => {
    return true;
  }, []);

  const updateBanner = React.useCallback(async (id: string, updates: any) => {
    return true;
  }, []);

  const deleteBanner = React.useCallback(async (id: string) => {
    return true;
  }, []);

  const createAdvertisement = React.useCallback(async (data: any) => {
    return true;
  }, []);

  const updateAdvertisement = React.useCallback(async (id: string, updates: any) => {
    return true;
  }, []);

  const deleteAdvertisement = React.useCallback(async (id: string) => {
    return true;
  }, []);

  const createVehicle = React.useCallback(async (data: any) => {
    return true;
  }, []);

  const updateVehicle = React.useCallback(async (id: string, updates: any) => {
    return true;
  }, []);

  const deleteVehicle = React.useCallback(async (id: string) => {
    return true;
  }, []);

  const createCategory = React.useCallback(async (data: any) => {
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

  const moderatePost = React.useCallback(async (postId: string, action: string) => {
    return true;
  }, []);

  const getDashboardStats = React.useCallback(async () => {
    return {};
  }, []);

  const getDashboardStatsReal = React.useCallback(async () => {
    return {};
  }, []);

  const likePost = React.useCallback((postId: string) => {
    console.log('Like post:', postId);
  }, []);

  // Initialize auth state
  useEffect(() => {
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
            .eq('user_id', session.user.id)
            .single();
          
          if (profile) {
            setProfile(profile);
            setCurrentUser({
              id: profile.user_id,
              name: profile.display_name || session.user.email || '',
              email: session.user.email || '',
              role: profile.role || 'Cliente',
              avatar: profile.avatar_url
            });
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch updated profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (profile) {
            setProfile(profile);
            setCurrentUser({
              id: profile.user_id,
              name: profile.display_name || session.user.email || '',
              email: session.user.email || '',
              role: profile.role || 'Cliente',
              avatar: profile.avatar_url
            });
          }
        } else {
          setProfile(null);
          setCurrentUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value: AppContextType = {
    // Auth state
    user,
    session,
    profile,
    loading,

    // Data
    products,
    banners,
    advertisements,
    vehicles,
    categories,
    distributors,
    editableContent,
    legacyProducts: products,

    // Auth methods
    signIn,
    signUp,
    login,
    logout,
    resetPassword,

    // Data methods
    fetchData,
    updateSectionVisibility,
    getEditableContent,
    updateEditableContent,

    // Product methods
    createProduct,
    updateProduct,
    deleteProduct,
    findProductByBarcode,

    // Banner methods
    createBanner,
    updateBanner,
    deleteBanner,

    // Advertisement methods
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    getActiveAd,
    trackAdImpression,
    trackAdClick,

    // Vehicle methods
    createVehicle,
    updateVehicle,
    deleteVehicle,

    // Category methods
    createCategory,
    updateCategory,
    deleteCategory,

    // User management
    fetchAllProfiles,
    updateUserRole,
    updateProfile,

    // File upload
    uploadFile,

    // Post moderation
    moderatePost,
    reportPost,

    // Legacy compatibility
    currentUser,
    posts,
    ratings,
    questions,
    dashboardStats,
    getDashboardStats,
    getDashboardStatsReal,
    getAnalyticsChartData,
    getCategoryDistribution,

    // Legacy methods
    likePost,
    submitQuestion,
    submitRating,
    answerQuestion,
    trackEvent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}