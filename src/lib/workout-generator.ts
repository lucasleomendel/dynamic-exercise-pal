export const ALL_MUSCLE_GROUPS = ['peito', 'costas', 'pernas', 'ombros', 'biceps', 'triceps', 'abdomen'] as const;
export type MuscleGroup = typeof ALL_MUSCLE_GROUPS[number];

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  sex: 'masculino' | 'feminino';
  goal: 'hipertrofia' | 'emagrecimento' | 'resistencia' | 'forca';
  level: 'iniciante' | 'intermediario' | 'avancado';
  daysPerWeek: number;
  hoursPerSession: number;
  selectedMuscles?: MuscleGroup[];
  splitLegs?: boolean;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  muscle: string;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  title: string;
  description: string;
  daysPerWeek: number;
  days: WorkoutDay[];
}

const exerciseDatabase: Record<string, Exercise[]> = {
  peito: [
    { name: 'Supino Reto com Barra', sets: 4, reps: '8-12', rest: '90s', muscle: 'Peito' },
    { name: 'Supino Inclinado com Halteres', sets: 3, reps: '10-12', rest: '60s', muscle: 'Peito' },
    { name: 'Crucifixo na Máquina', sets: 3, reps: '12-15', rest: '60s', muscle: 'Peito' },
    { name: 'Crossover', sets: 3, reps: '12-15', rest: '45s', muscle: 'Peito' },
    { name: 'Flexão de Braço', sets: 3, reps: '15-20', rest: '45s', muscle: 'Peito' },
    { name: 'Supino Declinado', sets: 3, reps: '10-12', rest: '60s', muscle: 'Peito' },
    { name: 'Pullover com Halter', sets: 3, reps: '12-15', rest: '60s', muscle: 'Peito' },
    { name: 'Supino Reto com Halteres', sets: 4, reps: '8-12', rest: '90s', muscle: 'Peito' },
    { name: 'Supino Inclinado na Máquina', sets: 3, reps: '10-12', rest: '60s', muscle: 'Peito' },
    { name: 'Crucifixo Inclinado com Halteres', sets: 3, reps: '12-15', rest: '60s', muscle: 'Peito' },
    { name: 'Chest Press na Máquina', sets: 3, reps: '10-12', rest: '60s', muscle: 'Peito' },
    { name: 'Flexão Diamante', sets: 3, reps: '10-15', rest: '45s', muscle: 'Peito' },
  ],
  costas: [
    { name: 'Puxada Frontal', sets: 4, reps: '8-12', rest: '90s', muscle: 'Costas' },
    { name: 'Remada Curvada', sets: 4, reps: '8-12', rest: '90s', muscle: 'Costas' },
    { name: 'Remada Unilateral', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas' },
    { name: 'Pulldown', sets: 3, reps: '12-15', rest: '60s', muscle: 'Costas' },
    { name: 'Remada Baixa', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas' },
    { name: 'Puxada Supinada', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas' },
    { name: 'Barra Fixa', sets: 3, reps: '8-12', rest: '90s', muscle: 'Costas' },
    { name: 'Remada Cavalinho', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas' },
    { name: 'Remada na Máquina', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas' },
    { name: 'Puxada Neutra', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas' },
    { name: 'Remada Curvada com Halteres', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas' },
    { name: 'Pullover no Cabo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Costas' },
    { name: 'Remada Alta com Barra', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas' },
    { name: 'Levantamento Terra', sets: 4, reps: '5-8', rest: '120s', muscle: 'Costas' },
  ],
  pernas_anterior: [
    { name: 'Agachamento Livre', sets: 4, reps: '8-12', rest: '120s', muscle: 'Quadríceps' },
    { name: 'Leg Press 45°', sets: 4, reps: '10-12', rest: '90s', muscle: 'Quadríceps' },
    { name: 'Cadeira Extensora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Quadríceps' },
    { name: 'Agachamento Hack', sets: 3, reps: '10-12', rest: '90s', muscle: 'Quadríceps' },
    { name: 'Avanço com Halteres', sets: 3, reps: '12 cada', rest: '60s', muscle: 'Quadríceps' },
    { name: 'Agachamento Búlgaro', sets: 3, reps: '10 cada', rest: '60s', muscle: 'Quadríceps' },
    { name: 'Panturrilha no Leg Press', sets: 4, reps: '15-20', rest: '45s', muscle: 'Panturrilha' },
    { name: 'Agachamento Frontal', sets: 4, reps: '8-10', rest: '120s', muscle: 'Quadríceps' },
    { name: 'Leg Press Unilateral', sets: 3, reps: '10 cada', rest: '60s', muscle: 'Quadríceps' },
    { name: 'Agachamento Sumô', sets: 3, reps: '10-12', rest: '90s', muscle: 'Quadríceps' },
    { name: 'Passada no Smith', sets: 3, reps: '12 cada', rest: '60s', muscle: 'Quadríceps' },
  ],
  pernas_posterior: [
    { name: 'Stiff', sets: 4, reps: '10-12', rest: '90s', muscle: 'Posterior' },
    { name: 'Mesa Flexora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Posterior' },
    { name: 'Cadeira Flexora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Posterior' },
    { name: 'Elevação Pélvica (Hip Thrust)', sets: 4, reps: '10-12', rest: '90s', muscle: 'Glúteo' },
    { name: 'Abdução de Quadril', sets: 3, reps: '12-15', rest: '45s', muscle: 'Glúteo' },
    { name: 'Panturrilha no Smith', sets: 4, reps: '15-20', rest: '45s', muscle: 'Panturrilha' },
    { name: 'Panturrilha Sentado', sets: 3, reps: '15-20', rest: '45s', muscle: 'Panturrilha' },
    { name: 'Stiff Unilateral', sets: 3, reps: '10 cada', rest: '60s', muscle: 'Posterior' },
    { name: 'Good Morning', sets: 3, reps: '10-12', rest: '60s', muscle: 'Posterior' },
    { name: 'Glúteo no Cabo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Glúteo' },
    { name: 'Extensão de Quadril na Máquina', sets: 3, reps: '12-15', rest: '45s', muscle: 'Glúteo' },
  ],
  pernas: [
    { name: 'Agachamento Livre', sets: 4, reps: '8-12', rest: '120s', muscle: 'Pernas' },
    { name: 'Leg Press 45°', sets: 4, reps: '10-12', rest: '90s', muscle: 'Pernas' },
    { name: 'Cadeira Extensora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Pernas' },
    { name: 'Mesa Flexora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Pernas' },
    { name: 'Panturrilha no Smith', sets: 4, reps: '15-20', rest: '45s', muscle: 'Pernas' },
    { name: 'Stiff', sets: 3, reps: '10-12', rest: '60s', muscle: 'Pernas' },
    { name: 'Avanço', sets: 3, reps: '12 cada', rest: '60s', muscle: 'Pernas' },
    { name: 'Elevação Pélvica (Hip Thrust)', sets: 3, reps: '10-12', rest: '90s', muscle: 'Pernas' },
    { name: 'Agachamento Hack', sets: 3, reps: '10-12', rest: '90s', muscle: 'Pernas' },
    { name: 'Agachamento Búlgaro', sets: 3, reps: '10 cada', rest: '60s', muscle: 'Pernas' },
    { name: 'Panturrilha Sentado', sets: 3, reps: '15-20', rest: '45s', muscle: 'Pernas' },
    { name: 'Agachamento Sumô', sets: 3, reps: '10-12', rest: '90s', muscle: 'Pernas' },
  ],
  ombros: [
    { name: 'Desenvolvimento com Halteres', sets: 4, reps: '8-12', rest: '90s', muscle: 'Ombros' },
    { name: 'Elevação Lateral', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros' },
    { name: 'Elevação Frontal', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros' },
    { name: 'Crucifixo Inverso', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros' },
    { name: 'Desenvolvimento Arnold', sets: 3, reps: '10-12', rest: '60s', muscle: 'Ombros' },
    { name: 'Encolhimento com Barra', sets: 3, reps: '12-15', rest: '45s', muscle: 'Trapézio' },
    { name: 'Desenvolvimento Militar com Barra', sets: 4, reps: '6-10', rest: '120s', muscle: 'Ombros' },
    { name: 'Elevação Lateral no Cabo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros' },
    { name: 'Face Pull', sets: 3, reps: '15-20', rest: '45s', muscle: 'Ombros' },
    { name: 'Desenvolvimento na Máquina', sets: 3, reps: '10-12', rest: '60s', muscle: 'Ombros' },
    { name: 'Encolhimento com Halteres', sets: 3, reps: '12-15', rest: '45s', muscle: 'Trapézio' },
  ],
  biceps: [
    { name: 'Rosca Direta com Barra', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps' },
    { name: 'Rosca Alternada', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps' },
    { name: 'Rosca Martelo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Bíceps' },
    { name: 'Rosca Scott', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps' },
    { name: 'Rosca Concentrada', sets: 3, reps: '12-15', rest: '45s', muscle: 'Bíceps' },
    { name: 'Rosca no Cabo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Bíceps' },
    { name: 'Rosca Inversa', sets: 3, reps: '10-12', rest: '45s', muscle: 'Bíceps' },
    { name: 'Rosca 21', sets: 3, reps: '21', rest: '60s', muscle: 'Bíceps' },
    { name: 'Rosca Spider', sets: 3, reps: '10-12', rest: '45s', muscle: 'Bíceps' },
    { name: 'Rosca Inclinada com Halteres', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps' },
  ],
  triceps: [
    { name: 'Tríceps Pulley', sets: 3, reps: '10-12', rest: '60s', muscle: 'Tríceps' },
    { name: 'Tríceps Testa', sets: 3, reps: '10-12', rest: '60s', muscle: 'Tríceps' },
    { name: 'Tríceps Francês', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps' },
    { name: 'Mergulho no Banco', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps' },
    { name: 'Tríceps Corda', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps' },
    { name: 'Tríceps Coice', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps' },
    { name: 'Mergulho em Paralelas', sets: 3, reps: '8-12', rest: '90s', muscle: 'Tríceps' },
    { name: 'Tríceps Pulley Inverso', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps' },
    { name: 'Tríceps no Cross', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps' },
    { name: 'Supino Fechado', sets: 3, reps: '8-10', rest: '90s', muscle: 'Tríceps' },
  ],
  abdomen: [
    { name: 'Abdominal Crunch', sets: 3, reps: '15-20', rest: '30s', muscle: 'Abdômen' },
    { name: 'Prancha', sets: 3, reps: '30-60s', rest: '30s', muscle: 'Abdômen' },
    { name: 'Elevação de Pernas', sets: 3, reps: '12-15', rest: '30s', muscle: 'Abdômen' },
    { name: 'Abdominal Bicicleta', sets: 3, reps: '20', rest: '30s', muscle: 'Abdômen' },
    { name: 'Abdominal Infra na Barra', sets: 3, reps: '12-15', rest: '30s', muscle: 'Abdômen' },
    { name: 'Prancha Lateral', sets: 3, reps: '30s cada', rest: '30s', muscle: 'Abdômen' },
    { name: 'Abdominal na Polia', sets: 3, reps: '12-15', rest: '30s', muscle: 'Abdômen' },
    { name: 'Mountain Climber', sets: 3, reps: '20 cada', rest: '30s', muscle: 'Abdômen' },
    { name: 'Russian Twist', sets: 3, reps: '20', rest: '30s', muscle: 'Abdômen' },
    { name: 'Abdominal Canivete', sets: 3, reps: '12-15', rest: '30s', muscle: 'Abdômen' },
  ],
};

function adjustForGoal(exercises: Exercise[], goal: string): Exercise[] {
  return exercises.map(ex => {
    const e = { ...ex };
    switch (goal) {
      case 'hipertrofia':
        e.sets = Math.min(e.sets + 1, 5);
        e.reps = '8-12';
        e.rest = '90s';
        break;
      case 'emagrecimento':
        e.reps = '15-20';
        e.rest = '30s';
        break;
      case 'resistencia':
        e.reps = '15-25';
        e.rest = '30s';
        break;
      case 'forca':
        e.sets = 5;
        e.reps = '3-6';
        e.rest = '180s';
        break;
    }
    return e;
  });
}

function adjustForLevel(exercises: Exercise[], level: string): Exercise[] {
  switch (level) {
    case 'iniciante':
      // Iniciante: 4-5 exercícios base, menos séries, foco em compostos
      return exercises.slice(0, 5).map(e => ({ ...e, sets: Math.max(e.sets - 1, 2) }));
    case 'intermediario':
      // Intermediário: 5-7 exercícios, séries padrão
      return exercises.slice(0, 7);
    case 'avancado':
      // Avançado: acesso completo ao banco, mais volume
      return exercises.map(e => ({ ...e, sets: Math.min(e.sets + 1, 6) }));
    default:
      return exercises;
  }
}

const MIN_EXERCISES_PER_DAY = 4;

function padDay(exercises: Exercise[], allowed: MuscleGroup[], goal: string, level: string): Exercise[] {
  if (exercises.length >= MIN_EXERCISES_PER_DAY) return exercises;

  const existing = new Set(exercises.map(e => e.name));
  const fillGroups: string[] = ['abdomen', 'ombros', 'biceps', 'triceps', 'costas', 'peito'];

  for (const group of fillGroups) {
    if (exercises.length >= MIN_EXERCISES_PER_DAY) break;
    if (!allowed.includes(group as MuscleGroup)) continue;
    const pool = adjustForLevel(adjustForGoal(exerciseDatabase[group] || [], goal), level);
    for (const ex of pool) {
      if (exercises.length >= MIN_EXERCISES_PER_DAY) break;
      if (!existing.has(ex.name)) {
        exercises.push(ex);
        existing.add(ex.name);
      }
    }
  }
  return exercises;
}

export function generateWorkout(profile: UserProfile): WorkoutPlan {
  const { goal, level, daysPerWeek, hoursPerSession, selectedMuscles, splitLegs } = profile;
  const allowed = selectedMuscles && selectedMuscles.length >= 2 ? selectedMuscles : [...ALL_MUSCLE_GROUPS];

  const goalLabels: Record<string, string> = {
    hipertrofia: 'Hipertrofia',
    emagrecimento: 'Emagrecimento',
    resistencia: 'Resistência Muscular',
    forca: 'Força Máxima',
  };

  const levelLabels: Record<string, string> = {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado',
  };

  const maxExercisesPerDay = Math.max(MIN_EXERCISES_PER_DAY, Math.min(12, Math.floor(hoursPerSession * 60 / 5)));

  const pick = (group: string) => {
    if (!allowed.includes(group as MuscleGroup) && group !== 'pernas_anterior' && group !== 'pernas_posterior') return [];
    if ((group === 'pernas_anterior' || group === 'pernas_posterior') && !allowed.includes('pernas')) return [];
    return adjustForLevel(adjustForGoal(exerciseDatabase[group] || [], goal), level);
  };

  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const trimAndPad = (exercises: Exercise[]) => {
    const trimmed = exercises.slice(0, maxExercisesPerDay);
    return padDay(trimmed, allowed, goal, level);
  };

  const useSplitLegs = splitLegs && allowed.includes('pernas') && daysPerWeek >= 4;

  function buildSplit(): WorkoutDay[] {
    const result: WorkoutDay[] = [];

    if (daysPerWeek === 2) {
      result.push({
        day: dayNames[0], focus: 'Superior',
        exercises: trimAndPad([...pick('peito').slice(0, 3), ...pick('costas').slice(0, 2), ...pick('ombros').slice(0, 1), ...pick('biceps').slice(0, 1), ...pick('triceps').slice(0, 1)]),
      });
      result.push({
        day: dayNames[3], focus: 'Inferior + Core',
        exercises: trimAndPad([...pick('pernas'), ...pick('abdomen').slice(0, 2)]),
      });
    } else if (daysPerWeek === 3) {
      result.push({
        day: dayNames[0], focus: 'Push (Peito + Ombro + Tríceps)',
        exercises: trimAndPad([...pick('peito').slice(0, 3), ...pick('ombros').slice(0, 2), ...pick('triceps').slice(0, 2)]),
      });
      result.push({
        day: dayNames[2], focus: 'Pull (Costas + Bíceps)',
        exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 2), ...pick('abdomen').slice(0, 1)]),
      });
      result.push({
        day: dayNames[4], focus: 'Pernas + Abdômen',
        exercises: trimAndPad([...pick('pernas'), ...pick('abdomen').slice(0, 2)]),
      });
    } else if (daysPerWeek === 4) {
      if (useSplitLegs) {
        result.push({
          day: dayNames[0], focus: 'Peito + Tríceps',
          exercises: trimAndPad([...pick('peito').slice(0, 4), ...pick('triceps').slice(0, 3)]),
        });
        result.push({
          day: dayNames[1], focus: 'Quadríceps + Panturrilha',
          exercises: trimAndPad([...pick('pernas_anterior'), ...pick('abdomen').slice(0, 1)]),
        });
        result.push({
          day: dayNames[3], focus: 'Costas + Bíceps',
          exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 3)]),
        });
        result.push({
          day: dayNames[4], focus: 'Posterior + Glúteo + Ombros',
          exercises: trimAndPad([...pick('pernas_posterior').slice(0, 4), ...pick('ombros').slice(0, 2)]),
        });
      } else {
        result.push({
          day: dayNames[0], focus: 'Peito + Tríceps',
          exercises: trimAndPad([...pick('peito').slice(0, 4), ...pick('triceps').slice(0, 3)]),
        });
        result.push({
          day: dayNames[1], focus: 'Costas + Bíceps',
          exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 3)]),
        });
        result.push({
          day: dayNames[3], focus: 'Pernas + Abdômen',
          exercises: trimAndPad([...pick('pernas'), ...pick('abdomen').slice(0, 2)]),
        });
        result.push({
          day: dayNames[4], focus: 'Ombros + Braços',
          exercises: trimAndPad([...pick('ombros').slice(0, 3), ...pick('biceps').slice(0, 2), ...pick('triceps').slice(0, 2)]),
        });
      }
    } else if (daysPerWeek === 5) {
      if (useSplitLegs) {
        result.push({
          day: dayNames[0], focus: 'Peito',
          exercises: trimAndPad([...pick('peito'), ...pick('abdomen').slice(0, 1)]),
        });
        result.push({
          day: dayNames[1], focus: 'Quadríceps + Panturrilha',
          exercises: trimAndPad([...pick('pernas_anterior')]),
        });
        result.push({
          day: dayNames[2], focus: 'Costas + Bíceps',
          exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 2)]),
        });
        result.push({
          day: dayNames[3], focus: 'Posterior + Glúteo',
          exercises: trimAndPad([...pick('pernas_posterior'), ...pick('abdomen').slice(0, 1)]),
        });
        result.push({
          day: dayNames[4], focus: 'Ombros + Tríceps',
          exercises: trimAndPad([...pick('ombros').slice(0, 3), ...pick('triceps').slice(0, 3)]),
        });
      } else {
        result.push({
          day: dayNames[0], focus: 'Peito',
          exercises: trimAndPad([...pick('peito'), ...pick('abdomen').slice(0, 1)]),
        });
        result.push({
          day: dayNames[1], focus: 'Costas',
          exercises: trimAndPad([...pick('costas'), ...pick('abdomen').slice(0, 1)]),
        });
        result.push({
          day: dayNames[2], focus: 'Pernas',
          exercises: trimAndPad(pick('pernas')),
        });
        result.push({
          day: dayNames[3], focus: 'Ombros + Trapézio',
          exercises: trimAndPad([...pick('ombros'), ...pick('abdomen').slice(0, 2)]),
        });
        result.push({
          day: dayNames[4], focus: 'Braços',
          exercises: trimAndPad([...pick('biceps'), ...pick('triceps')]),
        });
      }
    } else {
      // 6 days
      if (useSplitLegs) {
        result.push({
          day: dayNames[0], focus: 'Peito + Tríceps',
          exercises: trimAndPad([...pick('peito').slice(0, 4), ...pick('triceps').slice(0, 3)]),
        });
        result.push({
          day: dayNames[1], focus: 'Quadríceps + Panturrilha',
          exercises: trimAndPad([...pick('pernas_anterior')]),
        });
        result.push({
          day: dayNames[2], focus: 'Costas + Bíceps',
          exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 3)]),
        });
        result.push({
          day: dayNames[3], focus: 'Posterior + Glúteo',
          exercises: trimAndPad([...pick('pernas_posterior')]),
        });
        result.push({
          day: dayNames[4], focus: 'Ombros + Abdômen',
          exercises: trimAndPad([...pick('ombros'), ...pick('abdomen')]),
        });
        result.push({
          day: dayNames[5], focus: 'Braços + Core',
          exercises: trimAndPad([...pick('biceps'), ...pick('triceps'), ...pick('abdomen').slice(0, 1)]),
        });
      } else {
        result.push({
          day: dayNames[0], focus: 'Peito + Tríceps',
          exercises: trimAndPad([...pick('peito').slice(0, 4), ...pick('triceps').slice(0, 3)]),
        });
        result.push({
          day: dayNames[1], focus: 'Costas + Bíceps',
          exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 3)]),
        });
        result.push({
          day: dayNames[2], focus: 'Pernas',
          exercises: trimAndPad(pick('pernas')),
        });
        result.push({
          day: dayNames[3], focus: 'Ombros + Abdômen',
          exercises: trimAndPad([...pick('ombros'), ...pick('abdomen')]),
        });
        result.push({
          day: dayNames[4], focus: 'Peito + Costas',
          exercises: trimAndPad([...pick('peito').slice(0, 3), ...pick('costas').slice(0, 3)]),
        });
        result.push({
          day: dayNames[5], focus: 'Braços + Core',
          exercises: trimAndPad([...pick('biceps'), ...pick('triceps'), ...pick('abdomen').slice(0, 1)]),
        });
      }
    }

    return result;
  }

  const days = buildSplit().filter(d => d.exercises.length > 0);

  const timeLabel = hoursPerSession < 1 ? `${Math.round(hoursPerSession * 60)}min` : `${hoursPerSession}h`;

  return {
    title: `Treino ${goalLabels[goal]} - ${levelLabels[level]}`,
    description: `Plano personalizado para ${profile.name}. ${days.length}x por semana, sessões de ~${timeLabel}.`,
    daysPerWeek: days.length,
    days,
  };
}
