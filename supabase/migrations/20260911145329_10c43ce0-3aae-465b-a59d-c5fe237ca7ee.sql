CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  uploaded_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT documents_category_check CHECK (category IN (
    'tabela_precos',
    'politica_comercial',
    'politica_frete',
    'politica_trocas',
    'ficha_cadastral',
    'catalogo',
    'outro'
  ))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documentos visiveis para equipes autorizadas"
ON public.documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM'::public.user_role, 'Técnico Tromot'::public.user_role, 'Vendedor'::public.user_role)
  )
);

CREATE POLICY "ADM e Tecnico podem inserir documentos"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM'::public.user_role, 'Técnico Tromot'::public.user_role)
  )
);

CREATE POLICY "ADM e Tecnico podem atualizar documentos"
ON public.documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM'::public.user_role, 'Técnico Tromot'::public.user_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM'::public.user_role, 'Técnico Tromot'::public.user_role)
  )
);

CREATE POLICY "ADM e Tecnico podem excluir documentos"
ON public.documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM'::public.user_role, 'Técnico Tromot'::public.user_role)
  )
);

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX documents_category_created_at_idx
ON public.documents (category, created_at DESC);

CREATE POLICY "Documentos do storage sao publicos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documentos');

CREATE POLICY "ADM e Tecnico podem enviar documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM'::public.user_role, 'Técnico Tromot'::public.user_role)
  )
);

CREATE POLICY "ADM e Tecnico podem substituir documentos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM'::public.user_role, 'Técnico Tromot'::public.user_role)
  )
)
WITH CHECK (
  bucket_id = 'documentos'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM'::public.user_role, 'Técnico Tromot'::public.user_role)
  )
);

CREATE POLICY "ADM e Tecnico podem remover documentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADM'::public.user_role, 'Técnico Tromot'::public.user_role)
  )
);