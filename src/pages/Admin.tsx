import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isMasterAdmin } from "@/lib/admin";
import AdminCadastro from "@/components/AdminCadastro";
import { logAudit } from "@/lib/audit";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Dumbbell, Loader2, Lock, Pencil, Plus, RefreshCw, Search, Trash2, Users, ClipboardList,
} from "lucide-react";

/* ---------------------------------- tipos --------------------------------- */

interface ProfileRow {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  level: string | null;
  goal: string | null;
  weight: number | null;
  height: number | null;
  days_per_week: number | null;
  advanced_mode: boolean | null;
  training_method: string | null;
  created_at: string;
}

interface PlanRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  days_per_week: number | null;
  is_active: boolean | null;
  updated_at: string;
  plan_data: any;
}

interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  difficulty: string | null;
  default_sets: number | null;
  default_reps: string | null;
  default_rest: string | null;
  technique_tip: string | null;
  image_url: string | null;
  active: boolean | null;
}

const titleFont = { fontFamily: "'Bebas Neue', 'Barlow', sans-serif" };

/* ------------------------------- componente ------------------------------- */

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    if (loading) return;
    if (!user) { setChecked(true); return; }
    if (isMasterAdmin(user)) { setAllowed(true); setChecked(true); return; }
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setAllowed(isMasterAdmin(data?.user ?? null));
      setChecked(true);
    })();
    return () => { active = false; };
  }, [user, loading]);

  if (loading || !checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold" style={titleFont}>Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Esta área é exclusiva do administrador geral do app.
          </p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar ao app
          </Button>
        </div>
      </div>
    );
  }

  return <AdminPanel />;
};

