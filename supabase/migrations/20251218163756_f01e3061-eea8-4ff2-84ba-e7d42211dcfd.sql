-- Remove políticas permissivas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;

-- ========================================
-- BUCKET: avatars - apenas o dono pode fazer upload
-- ========================================
CREATE POLICY "Avatar upload: only owner"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatar update: only owner"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatar delete: only owner"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================
-- BUCKET: posts - apenas o dono pode fazer upload
-- ========================================
CREATE POLICY "Post upload: only owner"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Post update: only owner"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Post delete: only owner or admin"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts' 
  AND (
    (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1])
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'ADM'::user_role
    )
  )
);

-- ========================================
-- BUCKET: product-images - apenas ADM e Técnicos
-- ========================================
CREATE POLICY "Product images: ADM and Tecnico can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('ADM'::user_role, 'Técnico Tromot'::user_role, 'Suporte Tromot'::user_role)
  )
);

CREATE POLICY "Product images: ADM and Tecnico can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('ADM'::user_role, 'Técnico Tromot'::user_role, 'Suporte Tromot'::user_role)
  )
);

CREATE POLICY "Product images: ADM and Tecnico can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('ADM'::user_role, 'Técnico Tromot'::user_role, 'Suporte Tromot'::user_role)
  )
);

-- ========================================
-- BUCKET: manuals - apenas ADM e Técnicos
-- ========================================
CREATE POLICY "Manuals: ADM and Tecnico can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'manuals'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('ADM'::user_role, 'Técnico Tromot'::user_role, 'Suporte Tromot'::user_role)
  )
);

CREATE POLICY "Manuals: ADM and Tecnico can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'manuals'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('ADM'::user_role, 'Técnico Tromot'::user_role, 'Suporte Tromot'::user_role)
  )
);

CREATE POLICY "Manuals: ADM and Tecnico can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'manuals'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('ADM'::user_role, 'Técnico Tromot'::user_role, 'Suporte Tromot'::user_role)
  )
);

-- ========================================
-- BUCKET: banners - apenas ADM
-- ========================================
CREATE POLICY "Banners: only ADM can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  )
);

CREATE POLICY "Banners: only ADM can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  )
);

CREATE POLICY "Banners: only ADM can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  )
);

-- ========================================
-- BUCKET: advertisements - apenas ADM
-- ========================================
CREATE POLICY "Advertisements: only ADM can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'advertisements'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  )
);

CREATE POLICY "Advertisements: only ADM can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'advertisements'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  )
);

CREATE POLICY "Advertisements: only ADM can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'advertisements'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  )
);

-- ========================================
-- Política pública de leitura para todos os buckets públicos
-- ========================================
CREATE POLICY "Public read for all public buckets"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('product-images', 'manuals', 'banners', 'advertisements', 'posts', 'avatars')
);