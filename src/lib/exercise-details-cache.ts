// Cache local para descrição e passos dos exercícios.
// Camada 1: Map em memória (instantâneo dentro da sessão).
// Camada 2: localStorage com TTL (persiste entre reloads).

import { supabase } from "@/integrations/supabase/client";

export interface ExerciseDetail {
  description: string | null;
  steps: string[] | null;
}

const MEM = new Map<string, ExerciseDetail>();
const STORAGE_KEY = "exercise-details-cache-v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface Persisted {
  [id: string]: { d: ExerciseDetail; t: number };
}

function readStorage(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : {};
  } catch {
    return {};
  }
}

function writeStorage(store: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota exceeded — limpa e ignora
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }
}

function getFromStorage(id: string): ExerciseDetail | null {
  const store = readStorage();
  const entry = store[id];
  if (!entry) return null;
  if (Date.now() - entry.t > TTL_MS) return null;
  return entry.d;
}

function saveToStorage(id: string, detail: ExerciseDetail) {
  const store = readStorage();
  store[id] = { d: detail, t: Date.now() };
  writeStorage(store);
}

/** Retorna detalhes com cache (mem → localStorage → rede). */
export async function getExerciseDetails(id: string): Promise<ExerciseDetail> {
  const mem = MEM.get(id);
  if (mem) return mem;

  const persisted = getFromStorage(id);
  if (persisted) {
    MEM.set(id, persisted);
    return persisted;
  }

  const { data } = await supabase
    .from("exercise_library")
    .select("description,steps")
    .eq("id", id)
    .maybeSingle();

  const detail: ExerciseDetail = {
    description: data?.description ?? null,
    steps: (data?.steps as string[] | null) ?? null,
  };
  MEM.set(id, detail);
  saveToStorage(id, detail);
  return detail;
}

/** Pré-injeta detalhes já conhecidos (ex.: quando o item da lista já os contém). */
export function primeExerciseDetails(id: string, detail: ExerciseDetail) {
  if (detail.description || (detail.steps && detail.steps.length > 0)) {
    MEM.set(id, detail);
    saveToStorage(id, detail);
  }
}
