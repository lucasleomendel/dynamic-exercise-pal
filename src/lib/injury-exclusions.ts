export const INJURY_AREAS = [
  "ombro",
  "joelho",
  "lombar",
  "punho",
  "cotovelo",
  "quadril",
  "tornozelo",
] as const;

export type InjuryArea = typeof INJURY_AREAS[number];

/**
 * Shared by the local workout generator and the smart-plan Edge Function.
 * Keep these conservative exclusions in one place so AI-generated plans
 * cannot silently bypass restrictions enforced by the client.
 */
export const INJURY_EXCLUSION_RULES: Record<InjuryArea, readonly string[]> = {
  ombro: [
    "Desenvolvimento", "Arnold", "Militar", "Elevação Frontal",
    "Elevação Lateral", "Remada Alta", "Mergulho", "Flexão",
    "Supino", "Crossover", "Pullover", "Face Pull", "Y-Raise",
    "Crucifixo Inverso",
  ],
  joelho: [
    "Agachamento", "Leg Press", "Extensora", "Hack", "Avanço",
    "Passada", "Búlgaro", "Sissy", "Panturrilha no Leg Press",
  ],
  lombar: [
    "Levantamento Terra", "Remada Curvada", "Stiff", "Good Morning",
    "Agachamento Livre", "Agachamento Frontal", "Agachamento Sumô",
    "Avanço", "Passada", "Agachamento Búlgaro",
  ],
  punho: [
    "Supino Reto com Barra", "Supino Declinado",
    "Supino Inclinado com Halteres", "Supino Reto com Halteres",
    "Flexão de Braço", "Flexão Diamante", "Rosca Direta com Barra",
    "Rosca Inversa", "Tríceps Testa", "Mergulho",
  ],
  cotovelo: [
    "Rosca Direta", "Rosca Alternada", "Rosca Martelo", "Rosca Scott",
    "Rosca Concentrada", "Rosca no Cabo", "Rosca Inversa", "Rosca 21",
    "Rosca Spider", "Rosca Inclinada", "Tríceps Pulley", "Tríceps Testa",
    "Tríceps Francês", "Tríceps Corda", "Tríceps Coice", "Mergulho",
    "Supino", "Flexão", "Crossover", "Pullover", "Chest Press",
    "JM Press", "Tríceps no Cross",
  ],
  quadril: [
    "Agachamento", "Leg Press", "Avanço", "Passada", "Búlgaro", "Stiff",
    "Good Morning", "Elevação Pélvica", "Abdução de Quadril",
    "Glúteo no Cabo", "Extensão de Quadril", "Nordic Curl",
  ],
  tornozelo: [
    "Agachamento", "Leg Press", "Avanço", "Passada", "Búlgaro",
    "Sissy", "Panturrilha", "Mountain Climber",
  ],
};

function normalizeExerciseName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isExerciseRestrictedByInjury(
  name: string,
  injuries: readonly unknown[],
): boolean {
  const normalizedName = normalizeExerciseName(name);

  return injuries.some((injury) => {
    if (
      typeof injury !== "string" ||
      !(INJURY_AREAS as readonly string[]).includes(injury)
    ) {
      return false;
    }

    return INJURY_EXCLUSION_RULES[injury as InjuryArea].some((keyword) =>
      normalizedName.includes(normalizeExerciseName(keyword))
    );
  });
}