/* --------------------------------- painel --------------------------------- */

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [busy, setBusy] = useState(true);

  const [qUser, setQUser] = useState("");
  const [qPlan, setQPlan] = useState("");
  const [qEx, setQEx] = useState("");

  const [editProfile, setEditProfile] = useState<ProfileRow | null>(null);
  const [editExercise, setEditExercise] = useState<Partial<ExerciseRow> | null>(null);
  const [viewPlan, setViewPlan] = useState<PlanRow | null>(null);
  const [confirm, setConfirm] = useState<{ label: string; run: () => Promise<void> } | null>(null);

  const loadAll = useCallback(async () => {
    setBusy(true);
    const [p, w, e] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("workout_plans").select("*").order("updated_at", { ascending: false }).limit(500),
      supabase.from("exercise_library").select("*").order("name").limit(1000),
    ]);
    if (p.error || w.error || e.error) {
      toast({
        title: "Falha ao carregar dados",
        description: p.error?.message || w.error?.message || e.error?.message,
        variant: "destructive",
      });
    }
    setProfiles((p.data ?? []) as ProfileRow[]);
    setPlans((w.data ?? []) as PlanRow[]);
    setExercises((e.data ?? []) as ExerciseRow[]);
    setBusy(false);
  }, [toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const nameByUser = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach(p => m.set(p.user_id, p.name || p.email || p.user_id.slice(0, 8)));
    return m;
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    const q = qUser.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(p =>
      (p.name ?? "").toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q));
  }, [profiles, qUser]);

  const filteredPlans = useMemo(() => {
    const q = qPlan.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (nameByUser.get(p.user_id) ?? "").toLowerCase().includes(q));
  }, [plans, qPlan, nameByUser]);

  const filteredExercises = useMemo(() => {
    const q = qEx.trim().toLowerCase();
    if (!q) return exercises.slice(0, 200);
    return exercises.filter(e =>
      e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q)).slice(0, 200);
  }, [exercises, qEx]);

  /* ------------------------------- ações ------------------------------- */

  const saveProfile = async () => {
    if (!editProfile) return;
    const { id, name, level, goal, weight, height, days_per_week } = editProfile;
    const { error } = await supabase.from("profiles")
      .update({ name, level, goal, weight, height, days_per_week })
      .eq("id", id);
    if (error) {
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
      return;
    }
    await logAudit({ action: "atualizar", entity: "aluno", entityId: id, entityLabel: name ?? undefined });
    toast({ title: "Aluno atualizado" });
    setEditProfile(null);
    loadAll();
  };

  const deletePlan = (plan: PlanRow) => setConfirm({
    label: `Excluir o treino "${plan.title}"?`,
    run: async () => {
      const { error } = await supabase.from("workout_plans").delete().eq("id", plan.id);
      if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
      await logAudit({ action: "excluir", entity: "treino", entityId: plan.id, entityLabel: plan.title });
      toast({ title: "Treino excluído" });
      loadAll();
    },
  });

  const saveExercise = async () => {
    if (!editExercise?.name || !editExercise.muscle_group) {
      toast({ title: "Preencha nome e grupo muscular", variant: "destructive" });
      return;
    }
    const payload = {
      name: editExercise.name,
      muscle_group: editExercise.muscle_group,
      equipment: editExercise.equipment ?? null,
      difficulty: editExercise.difficulty ?? null,
      default_sets: editExercise.default_sets ?? null,
      default_reps: editExercise.default_reps ?? null,
      default_rest: editExercise.default_rest ?? null,
      technique_tip: editExercise.technique_tip ?? null,
      active: editExercise.active ?? true,
    };
    const { error } = editExercise.id
      ? await supabase.from("exercise_library").update(payload).eq("id", editExercise.id)
      : await supabase.from("exercise_library").insert(payload);
    if (error) {
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
      return;
    }
    await logAudit({
      action: editExercise.id ? "atualizar" : "criar",
      entity: "treino",
      entityId: editExercise.id ?? null,
      entityLabel: `exercício: ${payload.name}`,
    });
    toast({ title: editExercise.id ? "Exercício atualizado" : "Exercício criado" });
    setEditExercise(null);
    loadAll();
  };

  const deleteExercise = (ex: ExerciseRow) => setConfirm({
    label: `Excluir o exercício "${ex.name}"?`,
    run: async () => {
      const { error } = await supabase.from("exercise_library").delete().eq("id", ex.id);
      if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
      await logAudit({ action: "excluir", entity: "treino", entityId: ex.id, entityLabel: `exercício: ${ex.name}` });
      toast({ title: "Exercício excluído" });
      loadAll();
    },
  });

  const toggleExerciseActive = async (ex: ExerciseRow, next: boolean) => {
    setExercises(prev => prev.map(e => (e.id === ex.id ? { ...e, active: next } : e)));
    const { error } = await supabase.from("exercise_library").update({ active: next }).eq("id", ex.id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      loadAll();
    }
  };

  /* -------------------------------- render -------------------------------- */

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl leading-none" style={titleFont}>PAINEL ADMIN</h1>
            <p className="text-xs text-muted-foreground">Alunos, treinos e exercícios em um só lugar</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadAll} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Users className="w-4 h-4" />} label="Alunos" value={profiles.length} />
          <StatCard icon={<ClipboardList className="w-4 h-4" />} label="Treinos" value={plans.length} />
          <StatCard icon={<Dumbbell className="w-4 h-4" />} label="Exercícios" value={exercises.length} />
        </div>

        <Tabs defaultValue="cadastro">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
            <TabsTrigger value="alunos">Alunos</TabsTrigger>
            <TabsTrigger value="treinos">Treinos</TabsTrigger>
            <TabsTrigger value="exercicios">Exercícios</TabsTrigger>
          </TabsList>

          <TabsContent value="cadastro">
            <AdminCadastro />
          </TabsContent>


          {/* ------------------------------ alunos ------------------------------ */}
          <TabsContent value="alunos" className="space-y-3">
            <SearchBar value={qUser} onChange={setQUser} placeholder="Buscar por nome ou e-mail" />
            {filteredProfiles.length === 0 && !busy && <Empty text="Nenhum aluno encontrado." />}
            <div className="space-y-2">
              {filteredProfiles.map(p => (
                <div key={p.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{p.name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email || "—"}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.level && <Badge variant="secondary" className="text-[10px]">{p.level}</Badge>}
                      {p.goal && <Badge variant="outline" className="text-[10px]">{p.goal}</Badge>}
                      {p.advanced_mode && <Badge className="text-[10px]">avançado</Badge>}
                      <Badge variant="outline" className="text-[10px]">
                        {plans.filter(w => w.user_id === p.user_id).length} treino(s)
                      </Badge>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setEditProfile(p)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ------------------------------ treinos ----------------------------- */}
          <TabsContent value="treinos" className="space-y-3">
            <SearchBar value={qPlan} onChange={setQPlan} placeholder="Buscar por treino ou aluno" />
            {filteredPlans.length === 0 && !busy && <Empty text="Nenhum treino encontrado." />}
            <div className="space-y-2">
              {filteredPlans.map(w => (
                <div key={w.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{w.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {nameByUser.get(w.user_id) ?? "Aluno sem perfil"} ·{" "}
                      {new Date(w.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {w.is_active && <Badge className="text-[10px]">ativo</Badge>}
                      <Badge variant="outline" className="text-[10px]">{w.days_per_week ?? "?"}x/sem</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setViewPlan(w)}>Ver</Button>
                  <Button size="icon" variant="ghost" onClick={() => deletePlan(w)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ---------------------------- exercícios ---------------------------- */}
          <TabsContent value="exercicios" className="space-y-3">
            <div className="flex gap-2">
              <SearchBar value={qEx} onChange={setQEx} placeholder="Buscar exercício ou músculo" />
              <Button className="gap-2 shrink-0" onClick={() => setEditExercise({ active: true })}>
                <Plus className="w-4 h-4" /> Novo
              </Button>
            </div>
            {filteredExercises.length === 0 && !busy && <Empty text="Nenhum exercício encontrado." />}
            <div className="space-y-2">
              {filteredExercises.map(e => (
                <div key={e.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                  {e.image_url
                    ? <img src={e.image_url} alt={e.name} loading="lazy" className="w-12 h-12 rounded-lg object-cover" />
                    : <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-muted-foreground" />
                      </div>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {e.muscle_group}{e.equipment ? ` · ${e.equipment}` : ""}{e.difficulty ? ` · ${e.difficulty}` : ""}
                    </p>
                  </div>
                  <Switch checked={!!e.active} onCheckedChange={v => toggleExerciseActive(e, v)} />
                  <Button size="icon" variant="ghost" onClick={() => setEditExercise(e)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteExercise(e)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* --------------------------- dialog: aluno --------------------------- */}
      <Dialog open={!!editProfile} onOpenChange={o => !o && setEditProfile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar aluno</DialogTitle></DialogHeader>
          {editProfile && (
            <div className="space-y-3">
              <Field label="Nome">
                <Input value={editProfile.name ?? ""} onChange={e => setEditProfile({ ...editProfile, name: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nível">
                  <Input value={editProfile.level ?? ""} onChange={e => setEditProfile({ ...editProfile, level: e.target.value })} />
                </Field>
                <Field label="Objetivo">
                  <Input value={editProfile.goal ?? ""} onChange={e => setEditProfile({ ...editProfile, goal: e.target.value })} />
                </Field>
                <Field label="Peso (kg)">
                  <Input type="number" value={editProfile.weight ?? ""} onChange={e => setEditProfile({ ...editProfile, weight: e.target.value ? Number(e.target.value) : null })} />
                </Field>
                <Field label="Altura (cm)">
                  <Input type="number" value={editProfile.height ?? ""} onChange={e => setEditProfile({ ...editProfile, height: e.target.value ? Number(e.target.value) : null })} />
                </Field>
                <Field label="Dias/semana">
                  <Input type="number" value={editProfile.days_per_week ?? ""} onChange={e => setEditProfile({ ...editProfile, days_per_week: e.target.value ? Number(e.target.value) : null })} />
                </Field>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditProfile(null)}>Cancelar</Button>
            <Button onClick={saveProfile}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------- dialog: exercício ------------------------- */}
      <Dialog open={!!editExercise} onOpenChange={o => !o && setEditExercise(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editExercise?.id ? "Editar exercício" : "Novo exercício"}</DialogTitle>
          </DialogHeader>
          {editExercise && (
            <div className="space-y-3">
              <Field label="Nome">
                <Input value={editExercise.name ?? ""} onChange={e => setEditExercise({ ...editExercise, name: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Grupo muscular">
                  <Input value={editExercise.muscle_group ?? ""} onChange={e => setEditExercise({ ...editExercise, muscle_group: e.target.value })} />
                </Field>
                <Field label="Equipamento">
                  <Input value={editExercise.equipment ?? ""} onChange={e => setEditExercise({ ...editExercise, equipment: e.target.value })} />
                </Field>
                <Field label="Dificuldade">
                  <Input value={editExercise.difficulty ?? ""} onChange={e => setEditExercise({ ...editExercise, difficulty: e.target.value })} />
                </Field>
                <Field label="Séries">
                  <Input type="number" value={editExercise.default_sets ?? ""} onChange={e => setEditExercise({ ...editExercise, default_sets: e.target.value ? Number(e.target.value) : null })} />
                </Field>
                <Field label="Repetições">
                  <Input value={editExercise.default_reps ?? ""} onChange={e => setEditExercise({ ...editExercise, default_reps: e.target.value })} />
                </Field>
                <Field label="Descanso">
                  <Input value={editExercise.default_rest ?? ""} onChange={e => setEditExercise({ ...editExercise, default_rest: e.target.value })} />
                </Field>
              </div>
              <Field label="Dica de técnica">
                <Input value={editExercise.technique_tip ?? ""} onChange={e => setEditExercise({ ...editExercise, technique_tip: e.target.value })} />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditExercise(null)}>Cancelar</Button>
            <Button onClick={saveExercise}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --------------------------- dialog: treino -------------------------- */}
      <Dialog open={!!viewPlan} onOpenChange={o => !o && setViewPlan(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewPlan?.title}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{viewPlan?.description}</p>
          <div className="space-y-3">
            {(viewPlan?.plan_data?.days ?? []).map((d: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <p className="font-semibold text-sm">{d.day} · {d.focus}</p>
                <ul className="mt-1 space-y-1">
                  {(d.exercises ?? []).map((ex: any, j: number) => (
                    <li key={j} className="text-xs text-muted-foreground">
                      {ex.name} — {ex.sets}x{ex.reps} · {ex.rest}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ------------------------------ confirmação ------------------------- */}
      <AlertDialog open={!!confirm} onOpenChange={o => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.label} Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { const c = confirm; setConfirm(null); await c?.run(); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* -------------------------------- auxiliares ------------------------------- */

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="rounded-xl border border-border bg-card p-3">
    <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}{label}</div>
    <p className="text-2xl leading-none mt-1" style={titleFont}>{value}</p>
  </div>
);

const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative flex-1">
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <p className="text-sm text-muted-foreground text-center py-8">{text}</p>
);

export default Admin;
