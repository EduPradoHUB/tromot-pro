-- Criar enum para papéis de usuário
CREATE TYPE public.user_role AS ENUM ('ADM', 'Técnico Tromot', 'Cliente');

-- Criar enum para status
CREATE TYPE public.content_status AS ENUM ('active', 'inactive', 'pending', 'approved', 'rejected');

-- Tabela de profiles dos usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'Cliente',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de veículos
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  years TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  manual_url TEXT,
  manual_type TEXT CHECK (manual_type IN ('pdf', 'image')),
  video_url TEXT,
  rating_average DECIMAL(2,1) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  compatibility JSONB DEFAULT '[]'::jsonb,
  status content_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de banners da home
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de anúncios/propagandas
CREATE TABLE public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('home_hero', 'product_banner', 'feed_sponsored')),
  creative_url TEXT NOT NULL,
  creative_aspect_ratio TEXT NOT NULL CHECK (creative_aspect_ratio IN ('4:5', '16:9')),
  target_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_cap INTEGER DEFAULT 1000,
  status content_status DEFAULT 'active',
  impressions_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de posts de instalação
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  likes_count INTEGER DEFAULT 0,
  reports_count INTEGER DEFAULT 0,
  status content_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de avaliações
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(product_id, author_id)
);

-- Tabela de perguntas técnicas
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answer_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de likes em posts
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Tabela de analytics
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('view_product', 'view_manual', 'login', 'new_post', 'like', 'rating', 'question_reply', 'report_post', 'ad_impression', 'ad_click')),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ad_id UUID REFERENCES public.advertisements(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Buckets para storage
INSERT INTO storage.buckets (id, name, public) VALUES 
('product-images', 'product-images', true),
('manuals', 'manuals', true),
('banners', 'banners', true),
('advertisements', 'advertisements', true),
('posts', 'posts', true),
('avatars', 'avatars', true);

-- RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Usuários podem ver todos os profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem atualizar seu próprio profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seu próprio profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ADMs podem gerenciar profiles" ON public.profiles FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'ADM')
);

-- Policies para produtos
CREATE POLICY "Todos podem ver produtos ativos" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "ADMs e Técnicos podem gerenciar produtos" ON public.products FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('ADM', 'Técnico Tromot'))
);

-- Policies para banners
CREATE POLICY "Todos podem ver banners ativos" ON public.banners FOR SELECT USING (active = true);
CREATE POLICY "ADMs podem gerenciar banners" ON public.banners FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'ADM')
);

-- Policies para anúncios
CREATE POLICY "Todos podem ver anúncios ativos" ON public.advertisements FOR SELECT USING (status = 'active');
CREATE POLICY "ADMs podem gerenciar anúncios" ON public.advertisements FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'ADM')
);

-- Policies para posts
CREATE POLICY "Todos podem ver posts aprovados" ON public.posts FOR SELECT USING (status = 'approved');
CREATE POLICY "Usuários podem criar posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Usuários podem atualizar seus posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "ADMs podem gerenciar todos os posts" ON public.posts FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'ADM')
);

-- Policies para avaliações
CREATE POLICY "Todos podem ver avaliações" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar avaliações" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Usuários podem atualizar suas avaliações" ON public.ratings FOR UPDATE USING (auth.uid() = author_id);

-- Policies para perguntas
CREATE POLICY "Todos podem ver perguntas" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar perguntas" ON public.questions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Técnicos e ADMs podem responder" ON public.questions FOR UPDATE USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('ADM', 'Técnico Tromot'))
);

-- Policies para likes
CREATE POLICY "Usuários podem ver likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Usuários podem gerenciar seus likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

-- Policies para analytics
CREATE POLICY "ADMs podem ver analytics" ON public.analytics_events FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'ADM')
);
CREATE POLICY "Usuários podem criar eventos" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- Storage policies
CREATE POLICY "Todos podem ver imagens públicas" ON storage.objects FOR SELECT USING (bucket_id IN ('product-images', 'banners', 'advertisements', 'posts', 'avatars', 'manuals'));
CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ADMs podem gerenciar storage" ON storage.objects FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'ADM')
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON public.advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    'Cliente'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();