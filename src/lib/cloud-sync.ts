/**
 * Cloud sync module - sincroniza dados locais (localStorage) com o Supabase
 * Estratégia: localStorage como cache rápido + Supabase como source of truth.
 * Roda automaticamente: ao carregar, ao salvar, e uma vez por dia em background.
 */
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, WorkoutPlan, normalizeUserProfile } from "./workout-generator";
import {
  loadProfile, saveProfile,
  loadPlan, savePlan,
  loadWeights, loadWorkoutHistory,
  loadBodyComp, loadChecked, saveChecked,
  WeightEntry, WorkoutHistoryEntry, BodyCompData,
} from "./storage";

const LAST_SYNC_KEY = "fitforge_last_sync";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Sync-log failures must be observable, but must not mask the actual sync result. */
async function writeSyncLog(
  userId: string,
  status: "success" | "error",
  details: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await supabase.from("sync_log").insert({
      user_id: userId,
      sync_type: "full",
      status,
      details,
    });
    if (error) throw error;
  } catch (error) {
    console.warn("[FitForge] Não foi possível registrar o resultado da sincronização.", error);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("fitforge:sync-error", {
        detail: { operation: "write-sync-log", error },
      }));
    }
  }
}

async function getUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

async function resolveUserId(userId?: string | null): Promise<string | null> {
  return userId ?? (await getUserId());
}

async function isCurrentUser(userId: string): Promise<boolean> {
  try {
    return (await getUserId()) === userId;
  } catch {
    return false;
  }
}

/* ============ PROFILE ============ */
export async function syncProfile(profile?: UserProfile | null, userId?: string | null) {
  const uid = await resolveUserId(userId);
  if (!uid) return;
  const p = profile ?? loadProfile();
  if (!p) return;
  const safeProfile = normalizeUserProfile(p);
  const { error } = await supabase.from("profiles").upsert({
    user_id: uid,
    name: safeProfile.name,
    age: safeProfile.age,
    weight: safeProfile.weight,
    height: safeProfile.height,
    sex: safeProfile.sex,
    goal: safeProfile.goal,
    level: safeProfile.level,
    days_per_week: safeProfile.daysPerWeek,
    hours_per_session: safeProfile.hoursPerSession,
    selected_muscles: safeProfile.selectedMuscles ?? null,
    split_legs: safeProfile.splitLegs ?? false,
    injuries: safeProfile.injuries ?? [],
    last_synced_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function pullProfile(): Promise<UserProfile | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!(await isCurrentUser(userId))) return null;
  if (!data || !data.name) return null;
  const candidate: UserProfile = {
    name: data.name,
    age: data.age ?? 0,
    weight: Number(data.weight ?? 0),
    height: Number(data.height ?? 0),
    sex: (data.sex as UserProfile["sex"]) ?? "masculino",
    goal: (data.goal as UserProfile["goal"]) ?? "hipertrofia",
    level: (data.level as UserProfile["level"]) ?? "iniciante",
    daysPerWeek: data.days_per_week ?? 3,
    hoursPerSession: Number(data.hours_per_session ?? 1),
    selectedMuscles: (data.selected_muscles as UserProfile["selectedMuscles"]) ?? undefined,
    splitLegs: data.split_legs ?? false,
    injuries: (data.injuries as UserProfile["injuries"]) ?? [],
  };
  try {
    const profile = normalizeUserProfile(candidate);
    saveProfile(profile);
    return profile;
  } catch {
    console.warn("[FitForge] Ignoring invalid profile received from cloud.");
    return null;
  }
}

/* ============ PLAN ============ */
export async function syncPlan(plan?: WorkoutPlan | null, userId?: string | null) {
  const uid = await resolveUserId(userId);
  if (!uid) return;
  const p = plan ?? loadPlan();
  if (!p) return;

  // Replace the active plan atomically on the server. This avoids losing the
  // active plan if inserting its replacement fails, and serializes concurrent syncs.
  const { error: syncError } = await supabase.rpc("sync_active_workout_plan", {
    p_title: p.title,
    p_description: p.description ?? null,
    p_days_per_week: p.daysPerWeek,
    p_plan_data: p,
  });
  if (syncError) throw syncError;

  // Clean up old inactive plans (> 30 days) only after the replacement
  // was inserted successfully.
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error: cleanupError } = await supabase
    .from("workout_plans")
    .delete()
    .eq("user_id", uid)
    .eq("is_active", false)
    .lt("updated_at", cutoff);
  if (cleanupError) throw cleanupError;
}

