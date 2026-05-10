
-- 1. Prevent self role escalation on profiles via trigger
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o papel de um perfil';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- 2. Posts: prevent self-approval
DROP POLICY IF EXISTS "Usuários podem atualizar seus posts" ON public.posts;
CREATE POLICY "Usuários podem editar seus posts pendentes"
ON public.posts FOR UPDATE
USING (auth.uid() = author_id AND status = 'pending'::content_status)
WITH CHECK (auth.uid() = author_id AND status = 'pending'::content_status);

-- 3. Analytics events: ensure user_id matches caller
DROP POLICY IF EXISTS "Authenticated users can create analytics events" ON public.analytics_events;
CREATE POLICY "Authenticated users can create analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- 4. Storage banners: drop overly permissive policies
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de banners" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar banners" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar banners" ON storage.objects;

-- 5. Distributors: drop misleading current_setting policy
DROP POLICY IF EXISTS "System functions only access to distributors" ON public.distributors;

-- 6. Harden is_verified_admin to require confirmed email
CREATE OR REPLACE FUNCTION public.is_verified_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.user_id = auth.uid()
      AND p.role = 'ADM'::user_role
      AND p.email IS NOT NULL
      AND p.name IS NOT NULL
      AND u.email_confirmed_at IS NOT NULL
  );
$$;
