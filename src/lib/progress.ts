import { loadWeights, WeightEntry } from "./storage";

export interface ProgressReport {
  generatedAt: string;
  weekStart: string;
  weekEnd: string;
  exerciseSummaries: ExerciseSummary[];
  overallTrend: "up" | "down" | "stable" | "insufficient";
}

export interface ExerciseSummary {
  exerciseName: string;
  muscle: string;
  entries: { date: string; weight: number }[];
  avgWeight: number;
  maxWeight: number;
  trend: "up" | "down" | "stable" | "insufficient";
  changePercent: number;
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

export function generateProgressReport(): ProgressReport | null {
  const weights = loadWeights();
  if (weights.length === 0) return null;

  const now = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(now);

  // Get entries from last 14 days to compare two weeks
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentEntries = weights.filter(w => new Date(w.date) >= twoWeeksAgo);
  if (recentEntries.length === 0) return null;

  const exerciseMap = new Map<string, WeightEntry[]>();
  recentEntries.forEach(entry => {
    const key = entry.exerciseName;
    if (!exerciseMap.has(key)) exerciseMap.set(key, []);
    exerciseMap.get(key)!.push(entry);
  });

  const midpoint = new Date(now);
  midpoint.setDate(midpoint.getDate() - 7);

  const summaries: ExerciseSummary[] = [];

  exerciseMap.forEach((entries, name) => {
    const sorted = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const avgWeight = sorted.reduce((s, e) => s + e.weight, 0) / sorted.length;
    const maxWeight = Math.max(...sorted.map(e => e.weight));

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
      trend,
      changePercent: Math.round(changePercent * 10) / 10,
    });
  });

  const trends = summaries.filter(s => s.trend !== "insufficient").map(s => s.trend);
  let overallTrend: "up" | "down" | "stable" | "insufficient" = "insufficient";
  if (trends.length > 0) {
    const ups = trends.filter(t => t === "up").length;
    const downs = trends.filter(t => t === "down").length;
    if (ups > downs) overallTrend = "up";
    else if (downs > ups) overallTrend = "down";
    else overallTrend = "stable";
  }

  return {
    generatedAt: now.toISOString(),
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
    exerciseSummaries: summaries,
    overallTrend,
  };
}

export function shouldRegenerateReport(lastReport: ProgressReport | null): boolean {
  if (!lastReport) return true;
  const diff = Date.now() - new Date(lastReport.generatedAt).getTime();
  return diff > 7 * 24 * 60 * 60 * 1000; // 7 days
}
