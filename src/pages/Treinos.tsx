import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Dumbbell, Sparkles, Loader2, TrendingUp, Calendar,
  Flame, RefreshCw, Timer, Target,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadPlan, savePlan } from "@/lib/storage";
import type { WorkoutPlan } from "@/lib/workout-generator";

interface PlanWithNotes extends WorkoutPlan {
  progressionNotes?: string;
}

interface Analysis {
  sessions: number;
  adherence: number | null;
  stagnant: string[];
  method: string | null;
}

const Treinos = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanWithNotes | null>(() => loadPlan() as PlanWithNotes | null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [history, setHistory] = useState<
    { id: string; title: string; created_at: string; days_per_week: number | null; is_active: boolean }[]
  >([]);
  const [progress, setProgress] = useState<
    { id: string; analyzed_at: string; workouts_completed: number | null; avg_completion_rate: number | null; recommendation: string | null }[]
  >([]);

  const fetchRemotePlan = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data }, { data: plans }, { data: logs }] = await Promise.all([
      supabase
        .from("workout_plans")
        .select("plan_data,updated_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("workout_plans")
        .select("id,title,created_at,days_per_week,is_active")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("progression_log")
        .select("id,analyzed_at,workouts_completed,avg_completion_rate,recommendation")
        .eq("user_id", user.id)
        .order("analyzed_at", { ascending: false })
        .limit(5),
    ]);
    if (data?.plan_data) {
      const remote = data.plan_data as unknown as PlanWithNotes;
      setPlan(remote);
      savePlan(remote);
      setUpdatedAt(data.updated_at);
      setActiveDay(0);
    }
    setHistory(plans ?? []);
    setProgress(logs ?? []);
  }, []);

  useEffect(() => { fetchRemotePlan(); }, [fetchRemotePlan]);


  // Atualiza automaticamente quando o chat (ou o modo avançado) regenera o plano.
  useEffect(() => {
    const onPlanUpdated = (e: Event) => {
      const next = (e as CustomEvent).detail as PlanWithNotes;
      if (next?.days) {
        setPlan(next);
        setActiveDay(0);
        setUpdatedAt(new Date().toISOString());
      }
      // Puxa também o histórico/progressão recém-gravados no banco.
      fetchRemotePlan();
    };

    window.addEventListener("fitforge:plan-updated", onPlanUpdated);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel("treinos-plan")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "workout_plans", filter: `user_id=eq.${user.id}` },
          () => fetchRemotePlan(),
        )
        .subscribe();
    });

    return () => {
      window.removeEventListener("fitforge:plan-updated", onPlanUpdated);
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchRemotePlan]);

  const generate = async () => {
    setGenerating(true);
    const t = toast.loading("Analisando seu histórico e montando o treino...");
    try {
      const { data, error } = await supabase.functions.invoke("smart-plan", { body: {} });
      const err = (data as any)?.error;
      if (error || err) throw new Error(err || error?.message || "Falha ao gerar treino");
      const next = (data as any).plan as PlanWithNotes;
      setPlan(next);
      savePlan(next);
      setAnalysis((data as any).analysis ?? null);
      setActiveDay(0);
      setUpdatedAt(new Date().toISOString());
      window.dispatchEvent(new CustomEvent("fitforge:plan-updated", { detail: next }));
      toast.success("Treino atualizado!", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar treino", { id: t });
    } finally {
      setGenerating(false);
    }
  };

  // Imagens da biblioteca de exercícios (associadas pelo nome normalizado).
  const [images, setImages] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("exercise_library")
        .select("name,image_url")
        .not("image_url", "is", null)
        .limit(1000);
      if (cancelled || !data) return;
      const map: Record<string, string> = {};
      for (const row of data) {
        if (row.image_url) map[normalizeName(row.name)] = row.image_url;
      }
      setImages(map);
    })();
    return () => { cancelled = true; };
  }, []);

  const totalExercises = useMemo(
    () => plan?.days?.reduce((s, d) => s + d.exercises.length, 0) ?? 0,
    [plan],
  );

  const day = plan?.days?.[activeDay];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-display tracking-[0.25em] text-primary uppercase">Programa</p>
            <h1 className="font-display text-2xl leading-none truncate">MEUS TREINOS</h1>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {plan ? "Atualizar" : "Gerar"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {!plan && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl">NENHUM PLANO ATIVO</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Gere um plano automático combinando grupos musculares, intensidade e progressão a partir
              do seu histórico — ou peça no chat da IA.
            </p>
          </div>
        )}

        {plan && (
          <>
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-2xl leading-tight">{plan.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Stat icon={<Calendar className="w-3.5 h-3.5" />} label="Dias/sem" value={String(plan.daysPerWeek ?? plan.days.length)} />
                <Stat icon={<Dumbbell className="w-3.5 h-3.5" />} label="Exercícios" value={String(totalExercises)} />
                <Stat
                  icon={<Flame className="w-3.5 h-3.5" />}
                  label="Adesão"
                  value={analysis?.adherence != null ? `${analysis.adherence}%` : "—"}
                />
              </div>
              {updatedAt && (
                <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Atualizado em {new Date(updatedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </section>

            {(plan.progressionNotes || analysis) && (
              <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
                <p className="text-[10px] font-display tracking-[0.25em] text-primary uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Progressão
                </p>
                {plan.progressionNotes && (
                  <p className="text-sm mt-2 leading-relaxed">{plan.progressionNotes}</p>
                )}
                {analysis && (
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <p>Sessões analisadas (60d): <strong className="text-foreground">{analysis.sessions}</strong></p>
                    {analysis.method && <p>Método ativo: <strong className="text-foreground">{analysis.method}</strong></p>}
                    {analysis.stagnant.length > 0 && (
                      <p>Estímulo trocado por estagnação em: <strong className="text-foreground">{analysis.stagnant.join(", ")}</strong></p>
                    )}
                  </div>
                )}
              </section>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1">
              {plan.days.map((d, i) => (
                <button
                  key={`${d.day}-${i}`}
                  onClick={() => setActiveDay(i)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    i === activeDay
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d.day}
                </button>
              ))}
            </div>

            {day && (
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-xl">{day.focus}</h3>
                </div>
                {day.exercises.map((ex, i) => (
                  <article key={`${ex.name}-${i}`} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm">{ex.name}</h4>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{ex.muscle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-lg leading-none text-primary">{ex.sets}×{ex.reps}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                          <Timer className="w-3 h-3" />{ex.rest}
                        </p>
                      </div>
                    </div>
                    {ex.tip && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">💡 {ex.tip}</p>}
                  </article>
                ))}
              </section>
            )}
          </>
        )}

        {progress.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-display tracking-[0.25em] text-primary uppercase flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Histórico de progressão
            </p>
            <div className="mt-3 space-y-3">
              {progress.map((p) => (
                <div key={p.id} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.analyzed_at).toLocaleDateString("pt-BR")} ·{" "}
                    {p.workouts_completed ?? 0} sessões
                    {p.avg_completion_rate != null ? ` · adesão ${Math.round(Number(p.avg_completion_rate))}%` : ""}
                  </p>
                  {p.recommendation && <p className="text-sm mt-1 leading-relaxed">{p.recommendation}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-display tracking-[0.25em] text-primary uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Planos salvos
            </p>
            <ul className="mt-3 space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    {h.title}
                    {h.is_active && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">ativo</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(h.created_at).toLocaleDateString("pt-BR")}
                    {h.days_per_week ? ` · ${h.days_per_week}x` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

      </main>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl bg-secondary/50 border border-border/50 p-3">
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">{icon}{label}</p>
    <p className="font-display text-xl mt-1">{value}</p>
  </div>
);

export default Treinos;
