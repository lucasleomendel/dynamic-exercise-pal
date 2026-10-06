export const ALL_MUSCLE_GROUPS = ['peito', 'costas', 'pernas', 'ombros', 'biceps', 'triceps', 'abdomen'] as const;
export type MuscleGroup = typeof ALL_MUSCLE_GROUPS[number];

export const INJURY_AREAS = ['ombro', 'joelho', 'lombar', 'punho', 'cotovelo', 'quadril', 'tornozelo'] as const;
export type InjuryArea = typeof INJURY_AREAS[number];

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
  injuries?: InjuryArea[];
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

export function validateUserProfile(profile: Partial<UserProfile>): string[] {
  const errors: string[] = [];
  const name = typeof profile.name === "string" ? profile.name.trim() : "";
  if (name.length < 2 || name.length > 80) errors.push("Nome deve ter entre 2 e 80 caracteres.");
  if (!Number.isFinite(profile.age) || (profile.age as number) < 13 || (profile.age as number) > 100) errors.push("Idade deve estar entre 13 e 100 anos.");
  if (!Number.isFinite(profile.weight) || (profile.weight as number) < 25 || (profile.weight as number) > 350) errors.push("Peso deve estar entre 25 e 350 kg.");
  if (!Number.isFinite(profile.height) || (profile.height as number) < 120 || (profile.height as number) > 230) errors.push("Altura deve estar entre 120 e 230 cm.");
  if (!["masculino", "feminino"].includes(profile.sex ?? "")) errors.push("Sexo inválido.");
  if (!["hipertrofia", "emagrecimento", "resistencia", "forca"].includes(profile.goal ?? "")) errors.push("Objetivo inválido.");
  if (!["iniciante", "intermediario", "avancado"].includes(profile.level ?? "")) errors.push("Nível inválido.");
  if (!Number.isInteger(profile.daysPerWeek) || (profile.daysPerWeek as number) < 2 || (profile.daysPerWeek as number) > 6) errors.push("Frequência deve estar entre 2 e 6 dias por semana.");
  if (![0.5, 0.75, 1, 1.5].includes(profile.hoursPerSession as number)) errors.push("Duração de sessão inválida.");
  if (profile.selectedMuscles && (profile.selectedMuscles.length < 2 || profile.selectedMuscles.some(m => !ALL_MUSCLE_GROUPS.includes(m)))) errors.push("Seleção muscular inválida.");
  if (profile.injuries && profile.injuries.some(injury => !INJURY_AREAS.includes(injury))) errors.push("Restrição física inválida.");
  return errors;
}