export async function pullPlan(): Promise<WorkoutPlan | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("workout_plans")
    .select("plan_data")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!(await isCurrentUser(userId))) return null;
  if (!data?.plan_data) return null;
  const plan = data.plan_data as unknown as WorkoutPlan;
  savePlan(plan);
  return plan;
}

/* ============ WEIGHTS ============ */
export async function syncWeights(weights?: WeightEntry[], userId?: string | null) {
  const uid = await resolveUserId(userId);
  if (!uid) return;
  const list = weights ?? loadWeights();
  if (!list.length) return;

  const rows = list.map(w => ({
    user_id: uid,
    exercise_key: w.exerciseKey,
    exercise_name: w.exerciseName,
    muscle: w.muscle,
    weight: w.weight,
    logged_at: w.date,
  }));
  const { error } = await supabase
    .from("weight_logs")
    .upsert(rows, { onConflict: "user_id,exercise_key,logged_at", ignoreDuplicates: true });
  if (error) throw error;
}

/* ============ HISTORY ============ */
export async function syncHistory(history?: WorkoutHistoryEntry[], userId?: string | null) {
  const uid = await resolveUserId(userId);
  if (!uid) return;
  const list = history ?? loadWorkoutHistory();
  if (!list.length) return;

  const rows = list.map(h => ({
    user_id: uid,
    workout_date: h.date,
    completed_exercises: h.completedExercises,
    total_exercises: h.totalExercises,
    day_focus: h.dayFocus,
  }));
  const { error } = await supabase
    .from("workout_history")
    .upsert(rows, { onConflict: "user_id,workout_date", ignoreDuplicates: true });
  if (error) throw error;
}

/* ============ BODY COMP ============ */
export async function syncBodyComp(data?: BodyCompData | null, userId?: string | null) {
  const uid = await resolveUserId(userId);
  if (!uid) return;
  const bc = data ?? loadBodyComp();
  if (!bc?.result) return;

  // A composição corporal é histórica. A constraint única no banco torna
  // a sincronização idempotente mesmo quando dois auto-syncs acontecem
  // simultaneamente.
  const { error } = await supabase.from("body_compositions").upsert({
    user_id: uid,
    measured_at: bc.date,
    skinfolds: bc.skinfolds as any,
    measurements: bc.measurements as any,
    body_fat: bc.result.bodyFat,
    fat_mass: bc.result.fatMass,
    lean_mass: bc.result.leanMass,
    classification: bc.result.classification,
    method: bc.result.method,
  }, { onConflict: "user_id,measured_at" });
  if (error) throw error;
}

