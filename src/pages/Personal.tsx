import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dumbbell, Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Save,
  ArrowLeft, Copy, Search, UserPlus, Users, Loader2, X, User, Phone, Mail
} from "lucide-react";
import { Exercise, WorkoutDay, WorkoutPlan } from "@/lib/workout-generator";
import { savePlan, saveProfile, loadProfile, loadPlan } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────
interface Student {
  id: string;
  full_name: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  sex: string | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  level: string | null;
  notes: string | null;
}

// ─── CPF Utils ────────────────────────────────────
function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[9]) !== check) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return parseInt(digits[10]) === check;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ─── Constants ────────────────────────────────────
const MUSCLE_OPTIONS = [
  "Peito", "Costas", "Quadríceps", "Posterior", "Glúteo", "Panturrilha",
  "Pernas", "Ombros", "Trapézio", "Bíceps", "Tríceps", "Abdômen",
];

const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  "Peito": ["Supino Reto com Barra", "Supino Inclinado com Halteres", "Crucifixo na Máquina", "Crossover", "Flexão de Braço"],
  "Costas": ["Puxada Frontal", "Remada Curvada", "Remada Unilateral", "Pulldown", "Remada Baixa", "Barra Fixa"],
  "Quadríceps": ["Agachamento Livre", "Leg Press 45°", "Cadeira Extensora", "Agachamento Hack", "Avanço com Halteres"],
  "Posterior": ["Stiff", "Mesa Flexora", "Cadeira Flexora", "Good Morning"],
  "Glúteo": ["Elevação Pélvica (Hip Thrust)", "Abdução de Quadril", "Glúteo no Cabo"],
  "Panturrilha": ["Panturrilha no Smith", "Panturrilha Sentado", "Panturrilha no Leg Press"],
  "Pernas": ["Agachamento Livre", "Leg Press 45°", "Cadeira Extensora", "Mesa Flexora", "Stiff", "Avanço"],
  "Ombros": ["Desenvolvimento com Halteres", "Elevação Lateral", "Elevação Frontal", "Face Pull"],
  "Trapézio": ["Encolhimento com Barra", "Encolhimento com Halteres"],
  "Bíceps": ["Rosca Direta com Barra", "Rosca Alternada", "Rosca Martelo", "Rosca Scott"],
  "Tríceps": ["Tríceps Pulley", "Tríceps Testa", "Tríceps Francês", "Mergulho no Banco"],
  "Abdômen": ["Abdominal Crunch", "Prancha", "Elevação de Pernas", "Russian Twist"],
};

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface DayForm {
  day: string;
  focus: string;
  exercises: ExerciseForm[];
}

interface ExerciseForm {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  muscle: string;
}

const emptyExercise = (): ExerciseForm => ({ name: "", sets: 3, reps: "10-12", rest: "60s", muscle: "Peito" });
const emptyDay = (index: number): DayForm => ({ day: DAY_NAMES[index] || `Dia ${index + 1}`, focus: "", exercises: [emptyExercise()] });

// ─── Main Component ──────────────────────────────
type Tab = "students" | "workout";

const Personal = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("students");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Personal</span>
          </div>
        </div>
        {/* Tab bar */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => setTab("students")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === "students" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4 inline mr-1.5" />
            Alunos
          </button>
          <button
            onClick={() => setTab("workout")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === "workout" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Dumbbell className="w-4 h-4 inline mr-1.5" />
            Montar Treino
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {tab === "students" ? <StudentManagement userId={user?.id} /> : <WorkoutBuilder />}
      </div>
    </div>
  );
};

