import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TrendingUp, TrendingDown, Minus, BarChart3, AlertCircle, Flame, Trophy, Target } from "lucide-react";
import { ProgressReport, generateProgressReport, shouldRegenerateReport } from "@/lib/progress";
import { loadReport, saveReport, loadWeights } from "@/lib/storage";

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

  useEffect(() => {
    const weights = loadWeights();
    setTotalEntries(weights.length);

    let saved = loadReport();
    if (shouldRegenerateReport(saved)) {
      const fresh = generateProgressReport();
      if (fresh) {
        saveReport(fresh);
        saved = fresh;
      }
    }
    setReport(saved);
  }, []);

  const muscleGroups = report?.exerciseSummaries.reduce((acc, s) => {
    if (!acc[s.muscle]) acc[s.muscle] = [];
    acc[s.muscle].push(s);
    return acc;
  }, {} as Record<string, typeof report.exerciseSummaries>) || {};

  const progressingCount = report?.exerciseSummaries.filter(s => s.trend === 'up').length || 0;
  const regressingCount = report?.exerciseSummaries.filter(s => s.trend === 'down').length || 0;
  const stableCount = report?.exerciseSummaries.filter(s => s.trend === 'stable').length || 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-secondary text-foreground hover:bg-secondary/80 active:scale-[0.98] mt-3">
          <BarChart3 className="w-4 h-4" />
          Análise de Progressão
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Análise de Progressão
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!report || report.exerciseSummaries.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Ainda não há dados suficientes. Preencha os pesos nos exercícios para gerar sua análise.
              </p>
              <p className="text-muted-foreground text-xs mt-2">
                A análise é atualizada automaticamente a cada 7 dias.
              </p>
              {totalEntries > 0 && (
                <p className="text-xs text-primary mt-3">
                  {totalEntries} registro{totalEntries > 1 ? 's' : ''} de carga já salvo{totalEntries > 1 ? 's' : ''}.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Overall trend */}
              <div className="rounded-xl bg-secondary/50 p-4 flex items-center gap-3">
                {trendIcons[report.overallTrend]}
                <div>
                  <span className="font-semibold text-foreground text-sm block">Tendência Geral</span>
                  <span className={`text-xs ${trendColors[report.overallTrend]}`}>{trendLabels[report.overallTrend]}</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-primary/10 p-3 text-center">
                  <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
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

              <p className="text-xs text-muted-foreground">
                Período: {report.weekStart} a {report.weekEnd} • {totalEntries} registros totais
              </p>

              {/* Per muscle group */}
              {Object.entries(muscleGroups).map(([muscle, summaries]) => (
                <div key={muscle}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{muscle}</h4>
                  <div className="space-y-2">
                    {summaries.map((s, i) => (
                      <div key={i} className="rounded-xl bg-secondary/50 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-foreground text-sm truncate">{s.exerciseName}</span>
                          {trendIcons[s.trend]}
                        </div>
                        <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                          <span>Média: <strong className="text-foreground">{s.avgWeight}kg</strong></span>
                          <span>Máx: <strong className="text-foreground">{s.maxWeight}kg</strong></span>
                          {s.trend !== "insufficient" && (
                            <span className={s.changePercent > 0 ? "text-primary font-semibold" : s.changePercent < 0 ? "text-destructive font-semibold" : ""}>
                              {s.changePercent > 0 ? "+" : ""}{s.changePercent}%
                            </span>
                          )}
                        </div>
                        {/* Mini bar representing change */}
                        {s.trend !== "insufficient" && (
                          <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${s.changePercent > 0 ? 'bg-primary' : s.changePercent < 0 ? 'bg-destructive' : 'bg-muted-foreground'}`}
                              style={{ width: `${Math.min(Math.abs(s.changePercent) * 5, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-xs text-muted-foreground text-center">
                Atualização automática a cada 7 dias
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProgressSheet;
