CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users delete own progression"
ON public.progression_log
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));