/* ============ EXERCISE CHECKS ============ */
export async function syncChecks(userId?: string | null) {
  const uid = await resolveUserId(userId);
  if (!uid) return;
  const checks = loadChecked();
  const { error } = await supabase.from("exercise_checks").upsert({
    user_id: uid,
    checks_data: checks as any,
  }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function pullChecks() {
  const userId = await getUserId();
  if (!userId) return;
  const { data, error } = await supabase
    .from("exercise_checks")
    .select("checks_data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!(await isCurrentUser(userId))) return;
  if (data?.checks_data) {
    saveChecked(data.checks_data as Record<string, boolean>);
  }
}

/* ============ WATER ============ */
export interface CloudWaterState {
  date: string;
  glasses: number;
  goalMl: number | null;
}

export async function syncWater(
  state: { date: string; glasses: number; goalMl?: number | null },
  userId?: string | null,
) {
  const uid = await resolveUserId(userId);
  if (!uid) return;
  const amountMl = Math.max(0, Math.round(state.glasses * 250));
  const { error } = await supabase.from("water_logs").upsert({
    user_id: uid,
    log_date: state.date,
    amount_ml: amountMl,
    goal_ml: state.goalMl ?? null,
  }, { onConflict: "user_id,log_date" });
  if (error) throw error;
}

export async function pullWater(date: string, userId?: string | null): Promise<CloudWaterState | null> {
  const uid = await resolveUserId(userId);
  if (!uid) return null;
  const { data, error } = await supabase
    .from("water_logs")
    .select("log_date,amount_ml,goal_ml")
    .eq("user_id", uid)
    .eq("log_date", date)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    date: data.log_date,
    glasses: Math.max(0, Math.floor(Number(data.amount_ml ?? 0) / 250)),
    goalMl: data.goal_ml == null ? null : Number(data.goal_ml),
  };
}

/* ============ FULL SYNC ============ */
export async function fullSync(opts?: { silent?: boolean }) {
  let userId: string | null;
  try {
    userId = await getUserId();
  } catch (error) {
    console.warn("[FitForge] Não foi possível confirmar a sessão antes da sincronização.", error);
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
  if (!userId) return { ok: false, reason: "not_authenticated" };

  try {
    const results = await Promise.allSettled([
      syncProfile(undefined, userId),
      syncPlan(undefined, userId),
      syncWeights(undefined, userId),
      syncHistory(undefined, userId),
      syncBodyComp(undefined, userId),
      syncChecks(userId),
    ]);
    const failures = results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map(result => result.reason instanceof Error ? result.reason.message : String(result.reason));

    if (failures.length > 0) {
      await writeSyncLog(userId, "error", {
        ts: Date.now(),
        errors: failures,
        silent: opts?.silent ?? false,
      });
      return { ok: false, reason: failures.join("; ") };
    }

    await writeSyncLog(userId, "success", {
      ts: Date.now(),
      silent: opts?.silent ?? false,
    });
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    return { ok: true };
  } catch (error) {
    await writeSyncLog(userId, "error", {
      error: error instanceof Error ? error.message : String(error),
      silent: opts?.silent ?? false,
    });
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

/* ============ CONFLICT RESOLUTION ============
 * Estratégia: Last-Write-Wins por timestamp.
 * - Se cloud é mais recente que local → puxa cloud
 * - Se local é mais recente → empurra local
 * - Se nenhum existe → no-op
 * - Se ambos são iguais → no-op
 */
const PROFILE_TS_KEY = "fitforge_profile_ts";
const PLAN_TS_KEY = "fitforge_plan_ts";

export function markLocalUpdate(kind: "profile" | "plan") {
  const key = kind === "profile" ? PROFILE_TS_KEY : PLAN_TS_KEY;
  localStorage.setItem(key, String(Date.now()));
}

async function resolveProfileConflict() {
  const userId = await getUserId();
  if (!userId) return;
  const localProfile = loadProfile();
  const localTs = Number(localStorage.getItem(PROFILE_TS_KEY) ?? 0);
  const { data, error } = await supabase
    .from("profiles")
    .select("updated_at,name,age,weight,height,sex,goal,level,days_per_week,hours_per_session,selected_muscles,split_legs,injuries")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  // Do not hydrate a stale account's profile into the shared browser cache.
  if (!(await isCurrentUser(userId))) return;
  const cloudTs = data?.updated_at ? new Date(data.updated_at).getTime() : 0;

  if (!data?.name && !localProfile) return;
  if (cloudTs > localTs && data?.name) {
    // cloud mais novo → hidrata local somente se o registro passar pela mesma
    // validação usada na geração do treino.
    const candidate: UserProfile = {
      name: data.name,
      age: data.age ?? 0,
      weight: Number(data.weight ?? 0),
      height: Number(data.height ?? 0),
      sex: (data.sex as UserProfile["sex"]) ?? "masculino",
      goal: (data.goal as UserProfile["goal"]) ?? "hipertrofia",
      level: (data.level as UserProfile["level"]) ?? "iniciante",
      daysPerWeek: data.days_per_week ?? 3,
      hoursPerSession: Number(data.hours_per_session ?? 1),
      selectedMuscles: (data.selected_muscles as UserProfile["selectedMuscles"]) ?? undefined,
      splitLegs: data.split_legs ?? false,
      injuries: (data.injuries as UserProfile["injuries"]) ?? [],
    };
    try {
      const profile = normalizeUserProfile(candidate);
      saveProfile(profile);
      localStorage.setItem(PROFILE_TS_KEY, String(cloudTs));
    } catch {
      console.warn("[FitForge] Ignoring invalid cloud profile during conflict resolution.");
    }
  } else if (localTs > cloudTs && localProfile) {
    // Keep the write bound to the account whose cloud timestamp was read.
    // Resolving the current session again here could write this cache to a different account.
    await syncProfile(localProfile, userId);
  }
}

async function resolvePlanConflict() {
  const userId = await getUserId();
  if (!userId) return;
  const localPlan = loadPlan();
  const localTs = Number(localStorage.getItem(PLAN_TS_KEY) ?? 0);
  const { data, error } = await supabase
    .from("workout_plans")
    .select("plan_data,updated_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  // Do not hydrate a stale account's plan into the shared browser cache.
  if (!(await isCurrentUser(userId))) return;
  const cloudTs = data?.updated_at ? new Date(data.updated_at).getTime() : 0;

  if (!data?.plan_data && !localPlan) return;
  if (cloudTs > localTs && data?.plan_data) {
    savePlan(data.plan_data as unknown as WorkoutPlan);
    localStorage.setItem(PLAN_TS_KEY, String(cloudTs));
  } else if (localTs > cloudTs && localPlan) {
    // Keep the write bound to the account whose active plan was read.
    await syncPlan(localPlan, userId);
  }
}

async function resolveChecksConflict() {
  const userId = await getUserId();
  if (!userId) return;
  const { data, error } = await supabase
    .from("exercise_checks")
    .select("checks_data,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  // Prevent a late response from overwriting the next account's local checks.
  if (!(await isCurrentUser(userId))) return;
  const local = loadChecked();
  const cloudTs = data?.updated_at ? new Date(data.updated_at).getTime() : 0;
  // Se há um registro cloud com timestamp, ele é a fonte mais recente.
  // Sem timestamp cloud, preservamos o cache local e acrescentamos o que existir.
  const cloud = (data?.checks_data ?? {}) as Record<string, boolean>;
  const merged: Record<string, boolean> = cloudTs > 0
    ? { ...cloud }
    : { ...local, ...cloud };
  saveChecked(merged);
}

/* ============ INITIAL HYDRATION ============ */
/** Resolve conflitos cloud↔local na entrada (last-write-wins) */
export async function hydrateFromCloud() {
  const userId = await getUserId();
  if (!userId) return;

  const operations = [
    ["hydrate-profile", resolveProfileConflict],
    ["hydrate-plan", resolvePlanConflict],
    ["hydrate-checks", resolveChecksConflict],
  ] as const;
  const results = await Promise.allSettled(operations.map(([, operation]) => operation()));
  results.forEach((result, index) => {
    if (result.status !== "rejected") return;
    const [operation] = operations[index];
    console.warn(`[FitForge] Falha na hidratação da nuvem: ${operation}`, result.reason);
    window.dispatchEvent(new CustomEvent("fitforge:sync-error", {
      detail: { operation, error: result.reason },
    }));
  });
}

/* ============ DAILY AUTO-SYNC ============ */
/** Chama fullSync se a última sincronização foi há mais de 24h */
export async function maybeDailySync() {
  const last = Number(localStorage.getItem(LAST_SYNC_KEY) ?? 0);
  if (Date.now() - last <= ONE_DAY_MS) return;

  const result = await fullSync({ silent: true });
  if (!result.ok && result.reason !== "not_authenticated") {
    // Background sync failures must remain observable instead of being
    // silently treated as a successful daily sync.
    console.warn("[FitForge] Sincronização diária incompleta.", result.reason);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("fitforge:sync-error", {
        detail: { operation: "daily-sync", error: result.reason },
      }));
    }
  }
}
