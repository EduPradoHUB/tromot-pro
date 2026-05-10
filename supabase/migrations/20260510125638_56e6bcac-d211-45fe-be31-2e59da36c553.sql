CREATE OR REPLACE FUNCTION public.search_distributors_secure(p_state text DEFAULT NULL::text, p_city text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, name text, state text, city text, cover_entire_state boolean, active boolean, created_at timestamp with time zone, phone_display text, whatsapp_display text, has_contact boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_state text;
  user_role user_role;
  effective_state text;
BEGIN
  SELECT profiles.state, profiles.role INTO user_state, user_role
  FROM public.profiles 
  WHERE profiles.user_id = auth.uid();

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: User not authenticated';
  END IF;

  IF user_role != 'ADM' AND user_state IS NULL THEN
    RAISE EXCEPTION 'Access denied: User location required';
  END IF;

  -- Para não-admins: usa p_state, ou cai para o estado do perfil
  -- Para admins: respeita p_state; se NULL, retorna TODOS os estados
  effective_state := COALESCE(p_state, CASE WHEN user_role != 'ADM' THEN user_state ELSE NULL END);

  -- Não-admins sem estado efetivo: nada
  IF effective_state IS NULL AND user_role != 'ADM' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.state,
    d.city,
    d.cover_entire_state,
    d.active,
    d.created_at,
    CASE WHEN user_role = 'ADM'::user_role THEN d.phone
         WHEN d.phone IS NOT NULL THEN
           CASE WHEN length(d.phone) < 4 THEN '***'
                ELSE substring(d.phone from 1 for 2) || '***' || substring(d.phone from length(d.phone)-1)
           END
         ELSE NULL 
    END as phone_display,
    CASE WHEN user_role = 'ADM'::user_role THEN d.whatsapp
         WHEN d.whatsapp IS NOT NULL THEN
           CASE WHEN length(d.whatsapp) < 4 THEN '***'
                ELSE substring(d.whatsapp from 1 for 2) || '***' || substring(d.whatsapp from length(d.whatsapp)-1)
           END
         ELSE NULL 
    END as whatsapp_display,
    CASE WHEN d.phone IS NOT NULL OR d.whatsapp IS NOT NULL THEN true ELSE false END as has_contact
  FROM public.distributors d
  WHERE d.active = true
    AND (effective_state IS NULL OR d.state = effective_state)
    AND (
      p_city IS NULL
      OR d.cover_entire_state = true
      OR d.city = p_city
    )
  ORDER BY 
    d.state,
    CASE WHEN p_city IS NOT NULL AND d.city = p_city THEN 0 ELSE 1 END,
    d.name;
END;
$function$;