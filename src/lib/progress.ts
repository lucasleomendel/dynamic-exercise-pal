import { loadWeights, WeightEntry, loadWorkoutHistory, WorkoutHistoryEntry } from "./storage";

export interface ProgressReport {
  generatedAt: string;
  weekStart: string;
  weekEnd: string;
  exerciseSummaries: ExerciseSummary[];
  overallTrend: "up" | "down" | "stable" | "insufficient";
  stats: ProgressStats;
}

export interface ProgressStats {
  totalWorkouts: number;
  currentStreak: number;
  bestStreak: number;
  totalVolume: number; // total sets * reps (estimated)
  personalRecords: PersonalRecord[];
  weeklyFrequency: number; // average workouts per week
  completionRate: number; // % of exercises completed
}

export interface PersonalRecord {
  exerciseName: string;
  muscle: string;
  weight: number;
  date: string;
  previousRecord: number | null;
}

export interface ExerciseSummary {
  exerciseName: string;
  muscle: string;
  entries: { date: string; weight: number }[];
  avgWeight: number;
  maxWeight: number;
  minWeight: number;
  trend: "up" | "down" | "stable" | "insufficient";
  changePercent: number;
  totalEntries: number;
}

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function calculateStreak(history: WorkoutHistoryEntry[]): { current: number; best: number } {
  if (history.length === 0) return { current: 0, best: 0 };

  // Group by date (day only)
  const uniqueDays = [...new Set(history.map(h => h.date.split("T")[0]))].sort().reverse();
  
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  
  let current = 0;
  let best = 0;
  let streak = 0;
  let lastDate: Date | null = null;

  // Calculate streaks based on weekly consistency (at least 1 workout per week)
  const weeks = new Map<string, boolean>();
  uniqueDays.forEach(day => {
    const d = new Date(day);
    const weekKey = `${d.getFullYear()}-W${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`;
    weeks.set(weekKey, true);
  });

  // Simple day-based streak
  for (const day of uniqueDays) {
    if (!lastDate) {
      // First day: only count if today or yesterday
      if (day === today || day === yesterday) {
        streak = 1;
        lastDate = new Date(day);
      } else {
        break;
      }
    } else {
      const diff = (lastDate.getTime() - new Date(day).getTime()) / 86400000;
      if (diff <= 2) { // Allow 1 rest day
        streak++;
        lastDate = new Date(day);
      } else {
        break;
      }
    }
  }
  current = streak;

  // Best streak (all time)
  streak = 1;
  best = 1;
  const sortedDays = [...uniqueDays].sort();
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = (new Date(sortedDays[i]).getTime() - new Date(sortedDays[i - 1]).getTime()) / 86400000;
    if (diff <= 2) {
      streak++;
      best = Math.max(best, streak);
    } else {
      streak = 1;
    }
  }
  best = Math.max(best, current);

  return { current, best: uniqueDays.length > 0 ? best : 0 };
}

function findPersonalRecords(weights: WeightEntry[]): PersonalRecord[] {
  const exerciseMaxes = new Map<string, { weight: number; date: string; muscle: string }[]>();
  
  weights.forEach(w => {
    if (!exerciseMaxes.has(w.exerciseName)) exerciseMaxes.set(w.exerciseName, []);
    exerciseMaxes.get(w.exerciseName)!.push({ weight: w.weight, date: w.date, muscle: w.muscle });
  });

  const records: PersonalRecord[] = [];
  
  exerciseMaxes.forEach((entries, name) => {
    const sorted = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentMax = 0;
    let previousMax: number | null = null;
    
    for (const entry of sorted) {
      if (entry.weight > currentMax) {
        previousMax = currentMax > 0 ? currentMax : null;
        currentMax = entry.weight;
      }
    }

    if (currentMax > 0) {
      const maxEntry = sorted.filter(e => e.weight === currentMax).pop()!;
      records.push({
        exerciseName: name,
        muscle: maxEntry.muscle,
        weight: currentMax,
        date: maxEntry.date,
        previousRecord: previousMax,
      });
    }
  });

  return records.sort((a, b) => b.weight - a.weight);
}

