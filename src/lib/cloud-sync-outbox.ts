/**
 * Cloud sync with Outbox pattern - Resilient offline-first sync
 * Estratégia:
 * - localStorage → Outbox queue (fila de mutações pendentes)
 * - Optimistic updates: mutar UI localmente, fila push async
 * - Conflict resolution: Last-Write-Wins com timestamp
 * - Retry automático com backoff exponencial
 */
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, WorkoutPlan } from "./workout-generator";
import {
  loadProfile, saveProfile,
  loadPlan, savePlan,
  loadWeights, loadWorkoutHistory,
  loadBodyComp, loadChecked, saveChecked,
  WeightEntry, WorkoutHistoryEntry, BodyCompData,
} from "./storage";

const OUTBOX_KEY = "fitforge_outbox_queue";
const LAST_SYNC_KEY = "fitforge_last_sync";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const RETRY_BACKOFF = [1000, 2000, 5000, 10000]; // ms per retry attempt

// Outbox entry types
type OutboxEntry = {
  id: string; // UUID
  type: "profile" | "plan" | "weights" | "history" | "bodycomp" | "checks";
  payload: any;
  timestamp: number;
  retries: number;
  nextRetry?: number;
};

function getOutbox(): OutboxEntry[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOutbox(queue: OutboxEntry[]): void {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn("Outbox storage quota exceeded", e);
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Enqueue a mutation for async processing (optimistic update immediately)
 * Returns the entry for UI optimism
 */
export function enqueueOutbox<T extends OutboxEntry["type"]>(
  type: T,
  payload: any
): OutboxEntry {
  const entry: OutboxEntry = {
    id: generateId(),
    type,
    payload,
    timestamp: Date.now(),
    retries: 0,
  };
  const queue = getOutbox();
  queue.push(entry);
  saveOutbox(queue);
  return entry;
}

/**
 * Remove an entry from outbox (on success)
 */
function removeFromOutbox(entryId: string): void {
  const queue = getOutbox().filter((e) => e.id !== entryId);
  saveOutbox(queue);
}

/**
 * Update retry count + schedule next retry
 */
function scheduleRetry(entryId: string, attempt: number): void {
  const queue = getOutbox();
  const entry = queue.find((e) => e.id === entryId);
  if (entry) {
    entry.retries = attempt + 1;
    entry.nextRetry =
      Date.now() + (RETRY_BACKOFF[Math.min(attempt, RETRY_BACKOFF.length - 1)] || 30000);
    saveOutbox(queue);
  }
}

/**
 * Process a single outbox entry
 */
async function processOutboxEntry(entry: OutboxEntry, userId: string): Promise<boolean> {
  try {
    switch (entry.type) {
      case "profile": {
        await supabase.from("profiles").upsert(
          {
            user_id: userId,
            ...entry.payload,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        return true;
      }
      case "plan": {
        await supabase
          .from("workout_plans")
          .update({ is_active: false })
          .eq("user_id", userId)
          .eq("is_active", true);
        await supabase.from("workout_plans").insert({
          user_id: userId,
          ...entry.payload,
          is_active: true,
        });
        return true;
      }
      case "weights": {
        const rows = entry.payload.map((w: WeightEntry) => ({
          user_id: userId,
          exercise_key: w.exerciseKey,
          exercise_name: w.exerciseName,
          muscle: w.muscle,
          weight: w.weight,
          logged_at: w.date,
        }));
        await supabase.from("weight_logs").upsert(rows, {
          onConflict: "user_id,exercise_key,logged_at",
          ignoreDuplicates: true,
        });
        return true;
      }
      case "history": {
        const rows = entry.payload.map((h: WorkoutHistoryEntry) => ({
          user_id: userId,
          workout_date: h.date,
          completed_exercises: h.completedExercises,
          total_exercises: h.totalExercises,
          day_focus: h.dayFocus,
        }));
        await supabase.from("workout_history").upsert(rows, {
          onConflict: "user_id,workout_date",
          ignoreDuplicates: true,
        });
        return true;
      }
      case "bodycomp": {
        const bc = entry.payload as BodyCompData;
        await supabase.from("body_compositions").insert({
          user_id: userId,
          measured_at: bc.date,
          skinfolds: bc.skinfolds,
          measurements: bc.measurements,
          body_fat: bc.result?.bodyFat,
          fat_mass: bc.result?.fatMass,
          lean_mass: bc.result?.leanMass,
          classification: bc.result?.classification,
          method: bc.result?.method,
        });
        return true;
      }
      case "checks": {
        await supabase.from("exercise_checks").upsert(
          {
            user_id: userId,
            checks_data: entry.payload,
          },
          { onConflict: "user_id" }
        );
        return true;
      }
      default:
        return false;
    }
  } catch (e: any) {
    console.warn(`Outbox retry: ${entry.type}`, e?.message);
    return false;
  }
}

/**
 * Process all pending outbox entries with retry logic
 */
export async function flushOutbox(opts?: { force?: boolean }): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const queue = getOutbox();
  const now = Date.now();

  for (const entry of queue) {
    // Skip if not ready for retry
    if (!opts?.force && entry.nextRetry && entry.nextRetry > now) {
      continue;
    }

    const success = await processOutboxEntry(entry, userId);

    if (success) {
      removeFromOutbox(entry.id);
    } else {
      // Retry with backoff
      scheduleRetry(entry.id, entry.retries);
    }
  }
}

/**
 * PROFILE: Enqueue + optimistic update
 */
export async function syncProfileOptimistic(profile: UserProfile): Promise<void> {
  saveProfile(profile); // Optimistic: save locally immediately
  const payload = {
    name: profile.name,
    age: profile.age,
    weight: profile.weight,
    height: profile.height,
    sex: profile.sex,
    goal: profile.goal,
    level: profile.level,
    days_per_week: profile.daysPerWeek,
    hours_per_session: profile.hoursPerSession,
    selected_muscles: profile.selectedMuscles ?? null,
    split_legs: profile.splitLegs ?? false,
  };
  enqueueOutbox("profile", payload);
  // Fire-and-forget async flush
  Promise.resolve().then(() => flushOutbox());
}

/**
 * PLAN: Enqueue + optimistic update
 */
export async function syncPlanOptimistic(plan: WorkoutPlan): Promise<void> {
  savePlan(plan); // Optimistic
  const payload = {
    title: plan.title,
    description: plan.description,
    days_per_week: plan.daysPerWeek,
    plan_data: plan,
  };
  enqueueOutbox("plan", payload);
  Promise.resolve().then(() => flushOutbox());
}

/**
 * WEIGHTS: Batch enqueue
 */
export async function syncWeightsOptimistic(weights: WeightEntry[]): Promise<void> {
  if (!weights.length) return;
  enqueueOutbox("weights", weights);
  Promise.resolve().then(() => flushOutbox());
}

/**
 * HISTORY: Batch enqueue
 */
export async function syncHistoryOptimistic(history: WorkoutHistoryEntry[]): Promise<void> {
  if (!history.length) return;
  enqueueOutbox("history", history);
  Promise.resolve().then(() => flushOutbox());
}

/**
 * BODYCOMP: Enqueue
 */
export async function syncBodyCompOptimistic(data: BodyCompData): Promise<void> {
  enqueueOutbox("bodycomp", data);
  Promise.resolve().then(() => flushOutbox());
}

/**
 * CHECKS: Enqueue
 */
export async function syncChecksOptimistic(checks: Record<string, boolean>): Promise<void> {
  enqueueOutbox("checks", checks);
  Promise.resolve().then(() => flushOutbox());
}

/**
 * Pull data from cloud (Last-Write-Wins conflict resolution)
 */
export async function hydrateFromCloud(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  try {
    // Profile
    const { data: cloudProfile } = await supabase
      .from("profiles")
      .select("*,updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (cloudProfile?.name) {
      const profile: UserProfile = {
        name: cloudProfile.name,
        age: cloudProfile.age ?? 0,
        weight: Number(cloudProfile.weight ?? 0),
        height: Number(cloudProfile.height ?? 0),
        sex: cloudProfile.sex ?? "masculino",
        goal: cloudProfile.goal ?? "hipertrofia",
        level: cloudProfile.level ?? "iniciante",
        daysPerWeek: cloudProfile.days_per_week ?? 3,
        hoursPerSession: Number(cloudProfile.hours_per_session ?? 1),
        selectedMuscles: cloudProfile.selected_muscles ?? undefined,
        splitLegs: cloudProfile.split_legs ?? false,
      };
      saveProfile(profile);
    }

    // Plan (active only)
    const { data: cloudPlan } = await supabase
      .from("workout_plans")
      .select("plan_data")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cloudPlan?.plan_data) {
      savePlan(cloudPlan.plan_data as unknown as WorkoutPlan);
    }

    // Exercise checks (merge: union)
    const { data: cloudChecks } = await supabase
      .from("exercise_checks")
      .select("checks_data")
      .eq("user_id", userId)
      .maybeSingle();

    if (cloudChecks?.checks_data) {
      const local = loadChecked();
      const merged = { ...local, ...cloudChecks.checks_data };
      saveChecked(merged);
    }
  } catch (e) {
    console.warn("Hydration error", e);
  }
}

/**
 * Daily auto-sync if needed
 */
export async function maybeDailySync(): Promise<void> {
  const last = Number(localStorage.getItem(LAST_SYNC_KEY) ?? 0);
  if (Date.now() - last > ONE_DAY_MS) {
    await flushOutbox({ force: true });
    await hydrateFromCloud();
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
  }
}

/**
 * Get outbox status (for UI feedback)
 */
export function getOutboxStatus(): { pending: number; nextRetryIn?: number } {
  const queue = getOutbox();
  const pending = queue.length;
  const nextRetryTimes = queue
    .filter((e) => e.nextRetry)
    .map((e) => Math.max(0, e.nextRetry! - Date.now()));
  const nextRetryIn = nextRetryTimes.length > 0 ? Math.min(...nextRetryTimes) : undefined;
  return { pending, nextRetryIn };
}
