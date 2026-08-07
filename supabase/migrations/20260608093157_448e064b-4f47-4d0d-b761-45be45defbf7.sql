
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cpf text := NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'cpf',''), '\D', '', 'g'), '');
  v_phone text := NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'phone',''), '\D', '', 'g'), '');
  v_birth date := NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date;
  v_name text := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
BEGIN
  INSERT INTO public.profiles (user_id, email, name, cpf, phone, birth_date)
  VALUES (NEW.id, NEW.email, v_name, v_cpf, v_phone, v_birth)
  ON CONFLICT (user_id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    cpf = COALESCE(EXCLUDED.cpf, public.profiles.cpf),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    birth_date = COALESCE(EXCLUDED.birth_date, public.profiles.birth_date);
  RETURN NEW;
END; $function$;

-- Garante que o trigger esteja anexado em auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
