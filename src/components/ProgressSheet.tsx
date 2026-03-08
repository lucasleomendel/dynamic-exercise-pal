import { useEffect, useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TrendingUp, TrendingDown, Minus, BarChart3, AlertCircle, Flame, Trophy, Target, Zap, Calendar, Award, Dumbbell } from "lucide-react";
import { ProgressReport, generateProgressReport } from "@/lib/progress";
import { loadWeights } from "@/lib/storage";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const trendIcons = {
  up: <TrendingUp className="w-4 h-4 text-primary" />,
  down: <TrendingDown className="w-4 h-4 text-destructive" />,
  stable: <Minus className="w-4 h-4 text-muted-foreground" />,
  insufficient: <AlertCircle className="w-4 h-4 text-muted-foreground" />,
};

const trendLabels = {
  up: "Em progressão",
  down: "Regressão",
  stable: "Estável",
  insufficient: "Dados insuficientes",
};

const trendColors = {
  up: "text-primary",
  down: "text-destructive",
  stable: "text-muted-foreground",
  insufficient: "text-muted-foreground",
};

const ProgressSheet = () => {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Regenerate on open for real-time updates
  useEffect(() => {
    if (isOpen) {
      const weights = loadWeights();
      setTotalEntries(weights.length);
      const fresh = generateProgressReport();
      setReport(fresh);
    }
  }, [isOpen]);

  const muscleGroups = useMemo(() => {
    if (!report) return {};
    return report.exerciseSummaries.reduce((acc, s) => {
      if (!acc[s.muscle]) acc[s.muscle] = [];
      acc[s.muscle].push(s);
      return acc;
    }, {} as Record<string, typeof report.exerciseSummaries>);
  }, [report]);

  const selectedData = useMemo(() => {
    if (!selectedExercise || !report) return null;
    const summary = report.exerciseSummaries.find(s => s.exerciseName === selectedExercise);
    if (!summary) return null;
    return summary.entries.map(e => ({
      date: new Date(e.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      peso: e.weight,
    }));
  }, [selectedExercise, report]);

  const progressingCount = report?.exerciseSummaries.filter(s => s.trend === "up").length || 0;
  const regressingCount = report?.exerciseSummaries.filter(s => s.trend === "down").length || 0;
  const stableCount = report?.exerciseSummaries.filter(s => s.trend === "stable").length || 0;

  const stats = report?.stats;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-secondary text-foreground hover:bg-secondary/80 active:scale-[0.98] mt-3">
          <BarChart3 className="w-4 h-4" />
          Análise de Progressão
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background border-border overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Análise de Progressão
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!report || (report.exerciseSummaries.length === 0 && !stats) ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Ainda não há dados suficientes. Preencha os pesos nos exercícios para gerar sua análise.
              </p>
              {totalEntries > 0 && (
                <p className="text-xs text-primary mt-3">
                  {totalEntries} registro{totalEntries > 1 ? "s" : ""} de carga já salvo{totalEntries > 1 ? "s" : ""}.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              {stats && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="rounded-xl bg-primary/10 p-3 text-center">
                    <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
                    <span className="text-lg font-bold text-primary">{stats.currentStreak}</span>
                    <span className="text-[10px] text-muted-foreground block">Streak atual</span>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3 text-center">
                    <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
                    <span className="text-lg font-bold text-foreground">{stats.bestStreak}</span>
                    <span className="text-[10px] text-muted-foreground block">Melhor streak</span>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3 text-center">
                    <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <span className="text-lg font-bold text-foreground">{stats.weeklyFrequency}x</span>
                    <span className="text-[10px] text-muted-foreground block">Freq. semanal</span>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3 text-center">
                    <Dumbbell className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <span className="text-lg font-bold text-foreground">{stats.totalWorkouts}</span>
                    <span className="text-[10px] text-muted-foreground block">Treinos totais</span>
                  </div>
                </motion.div>
              )}

              {/* Completion & Volume */}
              {stats && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <span className="text-[10px] text-muted-foreground block mb-1">Taxa de conclusão</span>
                    <div className="flex items-end gap-1">
                      <span className="text-lg font-bold text-foreground">{stats.completionRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <span className="text-[10px] text-muted-foreground block mb-1">Volume total</span>
                    <span className="text-lg font-bold text-foreground">
                      {stats.totalVolume > 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}t` : `${stats.totalVolume}kg`}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-1">Carga acumulada</span>
                  </div>
                </motion.div>
              )}

              {/* Personal Records */}
              {stats && stats.personalRecords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Award className="w-3 h-3" /> Recordes Pessoais
                  </h4>
                  <div className="space-y-1.5">
                    {stats.personalRecords.slice(0, 5).map((pr, i) => (
                      <div key={i} className="rounded-lg bg-secondary/50 p-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-foreground">{pr.exerciseName}</span>
                          <span className="text-[10px] text-muted-foreground block">{pr.muscle}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-primary">{pr.weight}kg</span>
                          {pr.previousRecord && (
                            <span className="text-[10px] text-muted-foreground block">
                              antes: {pr.previousRecord}kg
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Overall trend */}
              {report.exerciseSummaries.length > 0 && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-xl bg-secondary/50 p-4 flex items-center gap-3"
                  >
                    {trendIcons[report.overallTrend]}
                    <div>
                      <span className="font-semibold text-foreground text-sm block">Tendência Geral</span>
                      <span className={`text-xs ${trendColors[report.overallTrend]}`}>
                        {trendLabels[report.overallTrend]}
                      </span>
                    </div>
                  </motion.div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-primary/10 p-3 text-center">
                      <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                      <span className="text-lg font-bold text-primary">{progressingCount}</span>
                      <span className="text-[10px] text-muted-foreground block">Progredindo</span>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-3 text-center">
                      <Target className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                      <span className="text-lg font-bold text-foreground">{stableCount}</span>
                      <span className="text-[10px] text-muted-foreground block">Estáveis</span>
                    </div>
                    <div className="rounded-xl bg-destructive/10 p-3 text-center">
                      <Flame className="w-4 h-4 text-destructive mx-auto mb-1" />
                      <span className="text-lg font-bold text-destructive">{regressingCount}</span>
                      <span className="text-[10px] text-muted-foreground block">Em queda</span>
                    </div>
                  </div>

                  {/* Chart */}
                  <AnimatePresence mode="wait">
                    {selectedExercise && selectedData && selectedData.length >= 2 && (
                      <motion.div
                        key={selectedExercise}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl bg-secondary/50 p-3 overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-foreground">{selectedExercise}</span>
                          <button
                            onClick={() => setSelectedExercise(null)}
                            className="text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            Fechar
                          </button>
                        </div>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={selectedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                              axisLine={false}
                              tickLine={false}
                              width={30}
                              domain={["dataMin - 2", "dataMax + 2"]}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "11px",
                                color: "hsl(var(--foreground))",
                              }}
                              formatter={(value: number) => [`${value}kg`, "Peso"]}
                            />
                            <Line
                              type="monotone"
                              dataKey="peso"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={{ fill: "hsl(var(--primary))", r: 3 }}
                              activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-[10px] text-muted-foreground">
                    {totalEntries} registros totais • Toque em um exercício para ver o gráfico
                  </p>

                  {/* Per muscle group */}
                  {Object.entries(muscleGroups).map(([muscle, summaries]) => (
                    <motion.div
                      key={muscle}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {muscle}
                      </h4>
                      <div className="space-y-2">
                        {summaries.map((s, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedExercise(s.exerciseName === selectedExercise ? null : s.exerciseName)}
                            className={`w-full text-left rounded-xl p-3 transition-all ${
                              selectedExercise === s.exerciseName
                                ? "bg-primary/10 border border-primary/30"
                                : "bg-secondary/50 border border-transparent hover:border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-foreground text-sm truncate">{s.exerciseName}</span>
                              {trendIcons[s.trend]}
                            </div>
                            <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span>
                                Média: <strong className="text-foreground">{s.avgWeight}kg</strong>
                              </span>
                              <span>
                                Máx: <strong className="text-foreground">{s.maxWeight}kg</strong>
                              </span>
                              <span>
                                Min: <strong className="text-foreground">{s.minWeight}kg</strong>
                              </span>
                              {s.trend !== "insufficient" && (
                                <span
                                  className={
                                    s.changePercent > 0
                                      ? "text-primary font-semibold"
                                      : s.changePercent < 0
                                      ? "text-destructive font-semibold"
                                      : ""
                                  }
                                >
                                  {s.changePercent > 0 ? "+" : ""}
                                  {s.changePercent}%
                                </span>
                              )}
                            </div>
                            {/* Mini bar */}
                            {s.trend !== "insufficient" && (
                              <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    s.changePercent > 0
                                      ? "bg-primary"
                                      : s.changePercent < 0
                                      ? "bg-destructive"
                                      : "bg-muted-foreground"
                                  }`}
                                  style={{ width: `${Math.min(Math.abs(s.changePercent) * 5, 100)}%` }}
                                />
                              </div>
                            )}
                            <span className="text-[10px] text-muted-foreground mt-1 block">
                              {s.totalEntries} registro{s.totalEntries > 1 ? "s" : ""}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Atualização automática em tempo real
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProgressSheet;
