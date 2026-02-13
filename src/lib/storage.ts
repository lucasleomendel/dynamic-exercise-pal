import { UserProfile, WorkoutPlan } from "./workout-generator";
import { ProgressReport } from "./progress";

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
}

export function loadChecked(): Record<string, boolean> {
  const raw = localStorage.getItem(CHECKED_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function saveWeight(entry: WeightEntry) {
  const weights = loadWeights();
  weights.push(entry);
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
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

export function clearAll() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(PLAN_KEY);
  localStorage.removeItem(CHECKED_KEY);
  localStorage.removeItem(WEIGHTS_KEY);
  localStorage.removeItem(REPORT_KEY);
}
