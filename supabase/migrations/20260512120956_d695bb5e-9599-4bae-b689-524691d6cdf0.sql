
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('buyer','vendor','tow_operator','vulcanizer','mechanic','admin');
CREATE TYPE public.part_condition AS ENUM ('new','refurbished','used');
CREATE TYPE public.part_status AS ENUM ('draft','active','out_of_stock','archived');
CREATE TYPE public.order_status AS ENUM ('pending_payment','paid','accepted','packed','shipped','delivered','completed','cancelled','disputed');
CREATE TYPE public.vendor_status AS ENUM ('pending','verified','suspended');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Users see own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ AUTO-CREATE PROFILE + DEFAULT BUYER ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT TRIGGER HELPER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ VENDORS ============
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  bvn TEXT,
  payout_account TEXT,
  status public.vendor_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified vendors are public"
  ON public.vendors FOR SELECT TO authenticated USING (status = 'verified' OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Vendors insert own row"
  ON public.vendors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vendors update own row"
  ON public.vendors FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage vendors"
  ON public.vendors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER vendors_updated BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PARTS CATEGORIES ============
CREATE TABLE public.parts_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.parts_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories readable by all"
  ON public.parts_categories FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins manage categories"
  ON public.parts_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.parts_categories (slug,name,icon,sort_order) VALUES
  ('battery','Batteries','🔋',10),
  ('tyres','Tyres & Wheels','🛞',20),
  ('brakes','Brakes','🛑',30),
  ('filters','Filters','🧽',40),
  ('lights','Lights & Bulbs','💡',50),
  ('fluids','Oils & Fluids','🛢️',60),
  ('engine','Engine Parts','⚙️',70),
  ('electrical','Electrical','🔌',80),
  ('body','Body & Mirrors','🚗',90),
  ('accessories','Accessories','🧰',100);

-- ============ PARTS ============
CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.parts_categories(id),
  title TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  price_kobo BIGINT NOT NULL CHECK (price_kobo >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  condition public.part_condition NOT NULL DEFAULT 'new',
  compatibility TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  status public.part_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
CREATE INDEX parts_category_idx ON public.parts(category_id);
CREATE INDEX parts_vendor_idx ON public.parts(vendor_id);
CREATE INDEX parts_status_idx ON public.parts(status);

CREATE POLICY "Active parts are public"
  ON public.parts FOR SELECT TO authenticated, anon USING (status = 'active');
CREATE POLICY "Vendors see own parts"
  ON public.parts FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));
CREATE POLICY "Vendors insert own parts"
  ON public.parts FOR INSERT TO authenticated
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));
CREATE POLICY "Vendors update own parts"
  ON public.parts FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));
CREATE POLICY "Vendors delete own parts"
  ON public.parts FOR DELETE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

CREATE TRIGGER parts_updated BEFORE UPDATE ON public.parts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CARTS ============
CREATE TABLE public.parts_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parts_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own cart"
  ON public.parts_carts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.parts_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.parts_carts(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  qty INT NOT NULL DEFAULT 1 CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, part_id)
);
ALTER TABLE public.parts_cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own cart items"
  ON public.parts_cart_items FOR ALL TO authenticated
  USING (cart_id IN (SELECT id FROM public.parts_carts WHERE user_id = auth.uid()))
  WITH CHECK (cart_id IN (SELECT id FROM public.parts_carts WHERE user_id = auth.uid()));

-- ============ ORDERS ============
CREATE TABLE public.parts_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending_payment',
  subtotal_kobo BIGINT NOT NULL DEFAULT 0,
  delivery_fee_kobo BIGINT NOT NULL DEFAULT 0,
  total_kobo BIGINT NOT NULL DEFAULT 0,
  delivery_address TEXT,
  delivery_phone TEXT,
  notes TEXT,
  escrow_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parts_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX parts_orders_buyer_idx ON public.parts_orders(buyer_id);
CREATE TRIGGER parts_orders_updated BEFORE UPDATE ON public.parts_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.parts_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.parts_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts(id),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  title_snapshot TEXT NOT NULL,
  unit_price_kobo BIGINT NOT NULL,
  qty INT NOT NULL CHECK (qty > 0),
  vendor_status public.order_status NOT NULL DEFAULT 'paid'
);
ALTER TABLE public.parts_order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX parts_order_items_order_idx ON public.parts_order_items(order_id);
CREATE INDEX parts_order_items_vendor_idx ON public.parts_order_items(vendor_id);

CREATE POLICY "Buyers see own orders"
  ON public.parts_orders FOR SELECT TO authenticated
  USING (buyer_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.parts_order_items oi
                    JOIN public.vendors v ON v.id = oi.vendor_id
                    WHERE oi.order_id = parts_orders.id AND v.user_id = auth.uid())
         OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Buyers insert own orders"
  ON public.parts_orders FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Buyers update own orders"
  ON public.parts_orders FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Order items follow order visibility"
  ON public.parts_order_items FOR SELECT TO authenticated
  USING (order_id IN (
    SELECT id FROM public.parts_orders WHERE buyer_id = auth.uid()
  ) OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Buyers insert order items"
  ON public.parts_order_items FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.parts_orders WHERE buyer_id = auth.uid()));
CREATE POLICY "Vendors update their item status"
  ON public.parts_order_items FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('parts-images','parts-images', true);

CREATE POLICY "Parts images public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'parts-images');
CREATE POLICY "Vendors upload parts images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'parts-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Vendors update own parts images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'parts-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Vendors delete own parts images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'parts-images' AND auth.uid()::text = (storage.foldername(name))[1]);
