-- Atualiza policy de SELECT na tabela documents para ADM e Vendedor apenas
DROP POLICY IF EXISTS "Documentos visiveis para equipes autorizadas" ON public.documents;
CREATE POLICY "Documentos visiveis para ADM e Vendedor"
ON public.documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM', 'Vendedor')
  )
);

-- Atualiza policy de SELECT no storage bucket documentos para ADM e Vendedor apenas
DROP POLICY IF EXISTS "Equipes autorizadas podem ler documentos" ON storage.objects;
CREATE POLICY "ADM e Vendedor podem ler documentos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM', 'Vendedor')
  )
);