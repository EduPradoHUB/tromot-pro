-- Fix RLS policy for editable_content table
-- The issue is that the policy is checking profiles.id = auth.uid() 
-- but it should be profiles.user_id = auth.uid()

DROP POLICY IF EXISTS "Admins can manage editable content" ON public.editable_content;

CREATE POLICY "Admins can manage editable content" 
ON public.editable_content 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'ADM'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'ADM'::user_role
  )
);