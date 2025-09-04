import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

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
  distributors: Distributor[];
  
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
  
  // Installation leaderboard and gamification
  fetchInstallationLeaderboard: () => Promise<Array<{
    user_id: string;
    name: string;
    avatar_url: string | null;
    role: string;
    posts_count: number;
  }>>;
  
  // Editable content
  editableContent: any[];
  fetchEditableContent: () => Promise<void>;
  updateEditableContent: (section: string, content: { title?: string; subtitle?: string; description?: string }) => Promise<boolean>;
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  
  // Legacy state (mock data for backward compatibility)
  const [posts, setPosts] = useState<LegacyPost[]>([]);
  const [ratings, setRatings] = useState<LegacyRating[]>([]);
  const [questions, setQuestions] = useState<LegacyQuestion[]>([]);
  
  // Editable content state
  const [editableContent, setEditableContent] = useState<any[]>([]);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedBrand, setSelectedBrand] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Helper function to convert Json to array
  const parseCompatibility = (compatibility: any): LegacyVehicle[] => {
    if (!compatibility) return [];
    if (typeof compatibility === 'string') {
      try {
        return JSON.parse(compatibility) || [];
      } catch {
        return [];
      }
    }
    if (Array.isArray(compatibility)) return compatibility;
    return [];
  };
  
  // Convert Supabase products to legacy format
  const legacyProducts: LegacyProduct[] = products.map(product => ({
    id: product.id,
    name: product.name,
    code: product.code,
    category: product.category,
    compatibility: parseCompatibility(product.compatibility),
    manual_url: product.manual_url || undefined,
    manual_type: (product.manual_type as 'pdf' | 'image') || undefined,
    video_url: product.video_url || undefined,
    rating_average: product.rating_average || 0,
    rating_count: product.rating_count || 0,
    image_url: product.image_url || '',
    description: product.description || '',
    status: product.status === 'active' ? 'active' : 'inactive',
    out_of_production: product.out_of_production || false,
    no_manual_available: product.no_manual_available || false
  }));

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  };

  // Auth functions
  const login = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string, customerType?: 'lojista_instalador' | 'distribuidor_representante' | 'usuario_final', whatsapp?: string, city?: string, state?: string): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });

      // Create profile manually if user is created
      if (data.user && !error) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            name: name,
            email: email,
            role: 'Cliente',
            customer_type: customerType || 'usuario_final',
            whatsapp: whatsapp || null,
            city: city || null,
            state: state || null
          });
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // User management (admin only)
  const fetchAllProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  };

  const updateUserRole = async (userId: string, role: 'ADM' | 'Técnico Tromot' | 'Cliente'): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('user_id', userId);
    
    if (error) throw error;
  };

  // Profile management
  const updateProfile = async (data: Partial<Profile>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    // Refresh profile data
    fetchData();
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

  const updateVehicle = async (id: string, data: Partial<VehicleInsert>): Promise<Vehicle> => {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    setVehicles(prev => prev.map(v => v.id === id ? vehicle : v));
    return vehicle;
  };

  const deleteVehicle = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  // CRUD Functions for Categories
  const createCategory = async (data: CategoryInsert): Promise<Category> => {
    const { data: category, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    
    setCategories(prev => [...prev, category]);
    return category;
  };

  const updateCategory = async (id: string, data: Partial<CategoryInsert>): Promise<Category> => {
    const { data: category, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    setCategories(prev => prev.map(c => c.id === id ? category : c));
    return category;
  };

  const deleteCategory = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // CRUD Functions for Distributors
  const createDistributor = async (data: DistributorInsert): Promise<Distributor> => {
    const { data: distributor, error } = await supabase
      .from('distributors')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    
    setDistributors(prev => [...prev, distributor]);
    return distributor;
  };

  const updateDistributor = async (id: string, data: Partial<DistributorInsert>): Promise<Distributor> => {
    const { data: distributor, error } = await supabase
      .from('distributors')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    setDistributors(prev => prev.map(d => d.id === id ? distributor : d));
    return distributor;
  };

  const deleteDistributor = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('distributors')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setDistributors(prev => prev.filter(d => d.id !== id));
  };

  // Function to moderate posts
  const moderatePost = async (id: string, status: 'approved' | 'rejected'): Promise<void> => {
    const { error } = await supabase
      .from('posts')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
    
    // Update local state for legacy posts
    setPosts(prev => prev.map(post => 
      post.id === id ? { ...post, status } : post
    ));
  };

  // Function to find product by barcode
  const findProductByBarcode = async (barcode: string): Promise<LegacyProduct | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode_ean', barcode)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        category: data.category,
        compatibility: parseCompatibility(data.compatibility),
        manual_url: data.manual_url || undefined,
        manual_type: (data.manual_type as 'pdf' | 'image') || undefined,
        video_url: data.video_url || undefined,
        rating_average: data.rating_average || 0,
        rating_count: data.rating_count || 0,
        image_url: data.image_url || '',
        description: data.description || '',
        status: data.status === 'active' ? 'active' : 'inactive',
        out_of_production: data.out_of_production || false,
        no_manual_available: data.no_manual_available || false
      };
    } catch (error) {
      console.error('Error finding product by barcode:', error);
      return null;
    }
  };
  
  // Installation leaderboard for gamification
  const fetchInstallationLeaderboard = async () => {
    const { data, error } = await supabase
      .rpc('get_installation_leaderboard', { limit_rows: 100 });
    
    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
    
    return data || [];
  };

  // Editable content functions
  const fetchEditableContent = useCallback(async () => {
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

  const updateEditableContent = useCallback(async (
    section: string, 
    content: { title?: string; subtitle?: string; description?: string }
  ): Promise<boolean> => {
    if (!user || profile?.role !== 'ADM') return false;
    
    try {
      const { data, error } = await supabase
        .from('editable_content')
        .upsert({
          section,
          title: content.title,
          subtitle: content.subtitle,
          description: content.description
        }, {
          onConflict: 'section'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error updating editable content:', error);
        return false;
      }
      
      // Update local state
      setEditableContent(prev => {
        const index = prev.findIndex(item => item.section === section);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        } else {
          return [...prev, data];
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error updating editable content:', error);
      return false;
    }
  }, [user, profile]);

  const getEditableContent = useCallback((section: string) => {
    return editableContent.find(item => item.section === section);
  }, [editableContent]);

  // Fetch all data
  const fetchData = async () => {
    try {
      const [
        { data: productsData },
        { data: bannersData },
        { data: advertisementsData },
        { data: vehiclesData },
        { data: categoriesData },
        { data: distributorsData }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('banners').select('*'),
        supabase.from('advertisements').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('distributors').select('*')
      ]);

      if (productsData) setProducts(productsData);
      if (bannersData) setBanners(bannersData);
      if (advertisementsData) setAdvertisements(advertisementsData);
      if (vehiclesData) setVehicles(vehiclesData);
      if (categoriesData) setCategories(categoriesData);
      if (distributorsData) setDistributors(distributorsData);
      
      // Also fetch editable content
      await fetchEditableContent();
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

  const getActiveAd = (slot: 'home_hero' | 'product_banner' | 'feed_sponsored', productId?: string, productCategory?: string): Advertisement | null => {
    const now = new Date();
    const activeAds = advertisements.filter(ad => {
      const startDate = new Date(ad.start_date);
      const endDate = new Date(ad.end_date);
      const isTimeValid = ad.status === 'active' && 
                         ad.slot === slot &&
                         now >= startDate && 
                         now <= endDate;
      
      if (!isTimeValid) return false;
      
      // Filtrar por tipo de segmentação
      if (ad.target_type === 'all') {
        return true;
      } else if (ad.target_type === 'category' && productCategory && ad.target_category) {
        return productCategory === ad.target_category;
      } else if (ad.target_type === 'products' && productId && ad.target_products) {
        const targetProducts = Array.isArray(ad.target_products) ? ad.target_products : [];
        return targetProducts.includes(productId);
      }
      
      return false;
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

  const trackEvent = async (event: Omit<LegacyAnalyticsEvent, 'id' | 'timestamp'>) => {
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
    console.log('🚀 Inicializando AppContext...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email);
        
        // Only synchronous state updates here to avoid deadlock
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Usuário logado, buscando perfil...');
          // Defer Supabase calls with setTimeout to avoid deadlock
          setTimeout(async () => {
            try {
              // Fetch user profile
              let { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              // If profile doesn't exist, create one
              if (!profileData) {
                const { data: newProfile, error: createError } = await supabase
                  .from('profiles')
                  .insert({
                    user_id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
                    email: session.user.email || '',
                    role: session.user.email === 'eduardo@tromot.com.br' ? 'ADM' : 'Cliente'
                  })
                  .select()
                  .single();
                
                if (createError) {
                  console.error('Error creating profile:', createError);
                } else {
                  profileData = newProfile;
                }
              }
              
              setProfile(profileData);
              console.log('✅ Perfil carregado:', profileData?.name);
              
              // Fetch app data after profile is loaded
              console.log('📊 Buscando dados da aplicação...');
              await fetchData();
              console.log('✅ Dados carregados, app pronto!');
              setLoading(false);
            } catch (error) {
              console.error('❌ Erro ao carregar perfil/dados:', error);
              setLoading(false);
            }
          }, 0);
        } else {
          console.log('🚪 Usuário não logado');
          setProfile(null);
          setProducts([]);
          setBanners([]);
          setAdvertisements([]);
          setVehicles([]);
          setCategories([]);
          setDistributors([]);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AppContextType = {
    // New Supabase
    user,
    session,
    profile,
    loading,
    signUp,
    resetPassword,
    fetchAllProfiles,
    updateUserRole,
    login,
    logout,
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
    findProductByBarcode,
    fetchInstallationLeaderboard,
    
    // Editable content
    editableContent,
    fetchEditableContent,
    updateEditableContent,
    getEditableContent,
    
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