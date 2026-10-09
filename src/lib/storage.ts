import { UserProfile, WorkoutPlan } from "./workout-generator";
import { ProgressReport } from "./progress";
import { supabase } from "@/integrations/supabase/client";

/** Executa sincronizações em background sem bloquear a UI, mas não silencia falhas. */
const bg = (operation: string, fn: () => Promise<unknown>) => {
  Promise.resolve()
    .then(fn)
    .catch((error) => {
      console.warn(`[FitForge] Falha na sincronização: ${operation}`, error);
      window.dispatchEvent(new CustomEvent("fitforge:sync-error", {
        detail: { operation, error },
      }));
    });
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("[FitForge] Dados locais corrompidos; usando fallback.", error);
    return fallback;
  }
}
const cloud = () => import("./cloud-sync");

const bgAuthenticated = (operation: string, fn: (userId: string) => Promise<unknown>) => {
  // Guest data must never be queued for cloud synchronization. Capture this
  // state before scheduling async work because login clears the guest flag.
  try {
    if (localStorage.getItem("fitforge_guest_mode") === "1") return;
  } catch {
    // If storage cannot be read, fail closed and do not sync potentially
    // guest-owned data to an authenticated account.
    return;
  }

  // Resolve the identity immediately at the write boundary rather than later
  // inside the background queue, where a subsequent login could change users.
  void supabase.auth.getUser()
    .then(async ({ data, error }) => {
      if (error || !data.user?.id) return;
      await bg(operation, async () => {
        // Re-check guest mode and authenticated identity immediately before
        // sending data. A logout/account switch may have happened while this
        // operation was waiting in the background queue.
        try {
          if (localStorage.getItem("fitforge_guest_mode") === "1") return;
        } catch {
          return;
        }

        const { data: currentData, error: currentError } = await supabase.auth.getUser();
        if (currentError || currentData.user?.id !== data.user.id) {
          console.warn(`[FitForge] Sincronização cancelada: identidade mudou durante ${operation}.`);
          return;
        }

        await fn(data.user.id);
      });
    })
    .catch((error) => {
      console.warn(`[FitForge] Falha ao identificar conta para sincronização: ${operation}`, error);
    });
};

const PROFILE_KEY = "fitforge_profile";
const PLAN_KEY = "fitforge_plan";
const CHECKED_KEY = "fitforge_checked";
const WEIGHTS_KEY = "fitforge_weights";
const REPORT_KEY = "fitforge_report";

export interface WeightEntry {
  exerciseKey: string;
  exerciseName: string;
  muscle: string;
  weight: number;
  date: string;
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem("fitforge_profile_ts", String(Date.now()));
  bgAuthenticated("auto-sync", async (userId) => (await cloud()).syncProfile(profile, userId));
}

export function loadProfile(): UserProfile | null {
  return safeParse<UserProfile | null>(localStorage.getItem(PROFILE_KEY), null);
}

export function savePlan(plan: WorkoutPlan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  localStorage.setItem("fitforge_plan_ts", String(Date.now()));
  bgAuthenticated("auto-sync", async (userId) => (await cloud()).syncPlan(plan, userId));
}

export function loadPlan(): WorkoutPlan | null {
  return safeParse<WorkoutPlan | null>(localStorage.getItem(PLAN_KEY), null);
}

export function saveChecked(checked: Record<string, boolean>) {
  localStorage.setItem(CHECKED_KEY, JSON.stringify(checked));
  bgAuthenticated("auto-sync", async (userId) => (await cloud()).syncChecks(userId));
}

export function loadChecked(): Record<string, boolean> {
  return safeParse<Record<string, boolean>>(localStorage.getItem(CHECKED_KEY), {});
}

export function saveWeight(entry: WeightEntry) {
  const weights = loadWeights();
  weights.push(entry);
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
  bgAuthenticated("auto-sync", async (userId) => (await cloud()).syncWeights([entry], userId));
}

export function loadWeights(): WeightEntry[] {
  return safeParse<WeightEntry[]>(localStorage.getItem(WEIGHTS_KEY), []);
}

export function saveReport(report: ProgressReport) {
  localStorage.setItem(REPORT_KEY, JSON.stringify(report));
}

export function loadReport(): ProgressReport | null {
  return safeParse<ProgressReport | null>(localStorage.getItem(REPORT_KEY), null);
}

const BODY_COMP_KEY = "fitforge_bodycomp";

export interface BodyCompData {
  skinfolds: Record<string, number | undefined>;
  measurements: Record<string, number | undefined>;
  result: {
    bodyFat: number;
    fatMass: number;
    leanMass: number;
    classification: string;
    method: string;
  } | null;
  date: string;
}

export function saveBodyComp(data: BodyCompData) {
  localStorage.setItem(BODY_COMP_KEY, JSON.stringify(data));
  bgAuthenticated("auto-sync", async (userId) => (await cloud()).syncBodyComp(data, userId));
}

export function loadBodyComp(): BodyCompData | null {
  return safeParse<BodyCompData | null>(localStorage.getItem(BODY_COMP_KEY), null);
}

const WORKOUT_HISTORY_KEY = "fitforge_history";

// Workout history
export interface WorkoutHistoryEntry {
  date: string;
  completedExercises: number;
  totalExercises: number;
  dayFocus: string;
}

export function saveWorkoutHistory(entry: WorkoutHistoryEntry) {
  const history = loadWorkoutHistory();
  history.push(entry);
  // Keep last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const filtered = history.filter(h => new Date(h.date) > cutoff);
  localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(filtered));
  bgAuthenticated("auto-sync", async (userId) => (await cloud()).syncHistory([entry], userId));
}

export function loadWorkoutHistory(): WorkoutHistoryEntry[] {
  return safeParse<WorkoutHistoryEntry[]>(localStorage.getItem(WORKOUT_HISTORY_KEY), []);
}

export function clearAll() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(PLAN_KEY);
  localStorage.removeItem(CHECKED_KEY);
  localStorage.removeItem(WEIGHTS_KEY);
  localStorage.removeItem(REPORT_KEY);
  localStorage.removeItem(BODY_COMP_KEY);
  localStorage.removeItem(WORKOUT_HISTORY_KEY);
  localStorage.removeItem("fitforge_water");
  // Chat history can contain personal information and must not cross accounts.
  localStorage.removeItem("fitforge_chat_history_v2");
  localStorage.removeItem("fitforge_profile_ts");
  localStorage.removeItem("fitforge_plan_ts");
  localStorage.removeItem("fitforge_last_sync");
}
