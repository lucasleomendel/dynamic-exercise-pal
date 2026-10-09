// Bot de respostas sem IA: usado quando os créditos de IA acabam.
// Responde com base na biblioteca de exercícios, métodos de treino e no perfil.
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/lib/workout-generator";

const MUSCLES: Record<string, string[]> = {
  peito: ["peito", "peitoral", "supino"],
  costas: ["costas", "dorsal", "remada", "puxada"],
  ombros: ["ombro", "deltoide"],
  biceps: ["biceps", "bíceps", "rosca"],
  triceps: ["triceps", "tríceps"],
  quadriceps: ["quadriceps", "quadríceps", "coxa", "agachamento"],
  posterior: ["posterior", "isquio"],
  gluteos: ["gluteo", "glúteo", "bumbum"],
  panturrilha: ["panturrilha"],
  abdomen: ["abdomen", "abdômen", "abdominal", "core"],
  antebraco: ["antebraco", "antebraço"],
  trapezio: ["trapezio", "trapézio"],
  lombar: ["lombar"],
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function findMuscle(text: string): string | null {
  const t = norm(text);
  for (const [key, words] of Object.entries(MUSCLES)) {
    if (words.some(w => t.includes(norm(w)))) return key;
  }
  return null;
}

async function exercisesFor(muscle: string, level?: string) {
  const q = supabase.from("exercise_library")
    .select("name,equipment,difficulty,default_sets,default_reps,default_rest,technique_tip")
    .eq("active", true).eq("muscle_group", muscle).limit(40);
  const { data } = await q;
  const list = data ?? [];
  const lvl = level ? norm(level) : "";
  const filtered = lvl ? list.filter(e => !e.difficulty || norm(e.difficulty).startsWith(lvl.slice(0, 5))) : list;
  return (filtered.length >= 4 ? filtered : list).slice(0, 6);
}

function macros(p?: UserProfile) {
  const w = Number((p as any)?.weight) || 0;
  const h = Number((p as any)?.height) || 0;
  const a = Number((p as any)?.age) || 0;
  if (!w || !h || !a) return null;
  const male = norm(String((p as any)?.sex ?? "")).startsWith("m");
  const bmr = 10 * w + 6.25 * h - 5 * a + (male ? 5 : -161);
  const tdee = Math.round(bmr * 1.55);
  const goal = norm(String((p as any)?.goal ?? ""));
  const kcal = goal.includes("emag") || goal.includes("cut") || goal.includes("perd") ? tdee - 400
    : goal.includes("massa") || goal.includes("hiper") || goal.includes("bulk") ? tdee + 300 : tdee;
  const prot = Math.round(w * 2);
  const fat = Math.round(w * 0.9);
  const carb = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4));
  return { tdee, kcal, prot, fat, carb, water: Math.round(w * 35) };
}

export async function offlineReply(text: string, profile?: UserProfile): Promise<string> {
  const t = norm(text);
  const note = "\n\n_Modo bot ativo: o assistente de IA está temporariamente indisponível._";

  // Métodos de treino
  if (/(metodo|drop|myo|rest.?paus|bfr|volume|intensidade)/.test(t)) {
    const { data } = await supabase.from("training_methods")
      .select("name,short_description,recommended_for").eq("active", true);
    const hit = (data ?? []).filter(m => t.includes(norm(m.name).split(/[\s-]/)[0]));
    const list = hit.length ? hit : data ?? [];
    if (list.length) {
      return "**Métodos de treino**\n\n" + list.map(m =>
        `- **${m.name}** — ${m.short_description}${m.recommended_for ? ` _(indicado: ${m.recommended_for})_` : ""}`
      ).join("\n") + note;
    }
  }

  // Exercícios por grupo muscular
  const muscle = findMuscle(text);
  if (muscle) {
    const list = await exercisesFor(muscle, (profile as any)?.level);
    if (list.length) {
      return `**Exercícios para ${muscle}**\n\n` + list.map(e =>
        `- **${e.name}**${e.equipment ? ` (${e.equipment})` : ""} — ${e.default_sets ?? 3}x${e.default_reps ?? "8-12"}, descanso ${e.default_rest ?? "60-90s"}${e.technique_tip ? `\n  _Dica: ${e.technique_tip}_` : ""}`
      ).join("\n") + "\n\nVeja fotos e detalhes na **Biblioteca de exercícios**." + note;
    }
  }

  // Dieta / macros / água
  if (/(dieta|macro|caloria|proteina|carbo|cutting|bulking|agua|hidrat)/.test(t)) {
    const m = macros(profile);
    if (m) {
      return `**Sua estimativa diária**\n\n- Gasto total: ~${m.tdee} kcal\n- Meta: **${m.kcal} kcal**\n- Proteína: ${m.prot} g · Gordura: ${m.fat} g · Carboidrato: ${m.carb} g\n- Água: ~${m.water} ml (+500 ml por hora de treino)\n\nMonte o cardápio completo no **Planejador de dieta**.` + note;
    }
    return "Para calcular sua dieta, preencha peso, altura, idade e sexo no seu perfil. Depois use o **Planejador de dieta**." + note;
  }

  if (/(sono|dormir|descanso)/.test(t)) {
    return "**Sono e recuperação**\n\n- Durma 7 a 9 horas por noite\n- Horários regulares, quarto escuro e fresco\n- Evite telas e cafeína nas 6 horas antes de dormir\n- Respeite 48h entre treinos do mesmo músculo" + note;
  }

  if (/(massa|hipertrofia|ganhar)/.test(t)) {
    return "**Ganho de massa muscular**\n\n- Treine cada músculo 2x por semana, 10 a 20 séries semanais\n- Aumente carga ou repetições aos poucos (progressão)\n- Proteína: 1,6 a 2,2 g por kg de peso\n- Leve superávit calórico (+300 kcal)\n- Durma bem" + note;
  }

  return "No momento estou no **modo bot** e respondo sobre:\n\n- Exercícios por músculo (ex.: \"exercícios para peito\")\n- Métodos de treino (drop-set, myo-reps, BFR...)\n- Dieta, macros e água\n- Ganho de massa e sono\n\nVocê também pode gerar seu treino pelo botão de plano automático." + note;
}
