CREATE POLICY "Master admin can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_master_admin(auth.uid()));
CREATE POLICY "Master admin can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));

CREATE POLICY "Master admin can view all plans" ON public.workout_plans FOR SELECT TO authenticated USING (public.is_master_admin(auth.uid()));
CREATE POLICY "Master admin can delete all plans" ON public.workout_plans FOR DELETE TO authenticated USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Master admin can insert exercises" ON public.exercise_library FOR INSERT TO authenticated WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Master admin can update exercises" ON public.exercise_library FOR UPDATE TO authenticated USING (public.is_master_admin(auth.uid())) WITH CHECK (public.is_master_admin(auth.uid()));
CREATE POLICY "Master admin can delete exercises" ON public.exercise_library FOR DELETE TO authenticated USING (public.is_master_admin(auth.uid()));

GRANT INSERT, UPDATE, DELETE ON public.exercise_library TO authenticated;