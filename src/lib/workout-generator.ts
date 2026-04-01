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
  tip?: string;
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
    { name: 'Supino Reto com Barra', sets: 4, reps: '8-12', rest: '90s', muscle: 'Peito', tip: 'Mantenha escápulas retraídas e pés firmes no chão' },
    { name: 'Supino Inclinado com Halteres', sets: 3, reps: '10-12', rest: '60s', muscle: 'Peito', tip: 'Inclinação de 30-45° para ênfase na porção clavicular' },
    { name: 'Crucifixo na Máquina', sets: 3, reps: '12-15', rest: '60s', muscle: 'Peito', tip: 'Foco na contração e alongamento completo' },
    { name: 'Crossover', sets: 3, reps: '12-15', rest: '45s', muscle: 'Peito', tip: 'Cruze as mãos na frente para máxima contração' },
    { name: 'Flexão de Braço', sets: 3, reps: '15-20', rest: '45s', muscle: 'Peito', tip: 'Corpo alinhado, core ativado' },
    { name: 'Supino Declinado', sets: 3, reps: '10-12', rest: '60s', muscle: 'Peito', tip: 'Ênfase na porção esternal inferior' },
    { name: 'Pullover com Halter', sets: 3, reps: '12-15', rest: '60s', muscle: 'Peito', tip: 'Amplitude controlada, sinta o alongamento' },
    { name: 'Supino Reto com Halteres', sets: 4, reps: '8-12', rest: '90s', muscle: 'Peito', tip: 'Maior amplitude que a barra' },
    { name: 'Supino Inclinado na Máquina', sets: 3, reps: '10-12', rest: '60s', muscle: 'Peito', tip: 'Bom para iniciantes pela estabilidade' },
    { name: 'Crucifixo Inclinado com Halteres', sets: 3, reps: '12-15', rest: '60s', muscle: 'Peito', tip: 'Cotovelos levemente flexionados' },
    { name: 'Chest Press na Máquina', sets: 3, reps: '10-12', rest: '60s', muscle: 'Peito', tip: 'Ideal para séries até a falha' },
    { name: 'Flexão Diamante', sets: 3, reps: '10-15', rest: '45s', muscle: 'Peito', tip: 'Mãos juntas para ênfase em tríceps e peitoral interno' },
  ],
  costas: [
    { name: 'Puxada Frontal', sets: 4, reps: '8-12', rest: '90s', muscle: 'Costas', tip: 'Puxe com os cotovelos, não com as mãos' },
    { name: 'Remada Curvada', sets: 4, reps: '8-12', rest: '90s', muscle: 'Costas', tip: 'Tronco a 45°, coluna neutra' },
    { name: 'Remada Unilateral', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas', tip: 'Escápula totalmente retraída no topo' },
    { name: 'Pulldown', sets: 3, reps: '12-15', rest: '60s', muscle: 'Costas', tip: 'Pegada pronada, amplitude completa' },
    { name: 'Remada Baixa', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas', tip: 'Mantenha peito elevado durante todo o movimento' },
    { name: 'Puxada Supinada', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas', tip: 'Boa para ativar bíceps junto' },
    { name: 'Barra Fixa', sets: 3, reps: '8-12', rest: '90s', muscle: 'Costas', tip: 'Use elástico se necessário para completar as reps' },
    { name: 'Remada Cavalinho', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas', tip: 'Pegada neutra, tração ao abdômen' },
    { name: 'Remada na Máquina', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas', tip: 'Foco na contração das escápulas' },
    { name: 'Puxada Neutra', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas', tip: 'Pegada neutra reduz estresse nos ombros' },
    { name: 'Remada Curvada com Halteres', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas', tip: 'Rotação do punho ao subir' },
    { name: 'Pullover no Cabo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Costas', tip: 'Braços estendidos, tensão constante' },
    { name: 'Remada Alta com Barra', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas', tip: 'Cotovelos acima dos ombros no topo' },
    { name: 'Levantamento Terra', sets: 4, reps: '5-8', rest: '180s', muscle: 'Costas', tip: 'Dobradiça no quadril, barra rente ao corpo' },
    { name: 'Seal Row (Remada no Banco)', sets: 3, reps: '10-12', rest: '60s', muscle: 'Costas', tip: 'Elimina impulso do tronco' },
  ],
  pernas_anterior: [
    { name: 'Agachamento Livre', sets: 4, reps: '8-12', rest: '120s', muscle: 'Quadríceps', tip: 'Profundidade até paralelo ou abaixo' },
    { name: 'Leg Press 45°', sets: 4, reps: '10-12', rest: '90s', muscle: 'Quadríceps', tip: 'Pés na largura dos ombros, joelhos alinhados' },
    { name: 'Cadeira Extensora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Quadríceps', tip: 'Contração de pico no topo por 1-2s' },
    { name: 'Agachamento Hack', sets: 3, reps: '10-12', rest: '90s', muscle: 'Quadríceps', tip: 'Costas apoiadas, foco nos quadríceps' },
    { name: 'Avanço com Halteres', sets: 3, reps: '12 cada', rest: '60s', muscle: 'Quadríceps', tip: 'Passo longo para mais glúteo' },
    { name: 'Agachamento Búlgaro', sets: 3, reps: '10 cada', rest: '60s', muscle: 'Quadríceps', tip: 'Tronco levemente inclinado à frente' },
    { name: 'Panturrilha no Leg Press', sets: 4, reps: '15-20', rest: '45s', muscle: 'Panturrilha', tip: 'Amplitude máxima, sem impulso' },
    { name: 'Agachamento Frontal', sets: 4, reps: '8-10', rest: '120s', muscle: 'Quadríceps', tip: 'Cotovelos altos, core forte' },
    { name: 'Leg Press Unilateral', sets: 3, reps: '10 cada', rest: '60s', muscle: 'Quadríceps', tip: 'Corrige desequilíbrios musculares' },
    { name: 'Agachamento Sumô', sets: 3, reps: '10-12', rest: '90s', muscle: 'Quadríceps', tip: 'Pés afastados, pontas para fora' },
    { name: 'Passada no Smith', sets: 3, reps: '12 cada', rest: '60s', muscle: 'Quadríceps', tip: 'Movimento controlado e estável' },
    { name: 'Sissy Squat', sets: 3, reps: '10-15', rest: '60s', muscle: 'Quadríceps', tip: 'Isola o reto femoral, apoie-se se necessário' },
  ],
  pernas_posterior: [
    { name: 'Stiff', sets: 4, reps: '10-12', rest: '90s', muscle: 'Posterior', tip: 'Joelhos levemente flexionados, coluna neutra' },
    { name: 'Mesa Flexora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Posterior', tip: 'Contraia no topo, desça controlado' },
    { name: 'Cadeira Flexora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Posterior', tip: 'Pés em dorsiflexão para mais ativação' },
    { name: 'Elevação Pélvica (Hip Thrust)', sets: 4, reps: '10-12', rest: '90s', muscle: 'Glúteo', tip: 'Squeeze máximo no topo, queixo ao peito' },
    { name: 'Abdução de Quadril', sets: 3, reps: '12-15', rest: '45s', muscle: 'Glúteo', tip: 'Incline o tronco para ativar glúteo médio' },
    { name: 'Panturrilha no Smith', sets: 4, reps: '15-20', rest: '45s', muscle: 'Panturrilha', tip: 'Pausa de 2s no alongamento' },
    { name: 'Panturrilha Sentado', sets: 3, reps: '15-20', rest: '45s', muscle: 'Panturrilha', tip: 'Foco no sóleo, amplitude total' },
    { name: 'Stiff Unilateral', sets: 3, reps: '10 cada', rest: '60s', muscle: 'Posterior', tip: 'Melhora equilíbrio e estabilidade' },
    { name: 'Good Morning', sets: 3, reps: '10-12', rest: '60s', muscle: 'Posterior', tip: 'Barra nos trapézios, dobradiça no quadril' },
    { name: 'Glúteo no Cabo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Glúteo', tip: 'Extensão completa do quadril' },
    { name: 'Extensão de Quadril na Máquina', sets: 3, reps: '12-15', rest: '45s', muscle: 'Glúteo', tip: 'Controle na fase excêntrica' },
    { name: 'Nordic Curl', sets: 3, reps: '6-10', rest: '90s', muscle: 'Posterior', tip: 'Excêntrica lenta, use apoio se necessário' },
  ],
  pernas: [
    { name: 'Agachamento Livre', sets: 4, reps: '8-12', rest: '120s', muscle: 'Pernas', tip: 'Exercício rei para pernas' },
    { name: 'Leg Press 45°', sets: 4, reps: '10-12', rest: '90s', muscle: 'Pernas', tip: 'Não trave os joelhos no topo' },
    { name: 'Cadeira Extensora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Pernas', tip: 'Isola quadríceps eficientemente' },
    { name: 'Mesa Flexora', sets: 3, reps: '12-15', rest: '60s', muscle: 'Pernas', tip: 'Trabalha os isquiotibiais' },
    { name: 'Panturrilha no Smith', sets: 4, reps: '15-20', rest: '45s', muscle: 'Pernas', tip: 'Panturrilha exige alto volume' },
    { name: 'Stiff', sets: 3, reps: '10-12', rest: '60s', muscle: 'Pernas', tip: 'Foco na cadeia posterior' },
    { name: 'Avanço', sets: 3, reps: '12 cada', rest: '60s', muscle: 'Pernas', tip: 'Ótimo para glúteos e equilíbrio' },
    { name: 'Elevação Pélvica (Hip Thrust)', sets: 3, reps: '10-12', rest: '90s', muscle: 'Pernas', tip: 'Melhor exercício para glúteos' },
    { name: 'Agachamento Hack', sets: 3, reps: '10-12', rest: '90s', muscle: 'Pernas', tip: 'Isola quadríceps com segurança' },
    { name: 'Agachamento Búlgaro', sets: 3, reps: '10 cada', rest: '60s', muscle: 'Pernas', tip: 'Trabalho unilateral excelente' },
    { name: 'Panturrilha Sentado', sets: 3, reps: '15-20', rest: '45s', muscle: 'Pernas', tip: 'Complementa a panturrilha em pé' },
    { name: 'Agachamento Sumô', sets: 3, reps: '10-12', rest: '90s', muscle: 'Pernas', tip: 'Adutores e glúteos' },
  ],
  ombros: [
    { name: 'Desenvolvimento com Halteres', sets: 4, reps: '8-12', rest: '90s', muscle: 'Ombros', tip: 'Cotovelos a 45° do tronco' },
    { name: 'Elevação Lateral', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros', tip: 'Leve inclinação para frente, mindinho acima' },
    { name: 'Elevação Frontal', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros', tip: 'Não eleve acima da linha dos ombros' },
    { name: 'Crucifixo Inverso', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros', tip: 'Fundamental para saúde dos ombros' },
    { name: 'Desenvolvimento Arnold', sets: 3, reps: '10-12', rest: '60s', muscle: 'Ombros', tip: 'Rotação durante a subida' },
    { name: 'Encolhimento com Barra', sets: 3, reps: '12-15', rest: '45s', muscle: 'Trapézio', tip: 'Eleve os ombros às orelhas' },
    { name: 'Desenvolvimento Militar com Barra', sets: 4, reps: '6-10', rest: '120s', muscle: 'Ombros', tip: 'Core firme, sem inclinar para trás' },
    { name: 'Elevação Lateral no Cabo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros', tip: 'Tensão constante no deltóide lateral' },
    { name: 'Face Pull', sets: 3, reps: '15-20', rest: '45s', muscle: 'Ombros', tip: 'Essencial para postura e saúde do ombro' },
    { name: 'Desenvolvimento na Máquina', sets: 3, reps: '10-12', rest: '60s', muscle: 'Ombros', tip: 'Estável para trabalhar até a falha' },
    { name: 'Encolhimento com Halteres', sets: 3, reps: '12-15', rest: '45s', muscle: 'Trapézio', tip: 'Segure no topo por 2s' },
    { name: 'Y-Raise com Halteres', sets: 3, reps: '12-15', rest: '45s', muscle: 'Ombros', tip: 'Fortalece deltóide posterior e trapézio inferior' },
  ],
  biceps: [
    { name: 'Rosca Direta com Barra', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps', tip: 'Cotovelos fixos ao corpo' },
    { name: 'Rosca Alternada', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps', tip: 'Supine o punho durante a subida' },
    { name: 'Rosca Martelo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Bíceps', tip: 'Trabalha braquial e braquiorradial' },
    { name: 'Rosca Scott', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps', tip: 'Isola o bíceps eliminando impulso' },
    { name: 'Rosca Concentrada', sets: 3, reps: '12-15', rest: '45s', muscle: 'Bíceps', tip: 'Cotovelo apoiado na coxa interna' },
    { name: 'Rosca no Cabo', sets: 3, reps: '12-15', rest: '45s', muscle: 'Bíceps', tip: 'Tensão constante durante todo o arco' },
    { name: 'Rosca Inversa', sets: 3, reps: '10-12', rest: '45s', muscle: 'Bíceps', tip: 'Fortalece antebraço e braquiorradial' },
    { name: 'Rosca 21', sets: 3, reps: '21', rest: '60s', muscle: 'Bíceps', tip: '7 parciais baixas + 7 altas + 7 completas' },
    { name: 'Rosca Spider', sets: 3, reps: '10-12', rest: '45s', muscle: 'Bíceps', tip: 'Banco inclinado, máxima contração' },
    { name: 'Rosca Inclinada com Halteres', sets: 3, reps: '10-12', rest: '60s', muscle: 'Bíceps', tip: 'Maior alongamento da cabeça longa' },
  ],
  triceps: [
    { name: 'Tríceps Pulley', sets: 3, reps: '10-12', rest: '60s', muscle: 'Tríceps', tip: 'Cotovelos fixos, extensão completa' },
    { name: 'Tríceps Testa', sets: 3, reps: '10-12', rest: '60s', muscle: 'Tríceps', tip: 'Barra na testa, cotovelos fixos' },
    { name: 'Tríceps Francês', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps', tip: 'Trabalha a cabeça longa do tríceps' },
    { name: 'Mergulho no Banco', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps', tip: 'Mantenha costas próximas ao banco' },
    { name: 'Tríceps Corda', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps', tip: 'Abra a corda no final do movimento' },
    { name: 'Tríceps Coice', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps', tip: 'Tronco paralelo ao chão, braço fixo' },
    { name: 'Mergulho em Paralelas', sets: 3, reps: '8-12', rest: '90s', muscle: 'Tríceps', tip: 'Tronco ereto para ênfase em tríceps' },
    { name: 'Tríceps Pulley Inverso', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps', tip: 'Pegada supinada, cabeça medial' },
    { name: 'Tríceps no Cross', sets: 3, reps: '12-15', rest: '45s', muscle: 'Tríceps', tip: 'Unilateral para corrigir desequilíbrios' },
    { name: 'Supino Fechado', sets: 3, reps: '8-10', rest: '90s', muscle: 'Tríceps', tip: 'Mãos na largura dos ombros' },
    { name: 'JM Press', sets: 3, reps: '8-12', rest: '60s', muscle: 'Tríceps', tip: 'Híbrido de supino fechado e tríceps testa' },
  ],
  abdomen: [
    { name: 'Abdominal Crunch', sets: 3, reps: '15-20', rest: '30s', muscle: 'Abdômen', tip: 'Não puxe o pescoço, olhe para o teto' },
    { name: 'Prancha', sets: 3, reps: '30-60s', rest: '30s', muscle: 'Abdômen', tip: 'Corpo reto, core contraído, sem arco lombar' },
    { name: 'Elevação de Pernas', sets: 3, reps: '12-15', rest: '30s', muscle: 'Abdômen', tip: 'Costas coladas ao banco/chão' },
    { name: 'Abdominal Bicicleta', sets: 3, reps: '20', rest: '30s', muscle: 'Abdômen', tip: 'Cotovelo ao joelho oposto com rotação' },
    { name: 'Abdominal Infra na Barra', sets: 3, reps: '12-15', rest: '30s', muscle: 'Abdômen', tip: 'Eleve o quadril, não apenas as pernas' },
    { name: 'Prancha Lateral', sets: 3, reps: '30s cada', rest: '30s', muscle: 'Abdômen', tip: 'Quadril alinhado, oblíquos ativados' },
    { name: 'Abdominal na Polia', sets: 3, reps: '12-15', rest: '30s', muscle: 'Abdômen', tip: 'Flexione a coluna, não o quadril' },
    { name: 'Mountain Climber', sets: 3, reps: '20 cada', rest: '30s', muscle: 'Abdômen', tip: 'Ritmo controlado, core estável' },
    { name: 'Russian Twist', sets: 3, reps: '20', rest: '30s', muscle: 'Abdômen', tip: 'Pés elevados para maior dificuldade' },
    { name: 'Abdominal Canivete', sets: 3, reps: '12-15', rest: '30s', muscle: 'Abdômen', tip: 'Toque as pontas dos pés no topo' },
    { name: 'Dead Bug', sets: 3, reps: '10 cada', rest: '30s', muscle: 'Abdômen', tip: 'Lombar colada ao chão, anti-extensão' },
    { name: 'Pallof Press', sets: 3, reps: '10 cada', rest: '30s', muscle: 'Abdômen', tip: 'Anti-rotação, excelente para core funcional' },
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
      return exercises.slice(0, 5).map(e => ({ ...e, sets: Math.max(e.sets - 1, 2) }));
    case 'intermediario':
      return exercises.slice(0, 7);
    case 'avancado':
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
        result.push({ day: dayNames[0], focus: 'Peito + Tríceps', exercises: trimAndPad([...pick('peito').slice(0, 4), ...pick('triceps').slice(0, 3)]) });
        result.push({ day: dayNames[1], focus: 'Quadríceps + Panturrilha', exercises: trimAndPad([...pick('pernas_anterior'), ...pick('abdomen').slice(0, 1)]) });
        result.push({ day: dayNames[3], focus: 'Costas + Bíceps', exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 3)]) });
        result.push({ day: dayNames[4], focus: 'Posterior + Glúteo + Ombros', exercises: trimAndPad([...pick('pernas_posterior').slice(0, 4), ...pick('ombros').slice(0, 2)]) });
      } else {
        result.push({ day: dayNames[0], focus: 'Peito + Tríceps', exercises: trimAndPad([...pick('peito').slice(0, 4), ...pick('triceps').slice(0, 3)]) });
        result.push({ day: dayNames[1], focus: 'Costas + Bíceps', exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 3)]) });
        result.push({ day: dayNames[3], focus: 'Pernas + Abdômen', exercises: trimAndPad([...pick('pernas'), ...pick('abdomen').slice(0, 2)]) });
        result.push({ day: dayNames[4], focus: 'Ombros + Braços', exercises: trimAndPad([...pick('ombros').slice(0, 3), ...pick('biceps').slice(0, 2), ...pick('triceps').slice(0, 2)]) });
      }
    } else if (daysPerWeek === 5) {
      if (useSplitLegs) {
        result.push({ day: dayNames[0], focus: 'Peito', exercises: trimAndPad([...pick('peito'), ...pick('abdomen').slice(0, 1)]) });
        result.push({ day: dayNames[1], focus: 'Quadríceps + Panturrilha', exercises: trimAndPad([...pick('pernas_anterior')]) });
        result.push({ day: dayNames[2], focus: 'Costas + Bíceps', exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 2)]) });
        result.push({ day: dayNames[3], focus: 'Posterior + Glúteo', exercises: trimAndPad([...pick('pernas_posterior'), ...pick('abdomen').slice(0, 1)]) });
        result.push({ day: dayNames[4], focus: 'Ombros + Tríceps', exercises: trimAndPad([...pick('ombros').slice(0, 3), ...pick('triceps').slice(0, 3)]) });
      } else {
        result.push({ day: dayNames[0], focus: 'Peito', exercises: trimAndPad([...pick('peito'), ...pick('abdomen').slice(0, 1)]) });
        result.push({ day: dayNames[1], focus: 'Costas', exercises: trimAndPad([...pick('costas'), ...pick('abdomen').slice(0, 1)]) });
        result.push({ day: dayNames[2], focus: 'Pernas', exercises: trimAndPad(pick('pernas')) });
        result.push({ day: dayNames[3], focus: 'Ombros + Trapézio', exercises: trimAndPad([...pick('ombros'), ...pick('abdomen').slice(0, 2)]) });
        result.push({ day: dayNames[4], focus: 'Braços', exercises: trimAndPad([...pick('biceps'), ...pick('triceps')]) });
      }
    } else {
      // 6 days
      if (useSplitLegs) {
        result.push({ day: dayNames[0], focus: 'Peito + Tríceps', exercises: trimAndPad([...pick('peito').slice(0, 4), ...pick('triceps').slice(0, 3)]) });
        result.push({ day: dayNames[1], focus: 'Quadríceps + Panturrilha', exercises: trimAndPad([...pick('pernas_anterior')]) });
        result.push({ day: dayNames[2], focus: 'Costas + Bíceps', exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 3)]) });
        result.push({ day: dayNames[3], focus: 'Posterior + Glúteo', exercises: trimAndPad([...pick('pernas_posterior')]) });
        result.push({ day: dayNames[4], focus: 'Ombros + Abdômen', exercises: trimAndPad([...pick('ombros'), ...pick('abdomen')]) });
        result.push({ day: dayNames[5], focus: 'Braços + Core', exercises: trimAndPad([...pick('biceps'), ...pick('triceps'), ...pick('abdomen').slice(0, 1)]) });
      } else {
        result.push({ day: dayNames[0], focus: 'Peito + Tríceps', exercises: trimAndPad([...pick('peito').slice(0, 4), ...pick('triceps').slice(0, 3)]) });
        result.push({ day: dayNames[1], focus: 'Costas + Bíceps', exercises: trimAndPad([...pick('costas').slice(0, 4), ...pick('biceps').slice(0, 3)]) });
        result.push({ day: dayNames[2], focus: 'Pernas', exercises: trimAndPad(pick('pernas')) });
        result.push({ day: dayNames[3], focus: 'Ombros + Abdômen', exercises: trimAndPad([...pick('ombros'), ...pick('abdomen')]) });
        result.push({ day: dayNames[4], focus: 'Peito + Costas', exercises: trimAndPad([...pick('peito').slice(0, 3), ...pick('costas').slice(0, 3)]) });
        result.push({ day: dayNames[5], focus: 'Braços + Core', exercises: trimAndPad([...pick('biceps'), ...pick('triceps'), ...pick('abdomen').slice(0, 1)]) });
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
