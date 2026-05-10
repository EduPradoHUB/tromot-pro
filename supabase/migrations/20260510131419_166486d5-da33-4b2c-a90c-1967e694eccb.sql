CREATE OR REPLACE FUNCTION public.recalc_product_rating(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products p
  SET
    rating_count = COALESCE(agg.cnt, 0),
    rating_average = COALESCE(agg.avg, 0),
    updated_at = now()
  FROM (
    SELECT product_id, COUNT(*)::int AS cnt, ROUND(AVG(rating)::numeric, 2) AS avg
    FROM public.ratings
    WHERE product_id = p_product_id
    GROUP BY product_id
  ) agg
  WHERE p.id = p_product_id;

  UPDATE public.products
  SET rating_count = 0, rating_average = 0
  WHERE id = p_product_id
    AND NOT EXISTS (SELECT 1 FROM public.ratings WHERE product_id = p_product_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.ratings_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_product_rating(OLD.product_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.recalc_product_rating(NEW.product_id);
    IF NEW.product_id <> OLD.product_id THEN
      PERFORM public.recalc_product_rating(OLD.product_id);
    END IF;
    RETURN NEW;
  ELSE
    PERFORM public.recalc_product_rating(NEW.product_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_ratings_aggregate ON public.ratings;
CREATE TRIGGER trg_ratings_aggregate
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.ratings_after_change();

UPDATE public.products p
SET
  rating_count = COALESCE(agg.cnt, 0),
  rating_average = COALESCE(agg.avg, 0)
FROM (
  SELECT product_id, COUNT(*)::int AS cnt, ROUND(AVG(rating)::numeric, 2) AS avg
  FROM public.ratings
  GROUP BY product_id
) agg
WHERE p.id = agg.product_id;