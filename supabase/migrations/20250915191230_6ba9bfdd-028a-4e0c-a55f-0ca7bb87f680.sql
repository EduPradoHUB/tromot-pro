-- Drop existing policies that may be too permissive or redundant
DROP POLICY IF EXISTS "ADMs podem gerenciar profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile including roles" ON public.profiles;
DROP POLICY IF EXISTS "Sistema pode criar perfis via trigger" ON public.profiles;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários autenticados podem criar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários autenticados podem ver seu próprio perfil" ON public.profiles;

-- Create new, more secure and clear policies

-- Policy 1: Users can only view their own profile
CREATE POLICY "users_can_view_own_profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can only update their own profile (except role field)
CREATE POLICY "users_can_update_own_profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (
    -- User cannot change their own role unless they are admin
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'ADM'::user_role
    OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = role
  )
);

-- Policy 3: Users can create their own profile (system/trigger use)
CREATE POLICY "users_can_create_own_profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can view all profiles (for management purposes)
CREATE POLICY "admins_can_view_all_profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  )
);

-- Policy 5: Admins can update any profile including roles
CREATE POLICY "admins_can_update_all_profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  )
);

-- Policy 6: Admins can delete profiles (ban users)
CREATE POLICY "admins_can_delete_profiles" 
ON public.profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  )
);

-- Update the security function to be more robust
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role::text FROM public.profiles WHERE user_id = auth.uid()), 
    'Cliente'
  );
$function$;

-- Create a function to check if user is admin (more secure than inline queries)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
  );
$function$;

-- Add audit logging trigger for profile access (security monitoring)
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log sensitive data access for security monitoring
  IF TG_OP = 'SELECT' AND OLD.user_id != auth.uid() THEN
    INSERT INTO public.security_audit_log (
      event_type,
      actor_user_id,
      target_user_id,
      metadata
    ) VALUES (
      'profile_access',
      auth.uid(),
      OLD.user_id,
      jsonb_build_object(
        'accessed_at', now(),
        'ip_address', inet_client_addr()::text,
        'access_type', 'profile_view'
      )
    );
  END IF;
  
  RETURN CASE TG_OP
    WHEN 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$function$;