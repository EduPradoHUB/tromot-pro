-- Atualiza a policy de INSERT de analytics_events para permitir os novos event_types do blog
DROP POLICY IF EXISTS "Authenticated users can create analytics events" ON public.analytics_events;

CREATE POLICY "Authenticated users can create analytics events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND event_type = ANY (ARRAY[
    'view_manual','view_produto','new_post','like','rating',
    'ad_impression','ad_click','login','search','share',
    'blog_cta_click','blog_read'
  ])
);