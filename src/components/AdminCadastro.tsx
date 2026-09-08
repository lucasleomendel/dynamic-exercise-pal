import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, Sparkles, Trash2, UserPlus, Link2 } from "lucide-react";

interface StudentRow {
  id: string;
  user_id: string | null;
  full_name: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  goal: string | null;
  level: string | null;
  weight: number | null;
  height: number | null;
  created_at: string | null;
}

interface LinkRow {
  id: string;
  personal_id: string;
  student_id: string;
}

interface PersonalRow {
  id: string;
  email: string | null;
  role: string | null;
}

const onlyDigits = (v: string) => v.replace(/\D/g, "");

const emptyStudent = (): Partial<StudentRow> => ({
  full_name: "", cpf: "", email: "", phone: "", goal: "", level: "iniciante",
});

const AdminCadastro = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [personals, setPersonals] = useState<PersonalRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Partial<StudentRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [linkFor, setLinkFor] = useState<StudentRow | null>(null);
  const [linkPersonal, setLinkPersonal] = useState<string>("");

  const load = useCallback(async () => {
    setBusy(true);
    const [s, l, p] = await Promise.all([
      supabase.from("students").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("personal_student_links").select("id,personal_id,student_id"),
      supabase.rpc("list_personals"),
    ]);
    if (s.error) {
      toast({ title: "Falha ao carregar alunos", description: s.error.message, variant: "destructive" });
    }
    setStudents((s.data ?? []) as StudentRow[]);
    setLinks((l.data ?? []) as LinkRow[]);
    setPersonals((p.data ?? []) as PersonalRow[]);
    setBusy(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const personalById = useMemo(() => {
    const m = new Map<string, string>();
    personals.forEach(p => m.set(p.id, p.email ?? p.id.slice(0, 8)));
    return m;
  }, [personals]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return students;
    return students.filter(s =>
      s.full_name.toLowerCase().includes(term) ||
      (s.email ?? "").toLowerCase().includes(term) ||
      s.cpf.includes(onlyDigits(term)));
  }, [students, q]);

  const saveStudent = async () => {
    if (!form?.full_name?.trim() || onlyDigits(form.cpf ?? "").length !== 11) {
      toast({ title: "Informe nome e um CPF com 11 dígitos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      cpf: onlyDigits(form.cpf ?? ""),
      email: form.email?.trim() || null,
      phone: form.phone ? onlyDigits(form.phone) : null,
      goal: form.goal || null,
      level: form.level || null,
      weight: form.weight ?? null,
      height: form.height ?? null,
    };
    const { error } = form.id
      ? await supabase.from("students").update(payload).eq("id", form.id)
      : await supabase.from("students").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
      return;
    }
    await logAudit({
      action: form.id ? "atualizar" : "criar",
      entity: "aluno",
      entityId: form.id ?? null,
      entityLabel: payload.full_name,
    });
    toast({ title: form.id ? "Aluno atualizado" : "Aluno cadastrado" });
    setForm(null);
    load();
  };

  const removeStudent = async (s: StudentRow) => {
    const { error } = await supabase.from("students").delete().eq("id", s.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    await logAudit({ action: "excluir", entity: "aluno", entityId: s.id, entityLabel: s.full_name });
    toast({ title: "Aluno removido" });
    load();
  };

  const saveLink = async () => {
    if (!linkFor || !linkPersonal) return;
    const { error } = await supabase.from("personal_student_links")
      .insert({ personal_id: linkPersonal, student_id: linkFor.id });
    if (error) {
      toast({ title: "Não foi possível vincular", description: error.message, variant: "destructive" });
      return;
    }
    await logAudit({
      action: "vincular",
      entity: "permissao",
      entityId: linkFor.id,
      entityLabel: `${linkFor.full_name} → ${personalById.get(linkPersonal) ?? linkPersonal}`,
    });
    toast({ title: "Aluno vinculado ao personal" });
    setLinkFor(null);
    setLinkPersonal("");
    load();
  };

  const removeLink = async (link: LinkRow) => {
    const { error } = await supabase.from("personal_student_links").delete().eq("id", link.id);
    if (error) {
      toast({ title: "Erro ao remover vínculo", description: error.message, variant: "destructive" });
      return;
    }
    await logAudit({ action: "desvincular", entity: "permissao", entityId: link.student_id });
    load();
  };

  const generatePlan = async (s: StudentRow) => {
    if (!s.user_id) {
      toast({
        title: "Aluno sem login",
        description: "O aluno precisa ter uma conta no app para receber o treino.",
        variant: "destructive",
      });
      return;
    }
    setGenerating(s.id);
    const { data, error } = await supabase.functions.invoke("smart-plan", {
      body: { targetUserId: s.user_id, focus: `Plano montado pelo administrador para ${s.full_name}` },
    });
    setGenerating(null);
    const err = (data as { error?: string } | null)?.error;
    if (error || err) {
      toast({ title: "Falha ao gerar treino", description: err || error?.message, variant: "destructive" });
      return;
    }
    await logAudit({ action: "criar", entity: "treino", entityId: s.id, entityLabel: `treino de ${s.full_name}` });
    toast({ title: "Treino gerado", description: `Já está ativo para ${s.full_name}.` });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar aluno por nome, e-mail ou CPF" className="pl-9" />
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setForm(emptyStudent())}>
          <Plus className="w-4 h-4" /> Novo aluno
        </Button>
      </div>

      {busy && <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
      {!busy && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum aluno cadastrado ainda.</p>
      )}

      <div className="space-y-2">
        {filtered.map(s => {
          const myLinks = links.filter(l => l.student_id === s.id);
          return (
            <div key={s.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.email || "sem e-mail"} · CPF {s.cpf}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.level && <Badge variant="secondary" className="text-[10px]">{s.level}</Badge>}
                    {s.goal && <Badge variant="outline" className="text-[10px]">{s.goal}</Badge>}
                    <Badge variant={s.user_id ? "default" : "outline"} className="text-[10px]">
                      {s.user_id ? "com login" : "sem login"}
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setForm(s)}>Editar</Button>
                <Button size="icon" variant="ghost" onClick={() => { setLinkFor(s); setLinkPersonal(""); }} title="Vincular personal">
                  <Link2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={generating === s.id}
                  onClick={() => generatePlan(s)}
                  title="Gerar treino"
                >
                  {generating === s.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Sparkles className="w-4 h-4 text-primary" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => removeStudent(s)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              {myLinks.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {myLinks.map(l => (
                    <button
                      key={l.id}
                      onClick={() => removeLink(l)}
                      className="text-[10px] px-2 py-1 rounded-full border border-border hover:border-destructive hover:text-destructive transition-colors"
                      title="Remover vínculo"
                    >
                      Personal: {personalById.get(l.personal_id) ?? l.personal_id.slice(0, 8)} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* cadastro / edição */}
      <Dialog open={!!form} onOpenChange={o => !o && setForm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> {form?.id ? "Editar aluno" : "Cadastrar aluno"}
            </DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <Input placeholder="Nome completo" value={form.full_name ?? ""} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="CPF" value={form.cpf ?? ""} onChange={e => setForm({ ...form, cpf: onlyDigits(e.target.value).slice(0, 11) })} />
                <Input placeholder="Telefone" value={form.phone ?? ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <Input placeholder="E-mail" value={form.email ?? ""} onChange={e => setForm({ ...form, email: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Objetivo" value={form.goal ?? ""} onChange={e => setForm({ ...form, goal: e.target.value })} />
                <Input placeholder="Nível" value={form.level ?? ""} onChange={e => setForm({ ...form, level: e.target.value })} />
                <Input type="number" placeholder="Peso (kg)" value={form.weight ?? ""} onChange={e => setForm({ ...form, weight: e.target.value ? Number(e.target.value) : null })} />
                <Input type="number" placeholder="Altura (cm)" value={form.height ?? ""} onChange={e => setForm({ ...form, height: e.target.value ? Number(e.target.value) : null })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={saveStudent} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* vínculo com personal */}
      <Dialog open={!!linkFor} onOpenChange={o => !o && setLinkFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Vincular a um personal</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{linkFor?.full_name}</p>
          <Select value={linkPersonal} onValueChange={setLinkPersonal}>
            <SelectTrigger><SelectValue placeholder="Escolha o personal" /></SelectTrigger>
            <SelectContent>
              {personals.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.email ?? p.id.slice(0, 8)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {personals.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum personal cadastrado no app ainda.</p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkFor(null)}>Cancelar</Button>
            <Button onClick={saveLink} disabled={!linkPersonal}>Vincular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCadastro;