// ─── Student Management ──────────────────────────
const StudentManagement = ({ userId }: { userId?: string }) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());

  // Load my students on mount
  useEffect(() => {
    if (!userId) return;
    loadMyStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadMyStudents = async () => {
    if (!userId) return;
    const { data: links } = await supabase
      .from("personal_student_links")
      .select("student_id")
      .eq("personal_id", userId);

    if (links?.length) {
      const ids = links.map(l => l.student_id);
      setLinkedIds(new Set(ids));
      const { data } = await supabase
        .from("students")
        .select("*")
        .in("id", ids)
        .order("full_name");
      setMyStudents(data || []);
    } else {
      setMyStudents([]);
      setLinkedIds(new Set());
    }
  };

  const handleSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setLoading(true);

    const cpfDigits = q.replace(/\D/g, "");
    let query = supabase.from("students").select("*");

    if (cpfDigits.length >= 6) {
      // Search by CPF
      query = query.eq("cpf", cpfDigits.length === 11 ? cpfDigits : q);
      if (cpfDigits.length < 11) {
        query = supabase.from("students").select("*").like("cpf", `${cpfDigits}%`);
      }
    } else {
      // Search by name
      query = query.ilike("full_name", `%${q}%`);
    }

    const { data, error } = await query.limit(20);
    setLoading(false);

    if (error) {
      toast({ title: "Erro na busca", description: error.message, variant: "destructive" });
      return;
    }
    setStudents(data || []);
  };

  const linkStudent = async (studentId: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from("personal_student_links")
      .insert({ personal_id: userId, student_id: studentId });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Aluno já vinculado" });
        return;
      }
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aluno vinculado! ✅" });
    loadMyStudents();
  };

  const unlinkStudent = async (studentId: string) => {
    if (!userId) return;
    await supabase
      .from("personal_student_links")
      .delete()
      .eq("personal_id", userId)
      .eq("student_id", studentId);
    toast({ title: "Vínculo removido" });
    loadMyStudents();
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Search className="w-4 h-4" /> Buscar Aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Nome completo ou CPF..."
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading || !search.trim()} className="gap-1.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Busque por nome completo ou número de CPF</p>
        </CardContent>
      </Card>

      {/* Search Results */}
      {students.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{students.length} resultado(s)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {students.map(s => (
              <StudentCard
                key={s.id}
                student={s}
                isLinked={linkedIds.has(s.id)}
                onLink={() => linkStudent(s.id)}
                onUnlink={() => unlinkStudent(s.id)}
                onSelect={() => setSelectedStudent(s)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* New Student Button */}
      <Button variant="outline" className="w-full gap-2" onClick={() => { setShowForm(true); setSelectedStudent(null); }}>
        <UserPlus className="w-4 h-4" />
        Cadastrar Novo Aluno
      </Button>

      {/* Student Form */}
      <AnimatePresence>
        {(showForm || selectedStudent) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <StudentForm
              student={selectedStudent}
              personalId={userId}
              onSaved={() => {
                setShowForm(false);
                setSelectedStudent(null);
                loadMyStudents();
                handleSearch();
              }}
              onCancel={() => { setShowForm(false); setSelectedStudent(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Students */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Users className="w-4 h-4" /> Meus Alunos ({myStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum aluno vinculado. Busque ou cadastre um aluno.</p>
          ) : (
            <div className="space-y-2">
              {myStudents.map(s => (
                <StudentCard
                  key={s.id}
                  student={s}
                  isLinked
                  onUnlink={() => unlinkStudent(s.id)}
                  onSelect={() => setSelectedStudent(s)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Student Card ────────────────────────────────
const StudentCard = ({
  student, isLinked, onLink, onUnlink, onSelect,
}: {
  student: Student;
  isLinked: boolean;
  onLink?: () => void;
  onUnlink: () => void;
  onSelect: () => void;
}) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary/80 transition-colors">
    <button onClick={onSelect} className="flex items-center gap-3 text-left flex-1 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{student.full_name}</p>
        <p className="text-[10px] text-muted-foreground">
          CPF: {formatCpf(student.cpf)}
          {student.phone && ` • ${student.phone}`}
        </p>
      </div>
    </button>
    <div className="flex gap-1 shrink-0 ml-2">
      {isLinked ? (
        <Button variant="ghost" size="sm" onClick={onUnlink} className="text-destructive hover:text-destructive text-xs h-7 px-2">
          Desvincular
        </Button>
      ) : onLink ? (
        <Button variant="outline" size="sm" onClick={onLink} className="text-xs h-7 px-2 gap-1">
          <Plus className="w-3 h-3" /> Vincular
        </Button>
      ) : null}
    </div>
  </div>
);

// ─── Student Form ────────────────────────────────
const StudentForm = ({
  student, personalId, onSaved, onCancel,
}: {
  student: Student | null;
  personalId?: string;
  onSaved: () => void;
  onCancel: () => void;
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: student?.full_name || "",
    cpf: student ? formatCpf(student.cpf) : "",
    email: student?.email || "",
    phone: student?.phone || "",
    birth_date: student?.birth_date || "",
    sex: student?.sex || "masculino",
    weight: student?.weight?.toString() || "",
    height: student?.height?.toString() || "",
    goal: student?.goal || "hipertrofia",
    level: student?.level || "iniciante",
    notes: student?.notes || "",
  });
  const [cpfError, setCpfError] = useState("");

  const handleCpfChange = (value: string) => {
    const formatted = formatCpf(value);
    setForm(f => ({ ...f, cpf: formatted }));
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11) {
      setCpfError(validateCpf(digits) ? "" : "CPF inválido");
    } else {
      setCpfError("");
    }
  };

  const handleSave = async () => {
    const cpfDigits = form.cpf.replace(/\D/g, "");
    if (!form.full_name.trim()) {
      toast({ title: "Preencha o nome completo", variant: "destructive" }); return;
    }
    if (cpfDigits.length !== 11 || !validateCpf(cpfDigits)) {
      toast({ title: "CPF inválido", variant: "destructive" }); return;
    }

    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      cpf: cpfDigits,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      birth_date: form.birth_date || null,
      sex: form.sex || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      goal: form.goal || null,
      level: form.level || null,
      notes: form.notes.trim() || null,
    };

    if (student) {
      // Update
      const { error } = await supabase.from("students").update(payload).eq("id", student.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        setSaving(false); return;
      }
      toast({ title: "Aluno atualizado! ✅" });
    } else {
      // Insert + link
      const { data, error } = await supabase.from("students").insert(payload).select("id").single();
      if (error) {
        if (error.code === "23505") {
          toast({ title: "CPF já cadastrado", description: "Já existe um aluno com este CPF.", variant: "destructive" });
        } else {
          toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
        }
        setSaving(false); return;
      }
      // Auto-link
      if (personalId && data) {
        await supabase.from("personal_student_links").insert({
          personal_id: personalId,
          student_id: data.id,
        });
      }
      toast({ title: "Aluno cadastrado e vinculado! ✅" });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {student ? "Editar Aluno" : "Novo Aluno"}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name + CPF */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome Completo *</label>
            <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="João da Silva" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">CPF *</label>
            <Input
              value={form.cpf}
              onChange={e => handleCpfChange(e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
              className={cpfError ? "border-destructive" : ""}
            />
            {cpfError && <p className="text-[10px] text-destructive mt-1">{cpfError}</p>}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </label>
            <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" type="email" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
              <Phone className="w-3 h-3" /> Telefone
            </label>
            <Input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
        </div>

        {/* Personal info */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nascimento</label>
            <Input value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} type="date" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Sexo</label>
            <Select value={form.sex} onValueChange={v => setForm(f => ({ ...f, sex: v }))}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nível</label>
            <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="intermediario">Intermediário</SelectItem>
                <SelectItem value="avancado">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Physical data */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Peso (kg)</label>
            <Input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} type="number" step="0.1" placeholder="70" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Altura (cm)</label>
            <Input value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} type="number" placeholder="170" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Objetivo</label>
            <Select value={form.goal} onValueChange={v => setForm(f => ({ ...f, goal: v }))}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                <SelectItem value="resistencia">Resistência</SelectItem>
                <SelectItem value="forca">Força</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Observações</label>
          <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Lesões, restrições, preferências..." rows={2} />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {student ? "Salvar Alterações" : "Cadastrar Aluno"}
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── Workout Builder (existing logic) ────────────
const WorkoutBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const existingPlan = loadPlan();

  const [title, setTitle] = useState(existingPlan?.title || "Treino Personalizado");
  const [description, setDescription] = useState(existingPlan?.description || "Treino montado pelo Personal Trainer");
  const [days, setDays] = useState<DayForm[]>(() => {
    if (existingPlan?.days?.length) {
      return existingPlan.days.map(d => ({
        day: d.day, focus: d.focus,
        exercises: d.exercises.map(e => ({ ...e })),
      }));
    }
    return [emptyDay(0)];
  });
  const [expandedDay, setExpandedDay] = useState(0);

  const addDay = () => { if (days.length >= 7) return; setDays(p => [...p, emptyDay(p.length)]); setExpandedDay(days.length); };
  const removeDay = (i: number) => { if (days.length <= 1) return; setDays(p => p.filter((_, j) => j !== i)); if (expandedDay >= days.length - 1) setExpandedDay(Math.max(0, days.length - 2)); };
  const duplicateDay = (i: number) => { if (days.length >= 7) return; const c = JSON.parse(JSON.stringify(days[i])); c.day = DAY_NAMES[days.length] || `Dia ${days.length + 1}`; setDays(p => [...p, c]); setExpandedDay(days.length); };
  const updateDay = (i: number, f: keyof DayForm, v: string) => setDays(p => p.map((d, j) => j === i ? { ...d, [f]: v } : d));
  const addExercise = (di: number) => setDays(p => p.map((d, i) => i === di ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d));
  const removeExercise = (di: number, ei: number) => setDays(p => p.map((d, i) => { if (i !== di || d.exercises.length <= 1) return d; return { ...d, exercises: d.exercises.filter((_, j) => j !== ei) }; }));
  const updateExercise = (di: number, ei: number, f: keyof ExerciseForm, v: string | number) => setDays(p => p.map((d, i) => i !== di ? d : { ...d, exercises: d.exercises.map((ex, j) => j === ei ? { ...ex, [f]: v } : ex) }));
  const selectSuggestion = (di: number, ei: number, name: string, muscle: string) => setDays(p => p.map((d, i) => i !== di ? d : { ...d, exercises: d.exercises.map((ex, j) => j === ei ? { ...ex, name, muscle } : ex) }));

  const savePlanHandler = () => {
    const hasEmpty = days.some(d => !d.focus || d.exercises.some(e => !e.name));
    if (hasEmpty) { toast({ title: "Preencha todos os campos", variant: "destructive" }); return; }
    const plan: WorkoutPlan = { title, description, daysPerWeek: days.length, days: days.map(d => ({ day: d.day, focus: d.focus, exercises: d.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, rest: e.rest, muscle: e.muscle })) })) };
    savePlan(plan);
    if (!loadProfile()) {
      saveProfile({ name: "Aluno", age: 25, weight: 70, height: 170, sex: "masculino", goal: "hipertrofia", level: "intermediario", daysPerWeek: days.length, hoursPerSession: 1 });
    }
    toast({ title: "Treino salvo! ✅" });
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Informações do Treino</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><label className="text-sm font-medium text-foreground mb-1 block">Título</label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><label className="text-sm font-medium text-foreground mb-1 block">Descrição</label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {days.map((day, di) => (
          <div key={di} className="rounded-2xl border border-border overflow-hidden">
            <button onClick={() => setExpandedDay(expandedDay === di ? -1 : di)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <div className="text-left">
                  <h3 className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{day.day} {day.focus && `- ${day.focus}`}</h3>
                  <p className="text-sm text-muted-foreground">{day.exercises.length} exercício(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); duplicateDay(di); }}><Copy className="w-3.5 h-3.5" /></Button>
                {days.length > 1 && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); removeDay(di); }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                {expandedDay === di ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </button>
            {expandedDay === di && (
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Dia</label>
                    <Select value={day.day} onValueChange={v => updateDay(di, "day", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DAY_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Foco</label>
                    <Input value={day.focus} onChange={e => updateDay(di, "focus", e.target.value)} placeholder="Ex: Peito + Tríceps" />
                  </div>
                </div>
                <div className="space-y-3">
                  {day.exercises.map((ex, ei) => (
                    <ExerciseEditor key={ei} exercise={ex} index={ei} onUpdate={(f, v) => updateExercise(di, ei, f, v)} onRemove={() => removeExercise(di, ei)} onSelectSuggestion={(n, m) => selectSuggestion(di, ei, n, m)} canRemove={day.exercises.length > 1} />
                  ))}
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={() => addExercise(di)}><Plus className="w-4 h-4" />Adicionar Exercício</Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {days.length < 7 && <Button variant="outline" className="w-full gap-2" onClick={addDay}><Plus className="w-4 h-4" />Adicionar Dia ({days.length}/7)</Button>}
      <Button onClick={savePlanHandler} className="w-full gap-2" size="lg"><Save className="w-4 h-4" />Salvar Treino</Button>
    </div>
  );
};

// ─── Exercise Editor ─────────────────────────────
interface ExerciseEditorProps {
  exercise: ExerciseForm;
  index: number;
  onUpdate: (field: keyof ExerciseForm, value: string | number) => void;
  onRemove: () => void;
  onSelectSuggestion: (name: string, muscle: string) => void;
  canRemove: boolean;
}

const ExerciseEditor = ({ exercise, index, onUpdate, onRemove, onSelectSuggestion, canRemove }: ExerciseEditorProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = EXERCISE_SUGGESTIONS[exercise.muscle] || [];

  return (
    <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
        {canRemove && <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onRemove}><Trash2 className="w-3 h-3" /></Button>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Músculo</label>
          <Select value={exercise.muscle} onValueChange={v => onUpdate("muscle", v)}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{MUSCLE_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Exercício</label>
          <Input value={exercise.name} onChange={e => onUpdate("name", e.target.value)} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="Digite ou selecione" className="h-9 text-sm" />
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {suggestions.map(s => (
                <button key={s} onMouseDown={e => { e.preventDefault(); onSelectSuggestion(s, exercise.muscle); setShowSuggestions(false); }} className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">{s}</button>
              ))}
            </div>
          )}
        </div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Séries</label><Input type="number" min={1} max={10} value={exercise.sets} onChange={e => onUpdate("sets", parseInt(e.target.value) || 1)} className="h-9 text-sm" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Repetições</label><Input value={exercise.reps} onChange={e => onUpdate("reps", e.target.value)} placeholder="10-12" className="h-9 text-sm" /></div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Descanso</label>
          <Select value={exercise.rest} onValueChange={v => onUpdate("rest", v)}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{["30s", "45s", "60s", "90s", "120s", "180s"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
    </div>
  );
};

export default Personal;
