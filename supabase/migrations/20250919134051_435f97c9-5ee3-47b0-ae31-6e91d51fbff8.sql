-- Remove the vulnerable pattern-based policy
DROP POLICY IF EXISTS "Secure functions can access distributors" ON public.distributors;

-- Create a more secure policy that only allows system-level access
-- This prevents any pattern-based bypass attacks
CREATE POLICY "System functions only access to distributors" 
ON public.distributors 
FOR ALL
USING (
  -- Only allow access from SECURITY DEFINER functions running as service_role
  current_setting('role') IN ('postgres', 'service_role')
);

-- Update the existing admin policy to be more explicit
DROP POLICY IF EXISTS "Only admins can directly access distributors" ON public.distributors;

CREATE POLICY "Verified admins can manage distributors" 
ON public.distributors 
FOR ALL
USING (is_verified_admin());

-- Add security audit log entry
INSERT INTO public.security_audit_log (
  event_type,
  actor_user_id,
  metadata
) VALUES (
  'security_vulnerability_fix',
  auth.uid(),
  jsonb_build_object(
    'table', 'distributors',
    'vulnerability', 'pattern_based_access_control',
    'action', 'removed_pattern_matching_policy',
    'description', 'Removed vulnerable query pattern matching, enforcing system-only access to prevent bypass attacks',
    'timestamp', now(),
    'security_level', 'critical'
  )
);