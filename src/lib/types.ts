export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADM' | 'Técnico Tromot' | 'Cliente';
  avatar?: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  years: string[];
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  compatibility: Vehicle[];
  manual_url?: string;
  manual_type?: 'pdf' | 'image';
  video_url?: string;
  rating_average: number;
  rating_count: number;
  image_url: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface Post {
  id: string;
  product_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  photo_url: string; // Manter para compatibilidade
  photos_urls?: string[]; // Novo campo para múltiplas fotos
  caption: string;
  likes_count: number;
  created_at: string;
  status: 'approved' | 'pending' | 'rejected';
  liked_by_user?: boolean;
  reports_count?: number;
}

export interface Question {
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

export interface Rating {
  id: string;
  product_id: string;
  author_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  type: 'view_product' | 'view_manual' | 'login' | 'new_post' | 'like' | 'rating' | 'question_reply' | 'report_post' | 'ad_impression' | 'ad_click';
  product_id?: string;
  user_id?: string;
  ad_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DashboardStats {
  dau: number;
  mau: number;
  manual_views_today: number;
  posts_today: number;
  likes_today: number;
  avg_rating: number;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link?: string;
  active: boolean;
  created_at: string;
}

export interface Advertisement {
  id: string;
  advertiser: string;
  slot: 'home_hero' | 'product_banner' | 'feed_sponsored';
  creative_url: string;
  creative_aspect_ratio: '4:5' | '16:9';
  target_url?: string;
  start_date: string;
  end_date: string;
  daily_cap: number;
  status: 'active' | 'paused' | 'completed';
  impressions_count: number;
  clicks_count: number;
  created_at: string;
}

export interface AdStats {
  ad_id: string;
  impressions: number;
  clicks: number;
  ctr: number;
  date: string;
}