-- 1) Status enum + columns
CREATE TYPE public.product_status AS ENUM ('pending','approved','rejected');

ALTER TABLE public.products
  ADD COLUMN status product_status NOT NULL DEFAULT 'pending',
  ADD COLUMN reject_reason TEXT,
  ADD COLUMN reviewed_by UUID,
  ADD COLUMN reviewed_at TIMESTAMPTZ;

-- Existing rows -> approved (giữ data cũ nếu có)
UPDATE public.products SET status='approved' WHERE status='pending';

CREATE INDEX idx_products_status ON public.products(status);

-- 2) Replace SELECT policy: public chỉ thấy approved; owner thấy của mình; admin thấy hết
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

CREATE POLICY "View approved or own or admin"
ON public.products FOR SELECT
USING (
  status = 'approved'
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

-- 3) Admin có thể UPDATE để duyệt (đã có policy 'Owners or admin can update products' - giữ nguyên)
-- Thêm policy: admin xem mọi user_roles
CREATE POLICY "Admin can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(),'admin'));

-- 4) Download history
CREATE TABLE public.download_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('direct','bypass1','bypass2')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_dl_user ON public.download_history(user_id, created_at DESC);

CREATE POLICY "Users view own downloads"
ON public.download_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own downloads"
ON public.download_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5) Auto-grant admin to owner email khi đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));

  IF NEW.email = 'giabaovu375@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 6) Nếu user owner đã đăng ký rồi, cấp admin luôn
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'giabaovu375@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;