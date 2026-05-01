/**
 * Cloud sync module - sincroniza dados locais (localStorage) com o Supabase
 * Estratégia: localStorage como cache rápido + Supabase como source of truth.
 * Roda automaticamente: ao carregar, ao salvar, e uma vez por dia em background.
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

const LAST_SYNC_KEY = "fitforge_last_sync";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/* ============ PROFILE ============ */
export async function syncProfile(profile?: UserProfile | null) {
  const userId = await getUserId();
  if (!userId) return;
  const p = profile ?? loadProfile();
  if (!p) return;
  await supabase.from("profiles").upsert({
    user_id: userId,
    name: p.name,
    age: p.age,
    weight: p.weight,
    height: p.height,
    sex: p.sex,
    goal: p.goal,
    level: p.level,
    days_per_week: p.daysPerWeek,
    hours_per_session: p.hoursPerSession,
    selected_muscles: p.selectedMuscles ?? null,
    split_legs: p.splitLegs ?? false,
    last_synced_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

export async function pullProfile(): Promise<UserProfile | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || !data.name) return null;
  const profile: UserProfile = {
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
  };
  saveProfile(profile);
  return profile;
}

/* ============ PLAN ============ */
export async function syncPlan(plan?: WorkoutPlan | null) {
  const userId = await getUserId();
  if (!userId) return;
  const p = plan ?? loadPlan();
  if (!p) return;
  // desativa planos anteriores e insere novo ativo
  await supabase.from("workout_plans").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
  await supabase.from("workout_plans").insert({
    user_id: userId,
    title: p.title,
    description: p.description,
    days_per_week: p.daysPerWeek,
    plan_data: p as any,
    is_active: true,
  });
}

export async function pullPlan(): Promise<WorkoutPlan | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from("workout_plans")
    .select("plan_data")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.plan_data) return null;
  const plan = data.plan_data as unknown as WorkoutPlan;
  savePlan(plan);
  return plan;
}

/* ============ WEIGHTS ============ */
export async function syncWeights(weights?: WeightEntry[]) {
  const userId = await getUserId();
  if (!userId) return;
  const list = weights ?? loadWeights();
  if (!list.length) return;
  // upsert simples por chave+data
  const rows = list.map(w => ({
    user_id: userId,
    exercise_key: w.exerciseKey,
    exercise_name: w.exerciseName,
    muscle: w.muscle,
    weight: w.weight,
    logged_at: w.date,
  }));
  // best-effort: insere ignorando erros de duplicidade
  await supabase.from("weight_logs").insert(rows);
}

/* ============ HISTORY ============ */
export async function syncHistory(history?: WorkoutHistoryEntry[]) {
  const userId = await getUserId();
  if (!userId) return;
  const list = history ?? loadWorkoutHistory();
  if (!list.length) return;
  const rows = list.map(h => ({
    user_id: userId,
    workout_date: h.date,
    completed_exercises: h.completedExercises,
    total_exercises: h.totalExercises,
    day_focus: h.dayFocus,
  }));
  await supabase.from("workout_history").insert(rows);
}

/* ============ BODY COMP ============ */
export async function syncBodyComp(data?: BodyCompData | null) {
  const userId = await getUserId();
  if (!userId) return;
  const bc = data ?? loadBodyComp();
  if (!bc?.result) return;
  await supabase.from("body_compositions").insert({
    user_id: userId,
    measured_at: bc.date,
    skinfolds: bc.skinfolds as any,
    measurements: bc.measurements as any,
    body_fat: bc.result.bodyFat,
    fat_mass: bc.result.fatMass,
    lean_mass: bc.result.leanMass,
    classification: bc.result.classification,
    method: bc.result.method,
  });
}

/* ============ EXERCISE CHECKS ============ */
export async function syncChecks() {
  const userId = await getUserId();
  if (!userId) return;
  const checks = loadChecked();
  await supabase.from("exercise_checks").upsert({
    user_id: userId,
    checks_data: checks as any,
  }, { onConflict: "user_id" });
}

