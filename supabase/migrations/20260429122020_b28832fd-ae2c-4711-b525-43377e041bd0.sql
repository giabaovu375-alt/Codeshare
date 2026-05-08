-- =========== ENUMS ===========
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.product_category AS ENUM ('game', 'shop', 'comic', 'other');

-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- =========== USER ROLES ===========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- =========== PRODUCTS ===========
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category product_category NOT NULL DEFAULT 'other',
  link_direct TEXT,
  link_bypass1 TEXT,
  link_bypass2 TEXT,
  demo_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create products"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners or admin can update products"
ON public.products FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owners or admin can delete products"
ON public.products FOR DELETE
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_created ON public.products(created_at DESC);

-- =========== RATE LIMIT (chống spam) ===========
CREATE OR REPLACE FUNCTION public.check_product_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.products
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 hour';
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Bạn đã đăng quá 5 sản phẩm trong 1 giờ. Vui lòng thử lại sau.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_rate_limit
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.check_product_rate_limit();

-- =========== UPDATED_AT trigger ===========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== AUTO PROFILE on signup ===========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== STORAGE BUCKET cho ảnh demo ===========
INSERT INTO storage.buckets (id, name, public) VALUES ('demo-images','demo-images', true);

CREATE POLICY "Demo images are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'demo-images');

CREATE POLICY "Authenticated users can upload demo images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'demo-images' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own demo images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'demo-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own demo images"
ON storage.objects FOR DELETE
USING (bucket_id = 'demo-images' AND auth.uid()::text = (storage.foldername(name))[1]);