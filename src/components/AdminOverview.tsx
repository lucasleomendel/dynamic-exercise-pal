import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Activity, History, TrendingUp, Users } from "lucide-react";

export interface OvProfile { user_id: string; name: string | null; email: string | null; level: string | null; goal: string | null; }
export interface OvPlan { id: string; user_id: string; title: string; is_active: boolean | null; updated_at: string; plan_data: any; }

interface HistoryRow { user_id: string; workout_date: string; completed_exercises: number; total_exercises: number; day_focus: string | null; }

const LEVELS = [
  { key: "iniciante", label: "Iniciante" },
  { key: "intermediario", label: "Intermediário" },
  { key: "avancado", label: "Avançado" },
  { key: "sem", label: "Sem nível" },
];
const norm = (l: string | null) => {
  const v = (l ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return LEVELS.some(x => x.key === v) ? v : "sem";
};
const fmt = (d: string) => new Date(d).toLocaleDateString("pt-BR");

export const AdminOverview = ({ profiles, plans, onOpenStudent }: { profiles: OvProfile[]; plans: OvPlan[]; onOpenStudent: (p: OvProfile) => void }) => {
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    supabase.from("workout_history").select("user_id,workout_date,completed_exercises,total_exercises,day_focus")
      .gte("workout_date", since).order("workout_date", { ascending: false }).limit(2000)
      .then(({ data }) => setHistory((data ?? []) as HistoryRow[]));
  }, []);

  const levelOf = useMemo(() => new Map(profiles.map(p => [p.user_id, norm(p.level)])), [profiles]);
  const activePlans = plans.filter(p => p.is_active);
  const activeUsers7 = new Set(history.filter(h => Date.now() - +new Date(h.workout_date) < 7 * 86_400_000).map(h => h.user_id)).size;
  const avgCompletion = history.length
    ? Math.round(history.reduce((s, h) => s + (h.total_exercises ? h.completed_exercises / h.total_exercises : 0), 0) / history.length * 100)
    : 0;

  const byLevel = LEVELS.map(l => {
    const ps = activePlans.filter(p => (levelOf.get(p.user_id) ?? "sem") === l.key);
    const ex = ps.map(p => (p.plan_data?.days ?? []).reduce((s: number, d: any) => s + (d.exercises?.length ?? 0), 0) / Math.max(p.plan_data?.days?.length ?? 1, 1));
    return { ...l, plans: ps, students: profiles.filter(p => norm(p.level) === l.key).length, avgEx: ex.length ? (ex.reduce((a, b) => a + b, 0) / ex.length).toFixed(1) : "—" };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={<Users className="w-4 h-4" />} label="Alunos" value={profiles.length} />
        <Metric icon={<Activity className="w-4 h-4" />} label="Ativos (7 dias)" value={activeUsers7} />
        <Metric icon={<History className="w-4 h-4" />} label="Treinos feitos (30 dias)" value={history.length} />
        <Metric icon={<TrendingUp className="w-4 h-4" />} label="Conclusão média" value={`${avgCompletion}%`} />
      </div>

      <div className="space-y-3">
        <h2 className="text-xl">Treinos por nível</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {byLevel.map(l => (
            <div key={l.key} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{l.label}</p>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-[10px]">{l.students} aluno(s)</Badge>
                  <Badge variant="outline" className="text-[10px]">{l.plans.length} treino(s) ativo(s)</Badge>
                  <Badge variant="outline" className="text-[10px]">{l.avgEx} exerc./dia</Badge>
                </div>
              </div>
              {l.plans.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum treino ativo.</p> : (
                <ul className="space-y-1">
                  {l.plans.slice(0, 8).map(p => {
                    const prof = profiles.find(x => x.user_id === p.user_id);
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">{p.title} <span className="text-muted-foreground">· {prof?.name || prof?.email || "—"}</span></span>
                        {prof && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onOpenStudent(prof)}>Histórico</Button>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Metric = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) => (
  <div className="rounded-xl border border-border bg-card p-3">
    <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}{label}</div>
    <p className="text-2xl font-semibold mt-1">{value}</p>
  </div>
);

export const StudentHistoryDialog = ({ student, plans, onClose }: { student: OvProfile | null; plans: OvPlan[]; onClose: () => void }) => {
  const [hist, setHist] = useState<HistoryRow[]>([]);
  const [prog, setProg] = useState<{ analyzed_at: string; recommendation: string | null; workouts_completed: number | null }[]>([]);
  const [weights, setWeights] = useState<{ exercise_name: string; weight: number; logged_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    const uid = student.user_id;
    Promise.all([
      supabase.from("workout_history").select("user_id,workout_date,completed_exercises,total_exercises,day_focus").eq("user_id", uid).order("workout_date", { ascending: false }).limit(30),
      supabase.from("progression_log").select("analyzed_at,recommendation,workouts_completed").eq("user_id", uid).order("analyzed_at", { ascending: false }).limit(10),
      supabase.from("weight_logs").select("exercise_name,weight,logged_at").eq("user_id", uid).order("logged_at", { ascending: false }).limit(20),
    ]).then(([h, p, w]) => {
      setHist((h.data ?? []) as HistoryRow[]); setProg(p.data ?? []); setWeights(w.data ?? []); setLoading(false);
    });
  }, [student]);

  const userPlans = student ? plans.filter(p => p.user_id === student.user_id) : [];

  return (
    <Dialog open={!!student} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{student?.name || student?.email} — histórico</DialogTitle></DialogHeader>
        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
          <div className="space-y-4 text-sm min-w-0 w-full overflow-hidden">
            <Section title={`Treinos (${userPlans.length})`}>
              {userPlans.map(p => <Row key={p.id} left={p.title} right={`${p.is_active ? "ativo · " : ""}${fmt(p.updated_at)}`} />)}
            </Section>
            <Section title={`Sessões realizadas (${hist.length})`}>
              {hist.map((h, i) => <Row key={i} left={`${fmt(h.workout_date)} · ${h.day_focus ?? "Treino"}`} right={`${h.completed_exercises}/${h.total_exercises}`} />)}
            </Section>
            <Section title="Cargas recentes">
              {weights.map((w, i) => <Row key={i} left={w.exercise_name} right={`${w.weight} kg · ${fmt(w.logged_at)}`} />)}
            </Section>
            <Section title="Progressão automática">
              {prog.map((p, i) => <Row key={i} left={p.recommendation ?? "—"} right={fmt(p.analyzed_at)} />)}
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const empty = Array.isArray(children) && children.length === 0;
  return (
    <div>
      <p className="font-semibold mb-1">{title}</p>
      {empty ? <p className="text-xs text-muted-foreground">Sem registros.</p> : <div className="space-y-1">{children}</div>}
    </div>
  );
};
const Row = ({ left, right }: { left: string; right: string }) => (
  <div className="flex justify-between gap-3 rounded-md bg-muted/40 px-2 py-1">
    <span className="truncate min-w-0">{left}</span><span className="text-muted-foreground shrink-0 text-xs">{right}</span>
  </div>
);
