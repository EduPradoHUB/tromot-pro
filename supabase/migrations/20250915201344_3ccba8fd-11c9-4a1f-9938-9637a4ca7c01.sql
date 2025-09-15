-- Fix infinite recursion in profiles policies by removing duplicates and fixing the ones that exist

-- Drop only the duplicate policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Keep the existing working policies (they don't have recursion issues)
-- The existing policies that are working:
-- "Enable read access for own profile", "Enable insert for own profile", 
-- "Enable update for own profile", "Enable delete for own profile"
-- plus the admin policies that are also working fine

-- No need to recreate since the working ones already exist