-- Verificar se temos alguma view com SECURITY DEFINER
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE '%distributor%';

-- Verificar funções com SECURITY DEFINER
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
FROM pg_proc p 
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
  AND (p.proname LIKE '%distributor%' OR prosecdef = true);