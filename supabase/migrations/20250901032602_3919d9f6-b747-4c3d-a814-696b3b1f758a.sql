-- Verificar e criar políticas para bucket de banners
-- Criar as políticas com sintaxe correta

-- Política para visualizar banners (público)
DROP POLICY IF EXISTS "Banners são publicamente visíveis" ON storage.objects;
CREATE POLICY "Banners são publicamente visíveis" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'banners');

-- Política para upload de banners (apenas usuários autenticados)
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de banners" ON storage.objects;
CREATE POLICY "Usuários autenticados podem fazer upload de banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

-- Política para atualizar banners (apenas usuários autenticados)
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar banners" ON storage.objects;
CREATE POLICY "Usuários autenticados podem atualizar banners" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

-- Política para deletar banners (apenas usuários autenticados)
DROP POLICY IF EXISTS "Usuários autenticados podem deletar banners" ON storage.objects;
CREATE POLICY "Usuários autenticados podem deletar banners" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'banners' AND auth.role() = 'authenticated');