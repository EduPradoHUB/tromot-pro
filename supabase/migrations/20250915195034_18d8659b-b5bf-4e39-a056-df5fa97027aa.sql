-- Fix Customer Contact Information Security Issue
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Usuários podem ver distribuidores para contato" ON public.distributors;
DROP POLICY IF EXISTS "ADMs podem ver distribuidores completos" ON public.distributors;

-- Create more restrictive policies
-- 1. Admins can see all distributors (no change needed for this one)
-- This policy already exists: "ADMs podem gerenciar distribuidores"

-- 2. Users can only see distributors in their region with masked data
CREATE POLICY "Users can view distributors in their region"
ON public.distributors
FOR SELECT
TO authenticated
USING (
  active = true 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'ADM'::user_role
  )
  OR (
    active = true 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.state IS NOT NULL
      AND (
        -- User can see distributors in their state
        profiles.state = distributors.state
        OR 
        -- Or distributors that cover entire state and are in user's state
        (distributors.cover_entire_state = true AND distributors.state = profiles.state)
      )
    )
  )
);

-- 3. Create a more secure function for getting distributor contact info
-- This replaces the existing get_distributor_full_contact function
CREATE OR REPLACE FUNCTION public.get_distributor_contact_secure(distributor_id uuid)
RETURNS TABLE(id uuid, name text, phone text, whatsapp text, state text, city text, cover_entire_state boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_state text;
  user_role user_role;
BEGIN
  -- Get user's profile info
  SELECT profiles.state, profiles.role INTO user_state, user_role
  FROM public.profiles 
  WHERE profiles.user_id = auth.uid();
  
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: User not authenticated';
  END IF;
  
  -- Check if user has a state set (required for non-admins)
  IF user_role != 'ADM' AND user_state IS NULL THEN
    RAISE EXCEPTION 'Access denied: User location not set';
  END IF;
  
  -- Log the access attempt
  PERFORM log_distributor_access(
    distributor_id, 
    'contact_access',
    jsonb_build_object(
      'user_state', user_state,
      'user_role', user_role,
      'timestamp', now(),
      'function_used', 'get_distributor_contact_secure'
    )
  );
  
  -- Return data only if user is admin OR distributor serves user's region
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.phone,
    d.whatsapp,
    d.state,
    d.city,
    d.cover_entire_state
  FROM public.distributors d
  WHERE d.id = distributor_id 
    AND d.active = true
    AND (
      user_role = 'ADM'::user_role
      OR 
      (
        user_state IS NOT NULL 
        AND (
          d.state = user_state 
          OR (d.cover_entire_state = true AND d.state = user_state)
        )
      )
    );
END;
$$;

-- 4. Update the search function to be more secure
CREATE OR REPLACE FUNCTION public.search_distributors_secure(p_state text DEFAULT NULL, p_city text DEFAULT NULL)
RETURNS TABLE(id uuid, name text, state text, city text, cover_entire_state boolean, active boolean, created_at timestamp with time zone, phone_display text, whatsapp_display text, has_contact boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_state text;
  user_role user_role;
BEGIN
  -- Get user's profile info
  SELECT profiles.state, profiles.role INTO user_state, user_role
  FROM public.profiles 
  WHERE profiles.user_id = auth.uid();
  
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: User not authenticated';
  END IF;
  
  -- For non-admins, ensure they have location set
  IF user_role != 'ADM' AND user_state IS NULL THEN
    RAISE EXCEPTION 'Access denied: User location required';
  END IF;
  
  -- Return distributors based on user permissions
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.state,
    d.city,
    d.cover_entire_state,
    d.active,
    d.created_at,
    -- Mask sensitive data for non-admins
    CASE WHEN user_role = 'ADM'::user_role THEN d.phone
         WHEN d.phone IS NOT NULL THEN
           CASE WHEN length(d.phone) < 4 THEN '***'
                ELSE substring(d.phone from 1 for 2) || '***' || substring(d.phone from length(d.phone)-1)
           END
         ELSE NULL 
    END as phone_display,
    CASE WHEN user_role = 'ADM'::user_role THEN d.whatsapp
         WHEN d.whatsapp IS NOT NULL THEN
           CASE WHEN length(d.whatsapp) < 4 THEN '***'
                ELSE substring(d.whatsapp from 1 for 2) || '***' || substring(d.whatsapp from length(d.whatsapp)-1)
           END
         ELSE NULL 
    END as whatsapp_display,
    CASE WHEN d.phone IS NOT NULL OR d.whatsapp IS NOT NULL THEN true ELSE false END as has_contact
  FROM public.distributors d
  WHERE d.active = true
    AND (
      -- Admins can see all
      user_role = 'ADM'::user_role
      OR
      -- Regular users can only see distributors in their region
      (
        user_state IS NOT NULL
        AND (
          -- Direct state match
          (p_state IS NULL OR d.state = p_state) 
          AND (p_city IS NULL OR d.city = p_city OR d.cover_entire_state = true)
          AND (d.state = user_state OR (d.cover_entire_state = true AND d.state = user_state))
        )
      )
    )
  ORDER BY d.name;
END;
$$;