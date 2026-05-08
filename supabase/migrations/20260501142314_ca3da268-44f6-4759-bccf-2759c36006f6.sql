CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS framework text,
  ADD COLUMN IF NOT EXISTS code_html text,
  ADD COLUMN IF NOT EXISTS code_css text,
  ADD COLUMN IF NOT EXISTS code_js text,
  ADD COLUMN IF NOT EXISTS embed_url text,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- Trigger to maintain search_tsv (uses unaccent + simple config for VN diacritic-insensitive search)
CREATE OR REPLACE FUNCTION public.products_search_tsv_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.title,''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.description,''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(array_to_string(NEW.tags,' '),''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.language,''))), 'C') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.framework,''))), 'C');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_products_search_tsv ON public.products;
CREATE TRIGGER trg_products_search_tsv
BEFORE INSERT OR UPDATE OF title, description, tags, language, framework
ON public.products
FOR EACH ROW EXECUTE FUNCTION public.products_search_tsv_update();

-- Backfill existing rows
UPDATE public.products SET title = title;

CREATE INDEX IF NOT EXISTS products_search_tsv_idx ON public.products USING gin(search_tsv);
CREATE INDEX IF NOT EXISTS products_tags_idx ON public.products USING gin(tags);
CREATE INDEX IF NOT EXISTS products_language_idx ON public.products(language);
CREATE INDEX IF NOT EXISTS products_framework_idx ON public.products(framework);
CREATE INDEX IF NOT EXISTS products_status_created_idx ON public.products(status, created_at DESC);

-- Autocomplete
CREATE OR REPLACE FUNCTION public.suggest_products(_q text, _limit int DEFAULT 8)
RETURNS TABLE(id uuid, title text, category product_category, download_count int)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  q_norm text := unaccent(coalesce(_q,''));
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.category, p.download_count
  FROM public.products p
  WHERE p.status = 'approved'
    AND (
      q_norm = '' OR
      p.search_tsv @@ websearch_to_tsquery('simple', q_norm)
      OR unaccent(p.title) ILIKE '%' || q_norm || '%'
    )
  ORDER BY
    CASE WHEN unaccent(p.title) ILIKE q_norm || '%' THEN 0 ELSE 1 END,
    p.download_count DESC,
    p.created_at DESC
  LIMIT _limit;
END
$$;

CREATE OR REPLACE FUNCTION public.increment_view(_product uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  UPDATE public.products SET view_count = view_count + 1 WHERE id = _product AND status = 'approved';
$$;