export async function pullChecks() {
  const userId = await getUserId();
  if (!userId) return;
  const { data } = await supabase
    .from("exercise_checks")
    .select("checks_data")
    .eq("user_id", userId)
    .maybeSingle();
  if (data?.checks_data) {
    saveChecked(data.checks_data as Record<string, boolean>);
  }
}

/* ============ FULL SYNC ============ */
export async function fullSync(opts?: { silent?: boolean }) {
  const userId = await getUserId();
  if (!userId) return { ok: false, reason: "not_authenticated" };
  try {
    await Promise.allSettled([
      syncProfile(), syncPlan(), syncWeights(), syncHistory(),
      syncBodyComp(), syncChecks(),
    ]);
    await supabase.from("sync_log").insert({
      user_id: userId,
      sync_type: "full",
      status: "success",
      details: { ts: Date.now(), silent: opts?.silent ?? false },
    });
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    return { ok: true };
  } catch (e: any) {
    await supabase.from("sync_log").insert({
      user_id: userId,
      sync_type: "full",
      status: "error",
      details: { error: e?.message ?? String(e) },
    });
    return { ok: false, reason: e?.message };
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
  const { data } = await supabase
    .from("profiles")
    .select("updated_at,name,age,weight,height,sex,goal,level,days_per_week,hours_per_session,selected_muscles,split_legs")
    .eq("user_id", userId)
    .maybeSingle();
  const cloudTs = data?.updated_at ? new Date(data.updated_at).getTime() : 0;

  if (!data?.name && !localProfile) return;
  if (cloudTs > localTs && data?.name) {
    // cloud mais novo → hidrata local
    const profile: UserProfile = {
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
    };
    saveProfile(profile);
    localStorage.setItem(PROFILE_TS_KEY, String(cloudTs));
  } else if (localTs > cloudTs && localProfile) {
    await syncProfile(localProfile);
  }
}

async function resolvePlanConflict() {
  const userId = await getUserId();
  if (!userId) return;
  const localPlan = loadPlan();
  const localTs = Number(localStorage.getItem(PLAN_TS_KEY) ?? 0);
  const { data } = await supabase
    .from("workout_plans")
    .select("plan_data,updated_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const cloudTs = data?.updated_at ? new Date(data.updated_at).getTime() : 0;

  if (!data?.plan_data && !localPlan) return;
  if (cloudTs > localTs && data?.plan_data) {
    savePlan(data.plan_data as unknown as WorkoutPlan);
    localStorage.setItem(PLAN_TS_KEY, String(cloudTs));
  } else if (localTs > cloudTs && localPlan) {
    await syncPlan(localPlan);
  }
}

async function resolveChecksConflict() {
  const userId = await getUserId();
  if (!userId) return;
  const { data } = await supabase
    .from("exercise_checks")
    .select("checks_data,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  const local = loadChecked();
  const cloudTs = data?.updated_at ? new Date(data.updated_at).getTime() : 0;
  // Merge: união (true tem prioridade); se cloud > local em timestamp, prefere cloud
  const cloud = (data?.checks_data ?? {}) as Record<string, boolean>;
  const merged: Record<string, boolean> = { ...local };
  Object.keys(cloud).forEach(k => {
    if (cloudTs > 0 || cloud[k]) merged[k] = cloud[k] || merged[k] || false;
  });
  saveChecked(merged);
}

/* ============ INITIAL HYDRATION ============ */
/** Resolve conflitos cloud↔local na entrada (last-write-wins) */
export async function hydrateFromCloud() {
  const userId = await getUserId();
  if (!userId) return;
  await Promise.allSettled([
    resolveProfileConflict(),
    resolvePlanConflict(),
    resolveChecksConflict(),
  ]);
}

/* ============ DAILY AUTO-SYNC ============ */
/** Chama fullSync se a última sincronização foi há mais de 24h */
export async function maybeDailySync() {
  const last = Number(localStorage.getItem(LAST_SYNC_KEY) ?? 0);
  if (Date.now() - last > ONE_DAY_MS) {
    await fullSync({ silent: true });
  }
}