export function normalizeUserProfile(profile: UserProfile): UserProfile {
  const normalized: UserProfile = {
    ...profile,
    name: profile.name.trim(),
    age: Math.round(profile.age),
    weight: Number(profile.weight),
    height: Number(profile.height),
    daysPerWeek: Math.round(profile.daysPerWeek),
    hoursPerSession: Number(profile.hoursPerSession),
    selectedMuscles: profile.selectedMuscles?.filter(m => ALL_MUSCLE_GROUPS.includes(m)) ?? [...ALL_MUSCLE_GROUPS],
    splitLegs: Boolean(profile.splitLegs),
    injuries: profile.injuries?.filter(injury => INJURY_AREAS.includes(injury)) ?? [],
  };
  const errors = validateUserProfile(normalized);
  if (errors.length) throw new Error(errors.join(" "));
  return normalized;
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

const COMPOUND_EXERCISE_HINTS = [
  'Supino', 'Agachamento', 'Leg Press', 'Avanço', 'Passada', 'Stiff', 'Levantamento Terra',
  'Remada', 'Puxada', 'Barra Fixa', 'Desenvolvimento', 'Mergulho em Paralelas', 'Supino Fechado',
  'Elevação Pélvica', 'Hip Thrust', 'Good Morning', 'Nordic Curl', 'Agachamento Hack',
  'Agachamento Búlgaro', 'Agachamento Sumô'
];

function isCompoundExercise(exercise: Exercise): boolean {
  return COMPOUND_EXERCISE_HINTS.some(hint => exercise.name.includes(hint));
}

function adjustForGoal(exercises: Exercise[], goal: string): Exercise[] {
  return exercises.map(ex => {
    const e = { ...ex };
    const compound = isCompoundExercise(e);

    switch (goal) {
      case 'hipertrofia':
        e.sets = compound ? Math.min(Math.max(e.sets, 3), 4) : Math.min(Math.max(e.sets, 2), 3);
        e.reps = compound ? '6-10' : '10-15';
        e.rest = compound ? '120s' : '60s';
        break;
      case 'emagrecimento':
        e.sets = Math.min(Math.max(e.sets - 1, 2), 3);
        e.reps = compound ? '8-12' : '10-15';
        e.rest = compound ? '90s' : '45s';
        break;
      case 'resistencia':
        e.sets = Math.min(Math.max(e.sets - 1, 2), 3);
        e.reps = compound ? '12-20' : '15-25';
        e.rest = compound ? '60s' : '30s';
        break;
      case 'forca':
        e.sets = compound ? Math.min(Math.max(e.sets, 3), 5) : Math.min(Math.max(e.sets, 2), 3);
        e.reps = compound ? '3-6' : '6-10';
        e.rest = compound ? '180s' : '90s';
        break;
    }
    return e;
  });
}

function adjustForLevel(exercises: Exercise[], level: string): Exercise[] {
  switch (level) {
    case 'iniciante':
      return exercises.slice(0, 5).map(e => ({
        ...e,
        sets: Math.max(Math.min(e.sets - 1, 3), 2),
        rest: isCompoundExercise(e)
          ? (e.rest === '30s' || e.rest === '45s' ? '60s' : e.rest)
          : e.rest,
      }));
    case 'intermediario':
      return exercises.slice(0, 7).map(e => ({ ...e }));
    case 'avancado':
      return exercises.slice(0, 8).map(e => ({
        ...e,
        sets: Math.min(e.sets + (isCompoundExercise(e) ? 1 : 0), 5),
      }));
    default:
      return exercises;
  }
}

const INJURY_EXCLUSION_RULES: Record<InjuryArea, string[]> = {
  ombro: ['Desenvolvimento', 'Arnold', 'Militar', 'Elevação Frontal', 'Elevação Lateral', 'Remada Alta', 'Mergulho', 'Flexão Diamante', 'Face Pull', 'Y-Raise', 'Crucifixo Inverso'],
  joelho: ['Agachamento', 'Leg Press', 'Extensora', 'Hack', 'Avanço', 'Passada', 'Búlgaro', 'Sissy', 'Panturrilha no Leg Press'],
  lombar: ['Levantamento Terra', 'Remada Curvada', 'Stiff', 'Good Morning', 'Agachamento Livre', 'Agachamento Frontal', 'Agachamento Sumô', 'Avanço', 'Passada', 'Agachamento Búlgaro'],
  punho: ['Supino Reto com Barra', 'Supino Declinado', 'Supino Inclinado com Halteres', 'Supino Reto com Halteres', 'Flexão de Braço', 'Flexão Diamante', 'Rosca Direta com Barra', 'Rosca Inversa', 'Tríceps Testa', 'Mergulho'],
  cotovelo: ['Rosca Direta', 'Rosca Alternada', 'Rosca Martelo', 'Rosca Scott', 'Rosca Concentrada', 'Rosca no Cabo', 'Rosca Inversa', 'Rosca 21', 'Rosca Spider', 'Rosca Inclinada', 'Tríceps Pulley', 'Tríceps Testa', 'Tríceps Francês', 'Tríceps Corda', 'Tríceps Coice', 'Mergulho', 'Supino Fechado', 'JM Press'],
  quadril: ['Agachamento', 'Leg Press', 'Avanço', 'Passada', 'Búlgaro', 'Stiff', 'Good Morning', 'Elevação Pélvica', 'Abdução de Quadril', 'Glúteo no Cabo', 'Extensão de Quadril', 'Nordic Curl'],
  tornozelo: ['Agachamento', 'Leg Press', 'Avanço', 'Passada', 'Búlgaro', 'Sissy', 'Panturrilha', 'Mountain Climber'],
};

function isExerciseRestricted(exercise: Exercise, injuries: InjuryArea[]): boolean {
  return injuries.some(injury =>
    INJURY_EXCLUSION_RULES[injury].some(keyword => exercise.name.includes(keyword))
  );
}

export function generateWorkout(profile: UserProfile): WorkoutPlan {
  const safeProfile = normalizeUserProfile(profile);
  const { goal, level, daysPerWeek, hoursPerSession, selectedMuscles, splitLegs, injuries = [] } = safeProfile;
  const allowed = selectedMuscles && selectedMuscles.length >= 2
    ? [...selectedMuscles]
    : [...ALL_MUSCLE_GROUPS];

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

  const adjusted = (group: string): Exercise[] =>
    adjustForLevel(adjustForGoal(exerciseDatabase[group] || [], goal), level)
      .filter(exercise => !isExerciseRestricted(exercise, injuries));

  const pick = (group: string): Exercise[] => {
    if (group === 'pernas_anterior' || group === 'pernas_posterior') {
      return allowed.includes('pernas') ? adjusted(group) : [];
    }
    return allowed.includes(group as MuscleGroup) ? adjusted(group) : [];
  };

  const parseSeconds = (rest: string): number => {
    const match = rest.match(/(\d+)s/);
    return match ? Number(match[1]) : 60;
  };

  // Estimativa conservadora: tempo das séries + descanso entre séries.
  // Ela é usada para impedir que o gerador coloque mais volume do que cabe
  // razoavelmente na duração escolhida pelo usuário.
  const estimateExerciseMinutes = (exercise: Exercise): number => {
    const restMinutes = (parseSeconds(exercise.rest) * Math.max(exercise.sets - 1, 0)) / 60;
    const executionMinutesPerSet = isCompoundExercise(exercise) ? 0.85 : 0.65;
    const setMinutes = exercise.sets * executionMinutesPerSet;
    const setupMinutes = isCompoundExercise(exercise) ? 1 : 0.75;
    return setMinutes + restMinutes + setupMinutes;
  };

  const fitToSession = (exercises: Exercise[]): Exercise[] => {
    const budget = hoursPerSession * 60;
    const result: Exercise[] = [];
    let minutes = 0;

    for (const exercise of exercises) {
      if (result.length >= 8) break;
      const cost = estimateExerciseMinutes(exercise);

      // Prioriza o limite de tempo informado pelo usuário. Um único
      // exercício pode ultrapassar o orçamento se, sozinho, já exigir mais
      // tempo do que a sessão, mas não adicionamos um segundo exercício
      // quando ele faria a sessão ultrapassar o limite.
      if (result.length === 0 || minutes + cost <= budget) {
        result.push(exercise);
        minutes += cost;
      }
    }

    return result.filter((exercise, index, list) =>
      list.findIndex(item => item.name === exercise.name) === index
    );
  };

  const fillFromAllowed = (exercises: Exercise[], groups: string[]): Exercise[] => {
    const result = [...exercises];
    const used = new Set(result.map(exercise => exercise.name));

    for (const group of groups) {
      if (result.length >= 8) break;
      for (const exercise of pick(group)) {
        if (used.has(exercise.name)) continue;
        result.push(exercise);
        used.add(exercise.name);
        if (result.length >= 8) break;
      }
    }

    return result;
  };

  const trimAndPad = (exercises: Exercise[], fallbackGroups: string[]): Exercise[] => {
    const unique = exercises.filter((exercise, index, list) =>
      list.findIndex(item => item.name === exercise.name) === index
    );

    const padded = fillFromAllowed(unique, fallbackGroups);
    const fitted = fitToSession(padded);

    // Não força um número mínimo artificial de exercícios: respeitar o
    // tempo escolhido é mais importante do que preencher a sessão com volume
    // que não cabe nela.
    return fitted.length > 0 ? fitted : padded.slice(0, 1);
  };

  const groupsForGeneralDays = [...allowed];

  const templates: string[][] = (() => {
    if (daysPerWeek === 2) {
      return [
        ['peito', 'costas', 'ombros', 'biceps', 'triceps'],
        ['pernas', 'abdomen', 'peito', 'costas'],
      ];
    }

    if (daysPerWeek === 3) {
      return [
        ['peito', 'ombros', 'triceps'],
        ['costas', 'biceps'],
        ['pernas', 'abdomen'],
      ];
    }

    if (daysPerWeek === 4) {
      if (splitLegs && allowed.includes('pernas')) {
        return [
          ['peito', 'triceps'],
          ['pernas_anterior', 'abdomen'],
          ['costas', 'biceps'],
          ['pernas_posterior', 'ombros'],
        ];
      }
      return [
        ['peito', 'triceps'],
        ['costas', 'biceps'],
        ['pernas', 'abdomen'],
        ['ombros', 'biceps', 'triceps'],
      ];
    }

    if (daysPerWeek === 5) {
      if (splitLegs && allowed.includes('pernas')) {
        return [
          ['peito', 'abdomen'],
          ['pernas_anterior'],
          ['costas', 'biceps'],
          ['pernas_posterior', 'abdomen'],
          ['ombros', 'triceps'],
        ];
      }
      return [
        ['peito', 'abdomen'],
        ['costas', 'abdomen'],
        ['pernas'],
        ['ombros', 'abdomen'],
        ['biceps', 'triceps'],
      ];
    }

    if (splitLegs && allowed.includes('pernas')) {
      return [
        ['peito', 'triceps'],
        ['pernas_anterior'],
        ['costas', 'biceps'],
        ['pernas_posterior'],
        ['ombros', 'abdomen'],
        ['biceps', 'triceps', 'abdomen'],
      ];
    }

    return [
      ['peito', 'triceps'],
      ['costas', 'biceps'],
      ['pernas'],
      ['ombros', 'abdomen'],
      ['peito', 'costas'],
      ['biceps', 'triceps', 'abdomen'],
    ];
  })();

  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Filtra os templates pelos grupos realmente escolhidos. Isso evita, por
  // exemplo, que alguém que escolheu apenas peito + costas receba pernas.
  const buildDayExercises = (template: string[], dayIndex: number): Exercise[] => {
    const selectedTemplate = template.filter(group =>
      allowed.includes(group as MuscleGroup) ||
      ((group === 'pernas_anterior' || group === 'pernas_posterior') && allowed.includes('pernas'))
    );

    const fallback = groupsForGeneralDays.filter(group => !selectedTemplate.includes(group));
    const primary = selectedTemplate.flatMap(group => pick(group).slice(0, 4));

    // Se o template ficou vazio por causa das restrições do usuário,
    // distribui os grupos permitidos de forma determinística.
    if (primary.length === 0) {
      const group = groupsForGeneralDays[dayIndex % groupsForGeneralDays.length];
      return trimAndPad(pick(group).slice(0, 4), groupsForGeneralDays);
    }

    return trimAndPad(primary, [...selectedTemplate, ...fallback]);
  };

  const result: WorkoutDay[] = templates.map((template, index) => ({
    day: dayNames[index],
    focus: template.join(' + '),
    exercises: buildDayExercises(template, index),
  }));

  // Garante que todo grupo selecionado apareça ao menos uma vez na semana.
  // Isso corrige cenários como 4 dias + somente peito/costas, nos quais os
  // templates padrão poderiam deixar dias sem exercícios.
  const represented = new Set<string>();
  result.forEach(day => day.exercises.forEach(exercise => {
    const group = ALL_MUSCLE_GROUPS.find(candidate =>
      exerciseDatabase[candidate]?.some(item => item.name === exercise.name) ||
      (candidate === 'pernas' && ['pernas_anterior', 'pernas_posterior'].some(part =>
        exerciseDatabase[part]?.some(item => item.name === exercise.name)
      ))
    );
    if (group) represented.add(group);
  });

  const missing = allowed.filter(group => !represented.has(group));
  missing.forEach((group, index) => {
    const target = result[index % result.length];
    const additions = pick(group).slice(0, 2);
    target.exercises = trimAndPad([...target.exercises, ...additions], [group, ...allowed]);
  });

  const days = result.map(day => {
    const muscles = [...new Set(day.exercises.map(ex => ex.muscle).filter(Boolean))];
    return {
      ...day,
      // O foco exibido é derivado dos exercícios reais, nunca de um template
      // que possa ter sido parcialmente removido pelas preferências do usuário.
      focus: muscles.length > 0 ? muscles.slice(0, 4).join(' + ') : 'Treino personalizado',
    };
  });

  const timeLabel = hoursPerSession < 1
    ? `${Math.round(hoursPerSession * 60)}min`
    : `${hoursPerSession}h`;

  const injuryNote = injuries.length > 0
    ? ' Exercícios incompatíveis com as restrições informadas foram excluídos automaticamente; em caso de dor ou condição clínica, confirme a seleção com um profissional de saúde ou educação física.'
    : '';

  return {
    title: `Treino ${goalLabels[goal]} - ${levelLabels[level]}`,
    description: `Plano personalizado para ${safeProfile.name}. ${days.length}x por semana, sessões de ~${timeLabel}.${injuryNote}`,
    daysPerWeek: days.length,
    days,
  };
}
