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
  ],
  costas: [
    { name: 'Puxada Frontal', sets: 4, reps: '8-12', rest: '90s', muscle: 'Costas' },
    { name: 'Remada Curvada', sets: 4, reps: '8-12', rest: '90s', muscle: 'Costas' },
    { name: 'Remada Unilateral', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas' },
    { name: 'Pulldown', sets: 3, reps: '12-15', rest: '60s', muscle: 'Costas' },
    { name: 'Remada Baixa', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas' },
  ],
  pernas: [
    { name: 'Agachamento Livre', sets: 4, reps: '8-12', rest: '120s', muscle: 'Pernas' },
    { name: 'Leg Press 45°', sets: 4, reps: '10-12', rest: '90s', muscle: 'Pernas' },
    { name: 'Cadeira Extensora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Pernas' },
    { name: 'Mesa Flexora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Pernas' },
    { name: 'Panturrilha no Smith', sets: 4, reps: '15-20', rest: '45s', muscle: 'Pernas' },
    { name: 'Stiff', sets: 3, reps: '10-12', rest: '60s', muscle: 'Pernas' },
    { name: 'Avanço', sets: 3, reps: '12 cada', rest: '60s', muscle: 'Pernas' },
  ],
  ombros: [
    { name: 'Desenvolvimento com Halteres', sets: 4, reps: '8-12', rest: '90s', muscle: 'Ombros' },
    { name: 'Elevação Lateral', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros' },
    { name: 'Elevação Frontal', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros' },
    { name: 'Crucifixo Inverso', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros' },
  ],
  biceps: [
    { name: 'Rosca Direta com Barra', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps' },
    { name: 'Rosca Alternada', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps' },
    { name: 'Rosca Martelo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Bíceps' },
    { name: 'Rosca Scott', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps' },
  ],
  triceps: [
    { name: 'Tríceps Pulley', sets: 3, reps: '10-12', rest: '60s', muscle: 'Tríceps' },
    { name: 'Tríceps Testa', sets: 3, reps: '10-12', rest: '60s', muscle: 'Tríceps' },
    { name: 'Tríceps Francês', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps' },
    { name: 'Mergulho no Banco', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps' },
  ],
  abdomen: [
    { name: 'Abdominal Crunch', sets: 3, reps: '15-20', rest: '30s', muscle: 'Abdômen' },
    { name: 'Prancha', sets: 3, reps: '30-60s', rest: '30s', muscle: 'Abdômen' },
    { name: 'Elevação de Pernas', sets: 3, reps: '12-15', rest: '30s', muscle: 'Abdômen' },
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
      return exercises.slice(0, 3).map(e => ({ ...e, sets: Math.max(e.sets - 1, 2) }));
    case 'intermediario':
      return exercises.slice(0, 4);
    case 'avancado':
      return exercises;
    default:
      return exercises;
  }
}

export function generateWorkout(profile: UserProfile): WorkoutPlan {
  const { goal, level, daysPerWeek, hoursPerSession } = profile;

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

  // Estimate max exercises per session based on time available
  // ~5-7 min per exercise (sets + rest). For shorter sessions, fewer exercises.
  const maxExercisesPerDay = Math.max(4, Math.min(10, Math.floor(hoursPerSession * 60 / 6)));

  const pick = (group: string) => adjustForLevel(adjustForGoal(exerciseDatabase[group], goal), level);

  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const trimDay = (exercises: Exercise[]) => exercises.slice(0, maxExercisesPerDay);

  const allSplits: Record<number, WorkoutDay[]> = {
    2: [
      { day: dayNames[0], focus: 'Superior', exercises: trimDay([...pick('peito').slice(0, 2), ...pick('costas').slice(0, 2), ...pick('ombros').slice(0, 1), ...pick('biceps').slice(0, 1), ...pick('triceps').slice(0, 1)]) },
      { day: dayNames[3], focus: 'Inferior + Abdômen', exercises: trimDay([...pick('pernas'), ...pick('abdomen')]) },
    ],
    3: [
      { day: dayNames[0], focus: 'Push (Peito + Ombro + Tríceps)', exercises: trimDay([...pick('peito').slice(0, 2), ...pick('ombros').slice(0, 2), ...pick('triceps').slice(0, 1)]) },
      { day: dayNames[2], focus: 'Pull (Costas + Bíceps)', exercises: trimDay([...pick('costas'), ...pick('biceps').slice(0, 2), ...pick('abdomen').slice(0, 1)]) },
      { day: dayNames[4], focus: 'Pernas + Abdômen', exercises: trimDay([...pick('pernas'), ...pick('abdomen').slice(0, 1)]) },
    ],
    4: [
      { day: dayNames[0], focus: 'Peito + Tríceps', exercises: trimDay([...pick('peito'), ...pick('triceps').slice(0, 2)]) },
      { day: dayNames[1], focus: 'Costas + Bíceps', exercises: trimDay([...pick('costas'), ...pick('biceps').slice(0, 2)]) },
      { day: dayNames[3], focus: 'Pernas + Abdômen', exercises: trimDay([...pick('pernas'), ...pick('abdomen')]) },
      { day: dayNames[4], focus: 'Ombros + Braços', exercises: trimDay([...pick('ombros'), ...pick('biceps').slice(0, 1), ...pick('triceps').slice(0, 1)]) },
    ],
    5: [
      { day: dayNames[0], focus: 'Peito', exercises: trimDay([...pick('peito'), ...pick('abdomen').slice(0, 1)]) },
      { day: dayNames[1], focus: 'Costas', exercises: trimDay([...pick('costas'), ...pick('abdomen').slice(0, 1)]) },
      { day: dayNames[2], focus: 'Pernas', exercises: trimDay(pick('pernas')) },
      { day: dayNames[3], focus: 'Ombros + Trapézio', exercises: trimDay([...pick('ombros'), ...pick('abdomen')]) },
      { day: dayNames[4], focus: 'Braços', exercises: trimDay([...pick('biceps'), ...pick('triceps')]) },
    ],
    6: [
      { day: dayNames[0], focus: 'Peito + Tríceps', exercises: trimDay([...pick('peito'), ...pick('triceps').slice(0, 2)]) },
      { day: dayNames[1], focus: 'Costas + Bíceps', exercises: trimDay([...pick('costas'), ...pick('biceps').slice(0, 2)]) },
      { day: dayNames[2], focus: 'Pernas', exercises: trimDay(pick('pernas')) },
      { day: dayNames[3], focus: 'Ombros + Abdômen', exercises: trimDay([...pick('ombros'), ...pick('abdomen')]) },
      { day: dayNames[4], focus: 'Peito + Costas', exercises: trimDay([...pick('peito').slice(0, 2), ...pick('costas').slice(0, 2)]) },
      { day: dayNames[5], focus: 'Braços + Abdômen', exercises: trimDay([...pick('biceps'), ...pick('triceps'), ...pick('abdomen').slice(0, 1)]) },
    ],
  };

  const days = allSplits[Math.min(Math.max(daysPerWeek, 2), 6)] || allSplits[3];

  const timeLabel = hoursPerSession < 1 ? `${Math.round(hoursPerSession * 60)}min` : `${hoursPerSession}h`;

  return {
    title: `Treino ${goalLabels[goal]} - ${levelLabels[level]}`,
    description: `Plano personalizado para ${profile.name}. ${daysPerWeek}x por semana, sessões de ~${timeLabel}.`,
    daysPerWeek,
    days,
  };
}