export function generateProgressReport(): ProgressReport | null {
  const weights = loadWeights();
  const history = loadWorkoutHistory();
  
  if (weights.length === 0 && history.length === 0) return null;

  const now = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(now);

  // Summaries from weight data
  const summaries: ExerciseSummary[] = [];
  
  if (weights.length > 0) {
    const exerciseMap = new Map<string, WeightEntry[]>();
    weights.forEach(entry => {
      const key = entry.exerciseName;
      if (!exerciseMap.has(key)) exerciseMap.set(key, []);
      exerciseMap.get(key)!.push(entry);
    });

    const midpoint = new Date(now);
    midpoint.setDate(midpoint.getDate() - 7);

    exerciseMap.forEach((entries, name) => {
      const sorted = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const allWeights = sorted.map(e => e.weight);
      const avgWeight = allWeights.reduce((s, w) => s + w, 0) / allWeights.length;
      const maxWeight = Math.max(...allWeights);
      const minWeight = Math.min(...allWeights);

      const older = sorted.filter(e => new Date(e.date) < midpoint);
      const newer = sorted.filter(e => new Date(e.date) >= midpoint);

      let trend: "up" | "down" | "stable" | "insufficient" = "insufficient";
      let changePercent = 0;

      if (older.length > 0 && newer.length > 0) {
        const oldAvg = older.reduce((s, e) => s + e.weight, 0) / older.length;
        const newAvg = newer.reduce((s, e) => s + e.weight, 0) / newer.length;
        changePercent = ((newAvg - oldAvg) / oldAvg) * 100;
        if (changePercent > 2) trend = "up";
        else if (changePercent < -2) trend = "down";
        else trend = "stable";
      }

      summaries.push({
        exerciseName: name,
        muscle: entries[0].muscle,
        entries: sorted.map(e => ({ date: e.date, weight: e.weight })),
        avgWeight: Math.round(avgWeight * 10) / 10,
        maxWeight,
        minWeight,
        trend,
        changePercent: Math.round(changePercent * 10) / 10,
        totalEntries: sorted.length,
      });
    });
  }

  // Overall trend
  const trends = summaries.filter(s => s.trend !== "insufficient").map(s => s.trend);
  let overallTrend: "up" | "down" | "stable" | "insufficient" = "insufficient";
  if (trends.length > 0) {
    const ups = trends.filter(t => t === "up").length;
    const downs = trends.filter(t => t === "down").length;
    if (ups > downs) overallTrend = "up";
    else if (downs > ups) overallTrend = "down";
    else overallTrend = "stable";
  }

  // Stats
  const { current: currentStreak, best: bestStreak } = calculateStreak(history);
  const personalRecords = findPersonalRecords(weights);
  
  const totalWorkouts = [...new Set(history.map(h => h.date.split("T")[0]))].length;
  
  // Weekly frequency (last 4 weeks)
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentWorkouts = history.filter(h => new Date(h.date) >= fourWeeksAgo);
  const recentUniqueDays = [...new Set(recentWorkouts.map(h => h.date.split("T")[0]))].length;
  const weeklyFrequency = Math.round((recentUniqueDays / 4) * 10) / 10;

  // Completion rate
  const completionRate = history.length > 0
    ? Math.round((history.reduce((s, h) => s + h.completedExercises, 0) / history.reduce((s, h) => s + h.totalExercises, 0)) * 100)
    : 0;

  // Total volume estimate
  const totalVolume = weights.reduce((s, w) => s + w.weight, 0);

  return {
    generatedAt: now.toISOString(),
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
    exerciseSummaries: summaries,
    overallTrend,
    stats: {
      totalWorkouts,
      currentStreak,
      bestStreak,
      totalVolume: Math.round(totalVolume),
      personalRecords,
      weeklyFrequency,
      completionRate,
    },
  };
}

// Always regenerate for real-time updates
export function shouldRegenerateReport(_lastReport: ProgressReport | null): boolean {
  return true;
}
