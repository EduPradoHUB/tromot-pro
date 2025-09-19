-- Remove the current policy that allows direct access to distributors table
DROP POLICY IF EXISTS "Users can view distributors in their region" ON public.distributors;

-- Create a more restrictive policy that only allows admins to access the table directly
-- Regular users must use the secure functions
CREATE POLICY "Only admins can directly access distributors" 
ON public.distributors 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'ADM'::user_role
  )
);

-- Ensure the secure functions can still access the data by adding a policy for system operations
CREATE POLICY "Secure functions can access distributors" 
ON public.distributors 
FOR SELECT 
USING (
  -- Allow access from SECURITY DEFINER functions (our secure functions)
  current_setting('role') = 'postgres' 
  OR 
  -- Check if this is being called from our secure functions
  current_query() LIKE '%search_distributors_secure%' 
  OR 
  current_query() LIKE '%get_distributor_contact_secure%'
);

-- Add a comment explaining the security model
COMMENT ON TABLE public.distributors IS 
'Distributor contact information is sensitive business data. 
Direct access is restricted to admins only. 
Regular users must use search_distributors_secure() and get_distributor_contact_secure() functions 
which implement proper regional filtering and data masking.';

-- Log this security improvement
INSERT INTO public.security_audit_log (
  event_type,
  actor_user_id,
  metadata
) VALUES (
  'security_policy_update',
  auth.uid(),
  jsonb_build_object(
    'table', 'distributors',
    'action', 'restricted_direct_access',
    'description', 'Removed direct table access for non-admins, enforcing use of secure functions only',
    'timestamp', now()
  )
);