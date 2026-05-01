import { UserProfile, WorkoutPlan } from "./workout-generator";
import { ProgressReport } from "./progress";

/** Dispara fn em background sem bloquear nem propagar erros (auto-sync cloud). */
const bg = (fn: () => Promise<unknown>) => {
  Promise.resolve().then(() => fn().catch(() => {}));
};
const cloud = () => import("./cloud-sync");

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
}

export function loadProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function savePlan(plan: WorkoutPlan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function loadPlan(): WorkoutPlan | null {
  const raw = localStorage.getItem(PLAN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveChecked(checked: Record<string, boolean>) {
  localStorage.setItem(CHECKED_KEY, JSON.stringify(checked));
  bg(async () => (await cloud()).syncChecks());
}

export function loadChecked(): Record<string, boolean> {
  const raw = localStorage.getItem(CHECKED_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function saveWeight(entry: WeightEntry) {
  const weights = loadWeights();
  weights.push(entry);
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
  bg(async () => (await cloud()).syncWeights([entry]));
}

export function loadWeights(): WeightEntry[] {
  const raw = localStorage.getItem(WEIGHTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveReport(report: ProgressReport) {
  localStorage.setItem(REPORT_KEY, JSON.stringify(report));
}

export function loadReport(): ProgressReport | null {
  const raw = localStorage.getItem(REPORT_KEY);
  return raw ? JSON.parse(raw) : null;
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
  bg(async () => (await cloud()).syncBodyComp(data));
}

export function loadBodyComp(): BodyCompData | null {
  const raw = localStorage.getItem(BODY_COMP_KEY);
  return raw ? JSON.parse(raw) : null;
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
  bg(async () => (await cloud()).syncHistory([entry]));
}

export function loadWorkoutHistory(): WorkoutHistoryEntry[] {
  const raw = localStorage.getItem(WORKOUT_HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function clearAll() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(PLAN_KEY);
  localStorage.removeItem(CHECKED_KEY);
  localStorage.removeItem(WEIGHTS_KEY);
  localStorage.removeItem(REPORT_KEY);
  localStorage.removeItem(BODY_COMP_KEY);
}
