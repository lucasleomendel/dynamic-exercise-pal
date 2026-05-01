import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Flame, Trophy,
  Target, Calendar, Award, Dumbbell, Activity, BarChart3,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import { generateProgressReport, ProgressReport } from "@/lib/progress";
import { loadWeights, loadWorkoutHistory, loadProfile } from "@/lib/storage";
import { fullSync } from "@/lib/cloud-sync";

const trendIcon = {
  up: <TrendingUp className="w-4 h-4 text-primary" />,
  down: <TrendingDown className="w-4 h-4 text-destructive" />,
  stable: <Minus className="w-4 h-4 text-muted-foreground" />,
  insufficient: <Activity className="w-4 h-4 text-muted-foreground" />,
};

const Progress = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const profile = useMemo(() => loadProfile(), []);

  useEffect(() => {
    setReport(generateProgressReport());
  }, []);

  // Histórico para gráfico semanal (últimas 8 semanas)
  const weeklyData = useMemo(() => {
    const history = loadWorkoutHistory();
    const weeks: Record<string, number> = {};
    history.forEach(h => {
      const d = new Date(h.date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().split("T")[0];
      weeks[key] = (weeks[key] ?? 0) + 1;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([date, count]) => ({
        semana: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        treinos: count,
      }));
  }, []);

  // Volume por grupo muscular
  const volumeByMuscle = useMemo(() => {
    const weights = loadWeights();
    const map: Record<string, number> = {};
    weights.forEach(w => {
      map[w.muscle] = (map[w.muscle] ?? 0) + w.weight;
    });
    return Object.entries(map)
      .map(([muscle, total]) => ({ muscle, total: Math.round(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, []);

  const exerciseChart = useMemo(() => {
    if (!selectedExercise || !report) return null;
    const s = report.exerciseSummaries.find(e => e.exerciseName === selectedExercise);
    if (!s) return null;
    return s.entries.map(e => ({
      date: new Date(e.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      peso: e.weight,
    }));
  }, [selectedExercise, report]);

  const stats = report?.stats;
  const muscleGroups = useMemo(() => {
    if (!report) return {};
    return report.exerciseSummaries.reduce((acc, s) => {
      (acc[s.muscle] = acc[s.muscle] ?? []).push(s);
      return acc;
    }, {} as Record<string, typeof report.exerciseSummaries>);
  }, [report]);

  const handleSync = async () => {
    setSyncing(true);
    await fullSync();
    setReport(generateProgressReport());
    setSyncing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Voltar</span>
          </button>
          <h1 className="font-display font-bold text-lg flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <BarChart3 className="w-5 h-5 text-primary" /> Painel de Progresso
          </h1>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition"
          >
            {syncing ? "Sync..." : "Sincronizar"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <StatCard icon={<Flame className="w-5 h-5 text-primary" />} label="Streak atual" value={`${stats.currentStreak}d`} highlight />
            <StatCard icon={<Trophy className="w-5 h-5 text-primary" />} label="Melhor streak" value={`${stats.bestStreak}d`} />
            <StatCard icon={<Calendar className="w-5 h-5 text-muted-foreground" />} label="Freq. semanal" value={`${stats.weeklyFrequency}x`} />
            <StatCard icon={<Dumbbell className="w-5 h-5 text-muted-foreground" />} label="Treinos totais" value={`${stats.totalWorkouts}`} />
          </motion.div>
        )}

        {/* Conclusão e volume */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Taxa de conclusão</span>
                <Target className="w-4 h-4 text-primary" />
              </div>
              <span className="text-3xl font-bold text-foreground">{stats.completionRate}%</span>
              <div className="h-2 rounded-full bg-secondary mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(stats.completionRate, 100)}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Volume total acumulado</span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                {stats.totalVolume > 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}t` : `${stats.totalVolume}kg`}
              </span>
              <p className="text-xs text-muted-foreground mt-2">Soma de todas as cargas registradas</p>
            </div>
          </motion.div>
        )}

        {/* Treinos por semana */}
        {weeklyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h3 className="font-display font-bold text-base mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Treinos por semana
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="treinos" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Volume por grupo muscular */}
        {volumeByMuscle.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h3 className="font-display font-bold text-base mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Volume por grupo muscular
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeByMuscle} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="muscle" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`${v}kg`, "Volume"]}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Recordes pessoais */}
        {stats && stats.personalRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Award className="w-5 h-5 text-primary" /> Recordes Pessoais
            </h3>
            <div className="space-y-2">
              {stats.personalRecords.slice(0, 8).map((pr, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{pr.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">{pr.muscle} • {new Date(pr.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{pr.weight}kg</p>
                    {pr.previousRecord != null && (
                      <p className="text-[10px] text-muted-foreground">antes: {pr.previousRecord}kg</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Evolução por exercício */}
        {report && report.exerciseSummaries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h3 className="font-display font-bold text-base mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Evolução por exercício
            </h3>

            {selectedExercise && exerciseChart && exerciseChart.length >= 2 && (
              <div className="mb-4 p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{selectedExercise}</span>
                  <button onClick={() => setSelectedExercise(null)} className="text-xs text-muted-foreground hover:text-foreground">
                    Fechar
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={exerciseChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                      formatter={(v: number) => [`${v}kg`, "Peso"]}
                    />
                    <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(muscleGroups).map(([muscle, summaries]) => (
                <div key={muscle}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{muscle}</h4>
                  <div className="space-y-1.5">
                    {summaries.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedExercise(s.exerciseName === selectedExercise ? null : s.exerciseName)}
                        className={`w-full text-left rounded-xl p-3 transition-all ${
                          selectedExercise === s.exerciseName
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-secondary/30 border border-transparent hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-foreground truncate">{s.exerciseName}</span>
                          {trendIcon[s.trend]}
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>Méd: <strong className="text-foreground">{s.avgWeight}kg</strong></span>
                          <span>Máx: <strong className="text-foreground">{s.maxWeight}kg</strong></span>
                          {s.trend !== "insufficient" && (
                            <span className={s.changePercent > 0 ? "text-primary font-semibold" : s.changePercent < 0 ? "text-destructive font-semibold" : ""}>
                              {s.changePercent > 0 ? "+" : ""}{s.changePercent}%
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {(!report || (report.exerciseSummaries.length === 0 && !stats)) && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Ainda sem dados. Registre cargas nos exercícios para ver sua evolução.
            </p>
          </div>
        )}

        {profile && (
          <p className="text-center text-xs text-muted-foreground">
            Olá, <strong className="text-foreground">{profile.name}</strong> — continue assim!
          </p>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-2xl border border-border p-4 ${highlight ? "bg-primary/10" : "bg-card"}`}>
    <div className="flex items-center justify-between mb-2">{icon}</div>
    <p className={`text-2xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

export default Progress;
