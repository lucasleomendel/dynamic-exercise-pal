-- =========================================
-- PROFILES (dados pessoais do usuário)
-- =========================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  weight NUMERIC,
  height NUMERIC,
  sex TEXT,
  goal TEXT,
  level TEXT,
  days_per_week INTEGER,
  hours_per_session NUMERIC,
  selected_muscles TEXT[],
  split_legs BOOLEAN DEFAULT false,
  cpf TEXT,
  phone TEXT,
  birth_date DATE,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- =========================================
-- WORKOUT PLANS
-- =========================================
CREATE TABLE public.workout_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  days_per_week INTEGER,
  plan_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own plans" ON public.workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plans" ON public.workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plans" ON public.workout_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plans" ON public.workout_plans FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX idx_workout_plans_active ON public.workout_plans(user_id, is_active);

-- =========================================
-- WORKOUT HISTORY (particionado por mês)
-- =========================================
CREATE TABLE public.workout_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workout_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_exercises INTEGER NOT NULL DEFAULT 0,
  total_exercises INTEGER NOT NULL DEFAULT 0,
  day_focus TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, workout_date)
) PARTITION BY RANGE (workout_date);

-- Partições para o ano corrente e próximo
CREATE TABLE public.workout_history_2026 PARTITION OF public.workout_history
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE public.workout_history_2027 PARTITION OF public.workout_history
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE public.workout_history_default PARTITION OF public.workout_history DEFAULT;

ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own history" ON public.workout_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own history" ON public.workout_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own history" ON public.workout_history FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_workout_history_user_date ON public.workout_history(user_id, workout_date DESC);

-- =========================================
-- WEIGHT LOGS (histórico de cargas por exercício)
-- =========================================
CREATE TABLE public.weight_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_key TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  muscle TEXT,
  weight NUMERIC NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own weights" ON public.weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own weights" ON public.weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own weights" ON public.weight_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_weight_logs_user_exercise ON public.weight_logs(user_id, exercise_key, logged_at DESC);

-- =========================================
-- WATER LOGS (hidratação diária)
-- =========================================
CREATE TABLE public.water_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL DEFAULT 0,
  goal_ml INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own water" ON public.water_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own water" ON public.water_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own water" ON public.water_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_water_logs_user_date ON public.water_logs(user_id, log_date DESC);

-- =========================================
-- BODY COMPOSITIONS
-- =========================================
CREATE TABLE public.body_compositions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  skinfolds JSONB,
  measurements JSONB,
  body_fat NUMERIC,
  fat_mass NUMERIC,
  lean_mass NUMERIC,
  classification TEXT,
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.body_compositions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bodycomp" ON public.body_compositions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bodycomp" ON public.body_compositions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own bodycomp" ON public.body_compositions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_bodycomp_user_date ON public.body_compositions(user_id, measured_at DESC);

-- =========================================
-- EXERCISE CHECKS (estado dos checkboxes)
-- =========================================
CREATE TABLE public.exercise_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checks_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE public.exercise_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own checks" ON public.exercise_checks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own checks" ON public.exercise_checks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own checks" ON public.exercise_checks FOR UPDATE USING (auth.uid() = user_id);

-- =========================================
-- DIET PLANS
-- =========================================
CREATE TABLE public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diet_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own diet" ON public.diet_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own diet" ON public.diet_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own diet" ON public.diet_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own diet" ON public.diet_plans FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_diet_user_active ON public.diet_plans(user_id, is_active);

-- =========================================
-- SYNC LOG (auditoria)
-- =========================================
CREATE TABLE public.sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sync log" ON public.sync_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sync log" ON public.sync_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_sync_log_user ON public.sync_log(user_id, created_at DESC);

-- =========================================
-- TRIGGER updated_at genérico
-- =========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_workout_plans_updated BEFORE UPDATE ON public.workout_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_water_logs_updated BEFORE UPDATE ON public.water_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_exercise_checks_updated BEFORE UPDATE ON public.exercise_checks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_diet_plans_updated BEFORE UPDATE ON public.diet_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- AUTO-CREATE PROFILE on signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- DAILY HEALTH CHECK (auto-cura)
-- =========================================
CREATE OR REPLACE FUNCTION public.daily_health_check()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_orphans INTEGER := 0;
  v_old_history INTEGER := 0;
  v_invalid_weights INTEGER := 0;
  v_old_sync INTEGER := 0;
BEGIN
  -- Limpa histórico > 90 dias (políticas do app)
  DELETE FROM public.workout_history WHERE workout_date < now() - INTERVAL '90 days';
  GET DIAGNOSTICS v_old_history = ROW_COUNT;

  -- Remove pesos inválidos (<= 0)
  DELETE FROM public.weight_logs WHERE weight <= 0;
  GET DIAGNOSTICS v_invalid_weights = ROW_COUNT;

  -- Limpa sync logs > 30 dias
  DELETE FROM public.sync_log WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_old_sync = ROW_COUNT;

  -- Garante que todo usuário ativo tem profile
  INSERT INTO public.profiles (user_id, email)
  SELECT u.id, u.email FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE p.id IS NULL
  ON CONFLICT (user_id) DO NOTHING;
  GET DIAGNOSTICS v_orphans = ROW_COUNT;

  RETURN jsonb_build_object(
    'ran_at', now(),
    'profiles_created', v_orphans,
    'old_history_purged', v_old_history,
    'invalid_weights_removed', v_invalid_weights,
    'old_sync_purged', v_old_sync
  );
END; $$;

-- =========================================
-- AUTO-CREATE PARTITIONS yearly
-- =========================================
CREATE OR REPLACE FUNCTION public.ensure_workout_history_partition(p_year INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_table_name TEXT := format('workout_history_%s', p_year);
  v_start TEXT := format('%s-01-01', p_year);
  v_end TEXT := format('%s-01-01', p_year + 1);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = v_table_name AND schemaname = 'public') THEN
    EXECUTE format(
      'CREATE TABLE public.%I PARTITION OF public.workout_history FOR VALUES FROM (%L) TO (%L)',
      v_table_name, v_start, v_end
    );
  END IF;
END; $$;

-- =========================================
-- Habilita extensões para cron
-- =========================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;