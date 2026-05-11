
-- Tighten is_system_operation: remove admin branch so admins cannot directly insert audit logs.
CREATE OR REPLACE FUNCTION public.is_system_operation()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT current_setting('role', true) IN ('postgres', 'service_role');
$function$;

-- Defensive: drop legacy policies if they still exist
DROP POLICY IF EXISTS "system_can_create_audit_logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Restrict analytics_events INSERT policy to authenticated role only (was public)
DROP POLICY IF EXISTS "Authenticated users can create analytics events" ON public.analytics_events;
CREATE POLICY "Authenticated users can create analytics events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND event_type IN (
    'view_manual','view_produto','new_post','like','rating',
    'ad_impression','ad_click','login','search','share'
  )
);
