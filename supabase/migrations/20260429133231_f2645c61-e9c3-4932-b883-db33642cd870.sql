
-- RATINGS
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Auth insert own rating" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own rating" ON public.ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own rating" ON public.ratings FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_ratings_updated BEFORE UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_ratings_product ON public.ratings(product_id);

-- COMMENTS
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Auth insert comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own comment" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own or admin" ON public.comments FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_comments_updated BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_comments_product ON public.comments(product_id, created_at DESC);

-- FAVORITES
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own favorite" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own favorite" ON public.favorites FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);

-- REPORTS
CREATE TYPE public.report_status AS ENUM ('open','resolved','dismissed');
CREATE TYPE public.report_reason AS ENUM ('dead_link','broken_code','inappropriate','spam','other');
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reason report_reason NOT NULL,
  detail text CHECK (char_length(detail) <= 500),
  status report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User insert report" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "View own or admin" ON public.reports FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update report" ON public.reports FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_reports_status ON public.reports(status, created_at DESC);

-- BIO + DOWNLOAD COUNT
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text CHECK (char_length(bio) <= 300);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS download_count int NOT NULL DEFAULT 0;
