-- Test the products RLS policy by checking what products are visible to different users
-- First, let's see what the current policies look like
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'products' AND schemaname = 'public';