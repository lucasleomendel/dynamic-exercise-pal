ALTER TABLE public.exercise_library
  ADD COLUMN IF NOT EXISTS image_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_last_error text,
  ADD COLUMN IF NOT EXISTS image_last_try timestamptz;

CREATE INDEX IF NOT EXISTS idx_exercise_library_image_queue
  ON public.exercise_library (image_attempts, image_last_try)
  WHERE image_url IS NULL AND active = true;