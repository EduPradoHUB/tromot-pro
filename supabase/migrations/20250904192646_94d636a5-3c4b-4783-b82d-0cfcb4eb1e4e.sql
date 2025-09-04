-- CRITICAL SECURITY FIX: Prevent privilege escalation vulnerability
-- This migration fixes the ability for users to escalate their own privileges

-- Step 1: Drop the existing overly permissive profile update policies
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio profile" ON public.profiles;

-- Step 2: Create new secure policies that prevent role self-modification
CREATE POLICY "Users can update own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Prevent users from changing their own role
  (OLD.role IS NOT DISTINCT FROM NEW.role OR get_current_user_role() = 'ADM')
);

-- Step 3: Create admin-only role management policy
CREATE POLICY "Admins can update any profile including roles" 
ON public.profiles 
FOR UPDATE 
USING (get_current_user_role() = 'ADM');

-- Step 4: Fix analytics events security - restrict to authenticated users only
DROP POLICY IF EXISTS "Usuários podem criar eventos" ON public.analytics_events;

CREATE POLICY "Authenticated users can create analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Step 5: Create a secure admin function for role updates
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID,
  new_role user_role
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF get_current_user_role() != 'ADM' THEN
    RAISE EXCEPTION 'Access denied. Only administrators can update user roles.';
  END IF;
  
  -- Prevent admins from removing their own admin status (safety measure)
  IF target_user_id = auth.uid() AND new_role != 'ADM' THEN
    RAISE EXCEPTION 'Administrators cannot remove their own admin privileges.';
  END IF;
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or update failed.';
  END IF;
END;
$$;

-- Step 6: Create security audit log table for tracking privilege changes
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id),
  target_user_id UUID,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (get_current_user_role() = 'ADM');

-- System can insert audit logs
CREATE POLICY "System can create audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Step 7: Create trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log role changes for security audit
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.security_audit_log (
      event_type,
      actor_user_id,
      target_user_id,
      old_value,
      new_value,
      metadata
    ) VALUES (
      'role_change',
      auth.uid(),
      NEW.user_id,
      OLD.role::text,
      NEW.role::text,
      jsonb_build_object(
        'target_user_name', NEW.name,
        'target_user_email', NEW.email
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS audit_role_changes ON public.profiles;
CREATE TRIGGER audit_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();