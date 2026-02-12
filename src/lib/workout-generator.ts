export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  sex: 'masculino' | 'feminino';
  goal: 'hipertrofia' | 'emagrecimento' | 'resistencia' | 'forca';
  level: 'iniciante' | 'intermediario' | 'avancado';
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
  const { goal, level } = profile;

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

  const pick = (group: string) => adjustForLevel(adjustForGoal(exerciseDatabase[group], goal), level);

  if (level === 'iniciante') {
    return {
      title: `Treino ${goalLabels[goal]} - ${levelLabels[level]}`,
      description: `Plano personalizado para ${profile.name}. Treino full body, 3x por semana.`,
      daysPerWeek: 3,
      days: [
        { day: 'Segunda', focus: 'Full Body A', exercises: [...pick('peito').slice(0, 2), ...pick('costas').slice(0, 2), ...pick('pernas').slice(0, 2), ...pick('abdomen').slice(0, 1)] },
        { day: 'Quarta', focus: 'Full Body B', exercises: [...pick('ombros').slice(0, 2), ...pick('biceps').slice(0, 1), ...pick('triceps').slice(0, 1), ...pick('pernas').slice(0, 2), ...pick('abdomen').slice(0, 1)] },
        { day: 'Sexta', focus: 'Full Body C', exercises: [...pick('peito').slice(0, 1), ...pick('costas').slice(0, 2), ...pick('ombros').slice(0, 1), ...pick('pernas').slice(0, 2), ...pick('abdomen').slice(0, 1)] },
      ],
    };
  }

  if (level === 'intermediario') {
    return {
      title: `Treino ${goalLabels[goal]} - ${levelLabels[level]}`,
      description: `Plano personalizado para ${profile.name}. Divisão ABC, 4x por semana.`,
      daysPerWeek: 4,
      days: [
        { day: 'Segunda', focus: 'Peito + Tríceps', exercises: [...pick('peito'), ...pick('triceps').slice(0, 2)] },
        { day: 'Terça', focus: 'Costas + Bíceps', exercises: [...pick('costas'), ...pick('biceps').slice(0, 2)] },
        { day: 'Quinta', focus: 'Pernas + Abdômen', exercises: [...pick('pernas'), ...pick('abdomen')] },
        { day: 'Sexta', focus: 'Ombros + Braços', exercises: [...pick('ombros'), ...pick('biceps').slice(0, 1), ...pick('triceps').slice(0, 1)] },
      ],
    };
  }

  // Avançado
  return {
    title: `Treino ${goalLabels[goal]} - ${levelLabels[level]}`,
    description: `Plano personalizado para ${profile.name}. Divisão ABCDE, 5x por semana.`,
    daysPerWeek: 5,
    days: [
      { day: 'Segunda', focus: 'Peito', exercises: [...pick('peito'), ...pick('abdomen').slice(0, 1)] },
      { day: 'Terça', focus: 'Costas', exercises: [...pick('costas'), ...pick('abdomen').slice(0, 1)] },
      { day: 'Quarta', focus: 'Pernas', exercises: pick('pernas') },
      { day: 'Quinta', focus: 'Ombros + Trapézio', exercises: [...pick('ombros'), ...pick('abdomen')] },
      { day: 'Sexta', focus: 'Braços', exercises: [...pick('biceps'), ...pick('triceps')] },
    ],
  };
}
