CREATE TABLE public.parts_directory (
  id text PRIMARY KEY,
  sort_index integer NOT NULL,
  title text NOT NULL,
  brand text,
  category text NOT NULL,
  seller_name text,
  location text,
  price_kobo bigint NOT NULL,
  condition text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  rating numeric,
  compatibility text[] NOT NULL DEFAULT '{}',
  search_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.parts_directory TO anon;
GRANT SELECT ON public.parts_directory TO authenticated;
GRANT ALL ON public.parts_directory TO service_role;

ALTER TABLE public.parts_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parts directory is publicly readable"
ON public.parts_directory FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.parts_directory_search_text()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_text := lower(concat_ws(' ', NEW.title, NEW.brand, NEW.category, NEW.seller_name, NEW.location, NEW.condition, array_to_string(NEW.compatibility, ' ')));
  RETURN NEW;
END;
$$;

CREATE TRIGGER parts_directory_search_text_trg
BEFORE INSERT OR UPDATE ON public.parts_directory
FOR EACH ROW EXECUTE FUNCTION public.parts_directory_search_text();

CREATE INDEX parts_directory_sort_idx ON public.parts_directory (sort_index);
CREATE INDEX parts_directory_category_idx ON public.parts_directory (category);
CREATE INDEX parts_directory_search_idx ON public.parts_directory (search_text);