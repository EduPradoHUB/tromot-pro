DROP POLICY IF EXISTS "Documentos do storage sao publicos" ON storage.objects;

CREATE POLICY "Equipes autorizadas podem ler documentos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM'::public.user_role, 'Técnico Tromot'::public.user_role, 'Vendedor'::public.user_role)
  )
);