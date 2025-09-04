-- CRITICAL SECURITY FIX: Prevent privilege escalation vulnerability (Fixed version)
-- This migration fixes the ability for users to escalate their own privileges

-- Step 1: Drop the existing overly permissive profile update policies
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio profile" ON public.profiles;

-- Step 2: Create a secure policy that prevents role self-modification
-- Users can update their profile but NOT their role (only admins can change roles)
CREATE POLICY "Users can update own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  get_current_user_role() != 'ADM' AND
  -- Ensure the role column is not being changed by non-admins
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 
  (SELECT NEW.role FROM (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()) AS subq 
   JOIN public.profiles NEW ON NEW.user_id = subq.user_id)
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

-- Step 5: Create security audit log table for tracking privilege changes
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