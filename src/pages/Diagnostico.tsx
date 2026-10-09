import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isMasterAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Activity } from "lucide-react";

type Status = "idle" | "running" | "ok" | "fail";

interface Check {
  key: string;
  label: string;
  detail?: string;
  status: Status;
}

const initial: Check[] = [
  { key: "env", label: "Variáveis de ambiente (.env)", status: "idle" },
  { key: "auth", label: "Sessão Supabase Auth", status: "idle" },
  { key: "db_profiles", label: "DB · profiles (SELECT)", status: "idle" },
  { key: "db_plans", label: "DB · workout_plans (SELECT)", status: "idle" },
  { key: "db_history", label: "DB · workout_history (SELECT)", status: "idle" },
  { key: "db_library", label: "DB · exercise_library (público)", status: "idle" },
  { key: "edge_cref", label: "Edge Function · validate-cref", status: "idle" },
  { key: "edge_ai", label: "Edge Function · ai-chat (ping)", status: "idle" },
  { key: "calc_bmi", label: "Calculadora · IMC", status: "idle" },
  { key: "calc_tdee", label: "Calculadora · TDEE (Mifflin-St Jeor)", status: "idle" },
  { key: "calc_water", label: "Calculadora · Hidratação", status: "idle" },
  { key: "validator_cpf", label: "Validador · CPF (dígitos)", status: "idle" },
];

// --- Calculadoras de referência ---
const bmi = (w: number, h: number) => w / (h * h);
const tdee = (w: number, h: number, age: number, sex: "M" | "F") => {
  const bmr = sex === "M" ? 10 * w + 6.25 * h * 100 - 5 * age + 5 : 10 * w + 6.25 * h * 100 - 5 * age - 161;
  return bmr * 1.55;
};
const waterMl = (w: number, workoutHours = 0) => Math.round(w * 35 + workoutHours * 500);

const validateCPF = (cpf: string): boolean => {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(c[10]);
};

const Diagnostico = () => {
  const { user, loading } = useAuth();
  const [checks, setChecks] = useState<Check[]>(initial);
  const [running, setRunning] = useState(false);

  const update = (key: string, status: Status, detail?: string) =>
    setChecks((cs) => cs.map((c) => (c.key === key ? { ...c, status, detail } : c)));

  const runAll = async () => {
    setRunning(true);
    setChecks(initial.map((c) => ({ ...c, status: "running" })));

    // ENV
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    update("env", url && key ? "ok" : "fail", `URL: ${url ? "✓" : "✗"} · KEY: ${key ? "✓" : "✗"}`);

    // Auth
    try {
      const { data } = await supabase.auth.getSession();
      update("auth", data.session ? "ok" : "fail", data.session ? `user: ${data.session.user.email}` : "sem sessão");
    } catch (e) { update("auth", "fail", String(e)); }

    // DB tables
    const tableCheck = async (key: string, table: string, scoped = true) => {
      try {
        let q = supabase.from(table as never).select("*", { count: "exact", head: true });
        if (scoped && user) q = (q as any).eq("user_id", user.id);
        const { count, error } = await q;
        if (error) throw error;
        update(key, "ok", `${count ?? 0} registros`);
      } catch (e: any) { update(key, "fail", e.message ?? String(e)); }
    };
    await tableCheck("db_profiles", "profiles");
    await tableCheck("db_plans", "workout_plans");
    await tableCheck("db_history", "workout_history");
    await tableCheck("db_library", "exercise_library", false);

    // Edge: CREF (dry-run com formato válido fake)
    try {
      const { data, error } = await supabase.functions.invoke("validate-cref", {
        body: { cref: "000000-G/SP", userId: user?.id, dryRun: true },
      });
      if (error) throw error;
      update("edge_cref", "ok", `resposta: ${JSON.stringify(data).slice(0, 80)}`);
    } catch (e: any) { update("edge_cref", "fail", e.message ?? String(e)); }

    // Edge: AI ping
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: [{ role: "user", content: "ping" }], ping: true },
      });
      if (error) throw error;
      update("edge_ai", "ok", "AI Gateway respondeu");
    } catch (e: any) { update("edge_ai", "fail", e.message ?? String(e)); }

    // Calculadoras
    const imc = bmi(75, 1.78);
    update("calc_bmi", imc > 23 && imc < 24 ? "ok" : "fail", `75kg / 1.78m = ${imc.toFixed(2)}`);

    const cal = tdee(75, 1.78, 30, "M");
    update("calc_tdee", cal > 2500 && cal < 2900 ? "ok" : "fail", `≈ ${Math.round(cal)} kcal/dia`);

    const water = waterMl(75, 1);
    update("calc_water", water === 3125 ? "ok" : "fail", `${water} ml/dia`);

    // CPF
    const cpfOk = validateCPF("11144477735") && !validateCPF("12345678900");
    update("validator_cpf", cpfOk ? "ok" : "fail", cpfOk ? "valida e rejeita corretamente" : "lógica quebrada");

    setRunning(false);
  };

  useEffect(() => {
    if (user) runAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) return null;
  if (!user || !isMasterAdmin(user)) return <Navigate to="/" replace />;

  const okCount = checks.filter((c) => c.status === "ok").length;
  const failCount = checks.filter((c) => c.status === "fail").length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl text-foreground tracking-wide">DIAGNÓSTICO</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">System health · master admin</p>
          </div>
          <Button onClick={runAll} disabled={running} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
            {running ? "Rodando..." : "Rodar testes"}
          </Button>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground uppercase">Total</div>
            <div className="font-display text-3xl">{checks.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-emerald-500 uppercase">OK</div>
            <div className="font-display text-3xl text-emerald-500">{okCount}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-destructive uppercase">Falhas</div>
            <div className="font-display text-3xl text-destructive">{failCount}</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {checks.map((c) => (
            <div key={c.key} className="flex items-center gap-3 p-3">
              <div className="w-5 h-5 shrink-0">
                {c.status === "ok" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {c.status === "fail" && <XCircle className="w-5 h-5 text-destructive" />}
                {c.status === "running" && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                {c.status === "idle" && <Activity className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{c.label}</div>
                {c.detail && <div className="text-xs text-muted-foreground truncate">{c.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Diagnostico;
