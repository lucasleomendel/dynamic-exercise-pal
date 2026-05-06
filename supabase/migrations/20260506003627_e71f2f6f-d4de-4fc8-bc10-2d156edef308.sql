
-- 1. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS advanced_mode boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS training_method text;

-- 2. Training methods catalog
CREATE TABLE IF NOT EXISTS public.training_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  short_description text NOT NULL,
  full_description text NOT NULL,
  intensity text,
  recommended_for text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.training_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read training methods" ON public.training_methods FOR SELECT USING (true);

CREATE TRIGGER trg_training_methods_updated
BEFORE UPDATE ON public.training_methods
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Exercise library
CREATE TABLE IF NOT EXISTS public.exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL,
  secondary_muscles text[],
  equipment text,
  difficulty text,
  default_sets int DEFAULT 3,
  default_reps text DEFAULT '10-12',
  default_rest text DEFAULT '60s',
  technique_tip text,
  source text,
  active boolean DEFAULT true,
  last_verified_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, muscle_group)
);
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read exercises" ON public.exercise_library FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_exercise_library_muscle ON public.exercise_library(muscle_group) WHERE active;

CREATE TRIGGER trg_exercise_library_updated
BEFORE UPDATE ON public.exercise_library
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Library refresh log
CREATE TABLE IF NOT EXISTS public.library_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  exercises_added int DEFAULT 0,
  exercises_updated int DEFAULT 0,
  methods_updated int DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  notes text
);
ALTER TABLE public.library_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read library updates" ON public.library_updates FOR SELECT USING (true);

-- 5. Progression log per user
CREATE TABLE IF NOT EXISTS public.progression_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  period_start date,
  period_end date,
  workouts_completed int DEFAULT 0,
  avg_completion_rate numeric,
  weight_progression jsonb,
  recommendation text,
  applied boolean DEFAULT false,
  plan_changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.progression_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own progression" ON public.progression_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progression" ON public.progression_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_progression_log_user ON public.progression_log(user_id, analyzed_at DESC);

-- 6. Seed training methods
INSERT INTO public.training_methods (slug, name, short_description, full_description, intensity, recommended_for) VALUES
('low_volume', 'Low Volume', 'Poucas séries com alta intensidade.', 'Treino de baixo volume com 1-2 séries por exercício até a falha. Reduz fadiga sistêmica e foca em recuperação.', 'Alta', 'Avançados com pouco tempo'),
('high_volume', 'High Volume', 'Muitas séries para máxima hipertrofia.', 'Volume elevado (4-8 séries por grupo muscular). Estímulo máximo para hipertrofia em atletas adaptados.', 'Moderada', 'Hipertrofia avançada'),
('hit', 'High Intensity Training (HIT)', 'Uma série até a falha absoluta.', 'Filosofia Mike Mentzer: 1 série brutal até a falha por exercício, com cadência controlada. Recuperação longa.', 'Máxima', 'Avançados, baixa frequência'),
('myo_reps', 'Myo-Reps', 'Séries de ativação + mini-séries.', 'Série inicial 12-20 reps próxima da falha, seguida por mini-séries de 3-5 reps com 10-15s de descanso.', 'Alta', 'Hipertrofia eficiente'),
('drop_sets', 'Drop-Sets', 'Reduz carga e continua sem descanso.', 'Após falha, reduz a carga em 20-30% e continua até nova falha. Aumenta estresse metabólico.', 'Alta', 'Finalizadores'),
('rest_pause', 'Rest-Pause', 'Pausas curtas dentro da série.', 'Falha → 10-15s de descanso → mais reps → repete 2-3x. Aumenta volume com mesma carga.', 'Alta', 'Avançados'),
('bfr', 'BFR (Restrição de Fluxo Sanguíneo)', 'Cargas leves + oclusão venosa.', 'Treino oclusivo com 20-30% de 1RM e bandas. Ótimo para recuperação ou ganho com baixa carga articular.', 'Baixa-Moderada', 'Reabilitação, avançados')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name,
  short_description=EXCLUDED.short_description,
  full_description=EXCLUDED.full_description,
  intensity=EXCLUDED.intensity,
  recommended_for=EXCLUDED.recommended_for,
  updated_at=now();
