
-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  sex TEXT CHECK (sex IN ('masculino', 'feminino')),
  weight NUMERIC(5,1),
  height NUMERIC(5,1),
  goal TEXT CHECK (goal IN ('hipertrofia', 'emagrecimento', 'resistencia', 'forca')),
  level TEXT CHECK (level IN ('iniciante', 'intermediario', 'avancado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal-student links
CREATE TABLE public.personal_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(personal_id, student_id)
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_student_links ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.is_personal_trainer(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = uid AND (
      raw_user_meta_data->>'role' = 'personal'
      OR email = 'lucas.mendel@hotmail.com'
    )
  )
$$;

-- Students RLS
CREATE POLICY "Personal trainers can view students"
  ON public.students FOR SELECT TO authenticated
  USING (public.is_personal_trainer(auth.uid()));

CREATE POLICY "Personal trainers can insert students"
  ON public.students FOR INSERT TO authenticated
  WITH CHECK (public.is_personal_trainer(auth.uid()));

CREATE POLICY "Personal trainers can update students"
  ON public.students FOR UPDATE TO authenticated
  USING (
    public.is_personal_trainer(auth.uid())
    AND id IN (SELECT student_id FROM public.personal_student_links WHERE personal_id = auth.uid())
  );

-- Links RLS
CREATE POLICY "Personal trainers can view their links"
  ON public.personal_student_links FOR SELECT TO authenticated
  USING (personal_id = auth.uid());

CREATE POLICY "Personal trainers can create links"
  ON public.personal_student_links FOR INSERT TO authenticated
  WITH CHECK (personal_id = auth.uid() AND public.is_personal_trainer(auth.uid()));

CREATE POLICY "Personal trainers can delete links"
  ON public.personal_student_links FOR DELETE TO authenticated
  USING (personal_id = auth.uid());

-- Indexes
CREATE INDEX idx_students_cpf ON public.students(cpf);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
