
-- ===== 1. EXTEND PROFILES =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_checkin_at date;

-- ===== 2. FOLLOWS =====
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Insert own follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Delete own follow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);

-- ===== 3. LIKES =====
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Insert own like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own like" ON public.likes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own like" ON public.likes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS likes_product_idx ON public.likes(product_id);

-- ===== 4. NOTIFICATIONS =====
CREATE TYPE notification_type AS ENUM ('like','follow','comment','approve','reject','reply');
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  type notification_type NOT NULL,
  product_id uuid,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notif_user_idx ON public.notifications(user_id, read, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ===== 5. DAILY CHECKIN =====
CREATE TABLE IF NOT EXISTS public.daily_checkin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  xp_earned integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.daily_checkin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own checkin" ON public.daily_checkin FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own checkin" ON public.daily_checkin FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== 6. STORAGE: avatars bucket =====
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars', true)
  ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar user upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatar user update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatar user delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ===== 7. XP HELPER + LEVEL CALC =====
CREATE OR REPLACE FUNCTION public.add_xp(_user uuid, _amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_xp integer;
BEGIN
  UPDATE public.profiles SET xp = xp + _amount WHERE id = _user RETURNING xp INTO new_xp;
  -- level = 1 + floor(sqrt(xp/50)); 50xp=lv2, 200xp=lv3, 450xp=lv4, 800xp=lv5...
  IF new_xp IS NOT NULL THEN
    UPDATE public.profiles
    SET level = GREATEST(1, 1 + floor(sqrt(GREATEST(new_xp,0)::numeric / 50))::integer)
    WHERE id = _user;
  END IF;
END;
$$;

-- ===== 8. TRIGGER: like → +2 XP + notification =====
CREATE OR REPLACE FUNCTION public.on_like_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  prod_title text;
  actor_name text;
BEGIN
  SELECT user_id, title INTO owner_id, prod_title FROM public.products WHERE id = NEW.product_id;
  IF owner_id IS NULL OR owner_id = NEW.user_id THEN RETURN NEW; END IF;

  IF NEW.value = 1 AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.value <> 1)) THEN
    PERFORM public.add_xp(owner_id, 2);
    SELECT display_name INTO actor_name FROM public.profiles WHERE id = NEW.user_id;
    INSERT INTO public.notifications (user_id, actor_id, type, product_id, message)
    VALUES (owner_id, NEW.user_id, 'like', NEW.product_id,
            COALESCE(actor_name,'Ai đó') || ' đã thích "' || COALESCE(prod_title,'code của bạn') || '"');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_like_change ON public.likes;
CREATE TRIGGER trg_like_change AFTER INSERT OR UPDATE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.on_like_change();

-- ===== 9. TRIGGER: comment → +1 XP cho người comment + notify chủ code =====
CREATE OR REPLACE FUNCTION public.on_comment_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  prod_title text;
  actor_name text;
BEGIN
  PERFORM public.add_xp(NEW.user_id, 1);
  SELECT user_id, title INTO owner_id, prod_title FROM public.products WHERE id = NEW.product_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    SELECT display_name INTO actor_name FROM public.profiles WHERE id = NEW.user_id;
    INSERT INTO public.notifications (user_id, actor_id, type, product_id, message)
    VALUES (owner_id, NEW.user_id, 'comment', NEW.product_id,
            COALESCE(actor_name,'Ai đó') || ' đã bình luận về "' || COALESCE(prod_title,'code của bạn') || '"');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_comment_insert ON public.comments;
CREATE TRIGGER trg_comment_insert AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.on_comment_insert();

-- ===== 10. TRIGGER: follow → notify =====
CREATE OR REPLACE FUNCTION public.on_follow_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name text;
BEGIN
  SELECT display_name INTO actor_name FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, actor_id, type, message)
  VALUES (NEW.following_id, NEW.follower_id, 'follow',
          COALESCE(actor_name,'Ai đó') || ' đã theo dõi bạn');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_follow_insert ON public.follows;
CREATE TRIGGER trg_follow_insert AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.on_follow_insert();

-- ===== 11. TRIGGER: product approve/reject → +10 XP + notify =====
CREATE OR REPLACE FUNCTION public.on_product_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.add_xp(NEW.user_id, 10);
      INSERT INTO public.notifications (user_id, type, product_id, message)
      VALUES (NEW.user_id, 'approve', NEW.id, '🎉 Code "' || NEW.title || '" đã được duyệt! +10 XP');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, product_id, message)
      VALUES (NEW.user_id, 'reject', NEW.id, '❌ Code "' || NEW.title || '" bị từ chối: ' || COALESCE(NEW.reject_reason,'không có lý do'));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_product_status ON public.products;
CREATE TRIGGER trg_product_status AFTER UPDATE OF status ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.on_product_status_change();

-- ===== 12. updated_at trigger cho profiles =====
DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
