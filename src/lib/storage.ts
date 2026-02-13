import { UserProfile, WorkoutPlan } from "./workout-generator";

const PROFILE_KEY = "fitforge_profile";
const PLAN_KEY = "fitforge_plan";
const CHECKED_KEY = "fitforge_checked";

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

export function clearAll() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(PLAN_KEY);
  localStorage.removeItem(CHECKED_KEY);
}
