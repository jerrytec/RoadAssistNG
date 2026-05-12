-- Update handle_new_user to honor selected role + create vendor row if applicable
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  selected_role text;
  business text;
  app_role_val public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone'
  );

  selected_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
  business := NEW.raw_user_meta_data->>'business_name';

  -- Validate role; fall back to buyer
  BEGIN
    app_role_val := selected_role::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    app_role_val := 'buyer'::public.app_role;
  END;

  -- Always include buyer so users can also purchase
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer')
    ON CONFLICT DO NOTHING;
  IF app_role_val <> 'buyer' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, app_role_val)
      ON CONFLICT DO NOTHING;
  END IF;

  -- If vendor (parts seller), create a pending vendor row
  IF app_role_val = 'vendor' THEN
    INSERT INTO public.vendors (user_id, business_name, phone, status)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(business, ''), COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Shop')),
      NEW.raw_user_meta_data->>'phone',
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Unique constraint helps ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_unique ON public.user_roles(user_id, role);