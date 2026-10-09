ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS injuries text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_profiles_injuries_gin
ON public.profiles USING gin (injuries);