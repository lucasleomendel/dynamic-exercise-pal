-- Supabase recommends wrapping auth helper calls in SELECT so they are
-- evaluated once per statement instead of once per row.
DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE coalesce(qual, '') LIKE '%auth.uid()%'
       OR coalesce(with_check, '') LIKE '%auth.uid()%'
  LOOP
    new_qual := CASE
      WHEN p.qual IS NULL THEN NULL
      ELSE replace(p.qual, 'auth.uid()', '(select auth.uid())')
    END;

    new_check := CASE
      WHEN p.with_check IS NULL THEN NULL
      ELSE replace(p.with_check, 'auth.uid()', '(select auth.uid())')
    END;

    IF new_qual IS NOT NULL AND new_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
        p.policyname, p.schemaname, p.tablename, new_qual, new_check
      );
    ELSIF new_qual IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s)',
        p.policyname, p.schemaname, p.tablename, new_qual
      );
    ELSIF new_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        p.policyname, p.schemaname, p.tablename, new_check
      );
    END IF;
  END LOOP;
END $$;