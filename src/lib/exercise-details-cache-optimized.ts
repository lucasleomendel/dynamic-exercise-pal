/**
 * Optimized exercise details cache with memory management
 * - Memory: LRU cache (max 100 items) + TTL (7 days)
 * - Storage: localStorage with compression indicator
 * - Network: Deduped fetch + batch preload
 */

import { supabase } from "@/integrations/supabase/client";

export interface ExerciseDetail {
  description: string | null;
  steps: string[] | null;
}

const MAX_MEM_CACHE = 100;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const STORAGE_KEY = "exercise-details-cache-v2";

class LRUCache<K, V> {
  private map = new Map<K, { value: V; timestamp: number }>();
  private max: number;

  constructor(max: number) {
    this.max = max;
  }

  get(key: K): V | undefined {
    const item = this.map.get(key);
    if (!item) return undefined;

    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, item);
    return item.value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, { value, timestamp: Date.now() });

    // Evict oldest if over capacity
    if (this.map.size > this.max) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
  }

  clear(): void {
    this.map.clear();
  }
}

const MEM = new LRUCache<string, ExerciseDetail>(MAX_MEM_CACHE);

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

function writeStorage(store: Persisted): void {
  try {
    // Cleanup expired entries before writing
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (now - store[key].t > TTL_MS) {
        delete store[key];
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota exceeded — clear and ignore
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

function getFromStorage(id: string): ExerciseDetail | null {
  const store = readStorage();
  const entry = store[id];
  if (!entry) return null;
  if (Date.now() - entry.t > TTL_MS) {
    delete store[id];
    writeStorage(store);
    return null;
  }
  return entry.d;
}

function saveToStorage(id: string, detail: ExerciseDetail): void {
  const store = readStorage();
  store[id] = { d: detail, t: Date.now() };
  writeStorage(store);
}

// Deduped fetch in-flight
const inflightRequests = new Map<string, Promise<ExerciseDetail>>();

/**
 * Get exercise details with 3-level cache (memory → storage → network)
 */
export async function getExerciseDetails(id: string): Promise<ExerciseDetail> {
  // Level 1: Memory
  const mem = MEM.get(id);
  if (mem) return mem;

  // Level 2: Storage
  const persisted = getFromStorage(id);
  if (persisted) {
    MEM.set(id, persisted);
    return persisted;
  }

  // Level 3: Network (dedupe in-flight)
  if (inflightRequests.has(id)) {
    return inflightRequests.get(id)!;
  }

  const fetchPromise = supabase
    .from("exercise_library")
    .select("description,steps")
    .eq("id", id)
    .maybeSingle()
    .then(({ data }) => {
      const detail: ExerciseDetail = {
        description: data?.description ?? null,
        steps: (data?.steps as string[] | null) ?? null,
      };
      MEM.set(id, detail);
      saveToStorage(id, detail);
      inflightRequests.delete(id);
      return detail;
    })
    .catch((e) => {
      inflightRequests.delete(id);
      console.warn(`Failed to fetch exercise ${id}`, e);
      return { description: null, steps: null };
    });

  inflightRequests.set(id, fetchPromise);
  return fetchPromise;
}

/**
 * Prime cache with known details (batch preload)
 */
export function primeExerciseDetails(id: string, detail: ExerciseDetail): void {
  if (detail.description || (detail.steps && detail.steps.length > 0)) {
    MEM.set(id, detail);
    saveToStorage(id, detail);
  }
}

/**
 * Batch preload multiple exercises
 */
export function batchPrimeExerciseDetails(
  exercises: Array<{ id: string; description?: string | null; steps?: string[] | null }>
): void {
  exercises.forEach((ex) => {
    if (ex.description || (ex.steps && ex.steps.length > 0)) {
      primeExerciseDetails(ex.id, {
        description: ex.description ?? null,
        steps: ex.steps ?? null,
      });
    }
  });
}

/**
 * Clear cache (for testing or manual reset)
 */
export function clearCache(): void {
  MEM.clear();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): {
  memorySize: number;
  storageSize: number;
} {
  const store = readStorage();
  const storageSize = Object.keys(store).length;
  return {
    memorySize: MAX_MEM_CACHE,
    storageSize,
  };
}
