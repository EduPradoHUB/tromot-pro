-- Remove the security_audit_summary view that is causing the security definer warning
-- This view is not being used in the application code and was only present in type definitions
DROP VIEW IF EXISTS public.security_audit_summary;