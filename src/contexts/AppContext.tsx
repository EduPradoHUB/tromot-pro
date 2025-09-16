import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Context type definitions
interface AppContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  profile: any;
  loading: boolean;

  // Data
  products: any[];
  banners: any[];
  advertisements: any[];
  vehicles: any[];
  categories: any[];
  distributors: any[];
  editableContent: any;
  legacyProducts: any[];

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
  findProductByBarcode: (barcode: string) => any;

  // Banner methods
  createBanner: (data: any) => Promise<boolean>;
  updateBanner: (id: string, updates: any) => Promise<boolean>;
  deleteBanner: (id: string) => Promise<boolean>;

  // Advertisement methods
  createAdvertisement: (data: any) => Promise<boolean>;
  updateAdvertisement: (id: string, updates: any) => Promise<boolean>;
  deleteAdvertisement: (id: string) => Promise<boolean>;
  getActiveAd: (slot: string) => any;
  trackAdImpression: (adId: string, slot?: string, adData?: any) => void;
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
  reportPost: (postId: string) => Promise<boolean>;

  // Legacy compatibility
  currentUser: any;
  posts: any[];
  ratings: any[];
  questions: any[];
  dashboardStats: any;
  getDashboardStats: (period?: string) => Promise<any>;
  getDashboardStatsReal: () => Promise<any>;
  getAnalyticsChartData: () => Promise<any>;
  getCategoryDistribution: () => Promise<any>;

  // Legacy methods
  likePost: (postId: string) => void;
  submitQuestion: (productId: string, question: string) => Promise<boolean>;
  submitRating: (productId: string, rating: number, comment: string) => Promise<boolean>;
  answerQuestion: (questionId: string, answer: string) => Promise<boolean>;
  trackEvent: (eventData: any) => void;
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
const fetchDistributorsPublic = async () => {
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
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [advertisements, setAdvertisements] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [editableContent, setEditableContent] = useState<any>({});

  // Legacy state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts] = useState<any[]>([]);
  const [ratings] = useState<any[]>([]);
  const [questions] = useState<any[]>([]);
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
      const bannersResult = await supabase.from('banners').select('*').eq('active', true);
      const advertisementsResult = await supabase.from('advertisements').select('*');
      const vehiclesResult = await supabase.from('vehicles').select('*');
      const categoriesResult = await supabase.from('categories').select('*');
      const distributorsResult = await fetchDistributorsPublic();

      setProducts(productsResult.data || []);
      setBanners(bannersResult.data || []);
      setAdvertisements((advertisementsResult.data || []).map((ad: any) => ({
        ...ad,
        active: ad.status === 'active'
      })));
      setVehicles(vehiclesResult.data || []);
      setCategories(categoriesResult.data || []);
      setDistributors(distributorsResult || []);

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

  const trackAdImpression = React.useCallback((adId: string, slot?: string, adData?: any) => {
    console.log('Track ad impression:', { adId, slot, adData });
  }, []);

  const trackAdClick = React.useCallback((adId: string) => {
    console.log('Track ad click:', adId);
  }, []);

  const reportPost = React.useCallback(async (postId: string) => {
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

  const trackEvent = React.useCallback((eventData: any) => {
    console.log('Track event:', eventData);
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

  const getDashboardStats = React.useCallback(async (period?: string) => {
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
              name: profile.name || session.user.email || '',
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
              name: profile.name || session.user.email || '',
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