import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TrendingUp, TrendingDown, Minus, BarChart3, AlertCircle } from "lucide-react";
import { ProgressReport, generateProgressReport, shouldRegenerateReport } from "@/lib/progress";
import { loadReport, saveReport } from "@/lib/storage";

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

const ProgressSheet = () => {
  const [report, setReport] = useState<ProgressReport | null>(null);

  useEffect(() => {
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
            </div>
          ) : (
            <>
              {/* Overall */}
              <div className="rounded-xl bg-secondary/50 p-4 flex items-center gap-3">
                {trendIcons[report.overallTrend]}
                <div>
                  <span className="font-semibold text-foreground text-sm block">Tendência Geral</span>
                  <span className="text-xs text-muted-foreground">{trendLabels[report.overallTrend]}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Período: {report.weekStart} a {report.weekEnd}
              </p>

              {/* Per exercise */}
              <div className="space-y-2">
                {report.exerciseSummaries.map((s, i) => (
                  <div key={i} className="rounded-xl bg-secondary/50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground text-sm truncate">{s.exerciseName}</span>
                      {trendIcons[s.trend]}
                    </div>
                    <span className="text-xs text-muted-foreground block">{s.muscle}</span>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Média: <strong className="text-foreground">{s.avgWeight}kg</strong></span>
                      <span>Máx: <strong className="text-foreground">{s.maxWeight}kg</strong></span>
                      {s.trend !== "insufficient" && (
                        <span className={s.changePercent > 0 ? "text-primary" : s.changePercent < 0 ? "text-destructive" : ""}>
                          {s.changePercent > 0 ? "+" : ""}{s.changePercent}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

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
