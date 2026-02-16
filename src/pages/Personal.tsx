import { useState } from "react";
import { Exercise, WorkoutDay, WorkoutPlan } from "@/lib/workout-generator";
import { savePlan, saveProfile, loadProfile, loadPlan } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Save, ArrowLeft, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const MUSCLE_OPTIONS = [
  "Peito", "Costas", "Quadríceps", "Posterior", "Glúteo", "Panturrilha",
  "Pernas", "Ombros", "Trapézio", "Bíceps", "Tríceps", "Abdômen",
];

const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  "Peito": ["Supino Reto com Barra", "Supino Inclinado com Halteres", "Crucifixo na Máquina", "Crossover", "Flexão de Braço", "Supino Declinado", "Pullover com Halter", "Chest Press na Máquina"],
  "Costas": ["Puxada Frontal", "Remada Curvada", "Remada Unilateral", "Pulldown", "Remada Baixa", "Barra Fixa", "Remada Cavalinho", "Levantamento Terra"],
  "Quadríceps": ["Agachamento Livre", "Leg Press 45°", "Cadeira Extensora", "Agachamento Hack", "Avanço com Halteres", "Agachamento Búlgaro", "Agachamento Frontal"],
  "Posterior": ["Stiff", "Mesa Flexora", "Cadeira Flexora", "Stiff Unilateral", "Good Morning"],
  "Glúteo": ["Elevação Pélvica (Hip Thrust)", "Abdução de Quadril", "Glúteo no Cabo", "Extensão de Quadril na Máquina"],
  "Panturrilha": ["Panturrilha no Smith", "Panturrilha Sentado", "Panturrilha no Leg Press"],
  "Pernas": ["Agachamento Livre", "Leg Press 45°", "Cadeira Extensora", "Mesa Flexora", "Stiff", "Avanço", "Elevação Pélvica"],
  "Ombros": ["Desenvolvimento com Halteres", "Elevação Lateral", "Elevação Frontal", "Crucifixo Inverso", "Desenvolvimento Arnold", "Face Pull"],
  "Trapézio": ["Encolhimento com Barra", "Encolhimento com Halteres"],
  "Bíceps": ["Rosca Direta com Barra", "Rosca Alternada", "Rosca Martelo", "Rosca Scott", "Rosca Concentrada", "Rosca 21"],
  "Tríceps": ["Tríceps Pulley", "Tríceps Testa", "Tríceps Francês", "Mergulho no Banco", "Tríceps Corda", "Mergulho em Paralelas"],
  "Abdômen": ["Abdominal Crunch", "Prancha", "Elevação de Pernas", "Abdominal Bicicleta", "Russian Twist", "Mountain Climber"],
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

const Personal = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Try to load existing plan to edit
  const existingPlan = loadPlan();

  const [title, setTitle] = useState(existingPlan?.title || "Treino Personalizado");
  const [description, setDescription] = useState(existingPlan?.description || "Treino montado pelo Personal Trainer");
  const [days, setDays] = useState<DayForm[]>(() => {
    if (existingPlan?.days?.length) {
      return existingPlan.days.map(d => ({
        day: d.day,
        focus: d.focus,
        exercises: d.exercises.map(e => ({ ...e })),
      }));
    }
    return [emptyDay(0)];
  });
  const [expandedDay, setExpandedDay] = useState(0);

  const addDay = () => {
    if (days.length >= 7) return;
    setDays(prev => [...prev, emptyDay(prev.length)]);
    setExpandedDay(days.length);
  };

  const removeDay = (index: number) => {
    if (days.length <= 1) return;
    setDays(prev => prev.filter((_, i) => i !== index));
    if (expandedDay >= days.length - 1) setExpandedDay(Math.max(0, days.length - 2));
  };

  const duplicateDay = (index: number) => {
    if (days.length >= 7) return;
    const copy = JSON.parse(JSON.stringify(days[index]));
    copy.day = DAY_NAMES[days.length] || `Dia ${days.length + 1}`;
    setDays(prev => [...prev, copy]);
    setExpandedDay(days.length);
  };

  const updateDay = (index: number, field: keyof DayForm, value: string) => {
    setDays(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const addExercise = (dayIndex: number) => {
    setDays(prev => prev.map((d, i) => i === dayIndex ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d));
  };

  const removeExercise = (dayIndex: number, exIndex: number) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      if (d.exercises.length <= 1) return d;
      return { ...d, exercises: d.exercises.filter((_, j) => j !== exIndex) };
    }));
  };

  const updateExercise = (dayIndex: number, exIndex: number, field: keyof ExerciseForm, value: string | number) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      return {
        ...d,
        exercises: d.exercises.map((ex, j) => j === exIndex ? { ...ex, [field]: value } : ex),
      };
    }));
  };

  const selectSuggestion = (dayIndex: number, exIndex: number, name: string, muscle: string) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      return {
        ...d,
        exercises: d.exercises.map((ex, j) => j === exIndex ? { ...ex, name, muscle } : ex),
      };
    }));
  };

  const savePlanHandler = () => {
    // Validate
    const hasEmpty = days.some(d => !d.focus || d.exercises.some(e => !e.name));
    if (hasEmpty) {
      toast({ title: "Preencha todos os campos", description: "Cada dia precisa de um foco e cada exercício precisa de um nome.", variant: "destructive" });
      return;
    }

    const plan: WorkoutPlan = {
      title,
      description,
      daysPerWeek: days.length,
      days: days.map(d => ({
        day: d.day,
        focus: d.focus,
        exercises: d.exercises.map(e => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          rest: e.rest,
          muscle: e.muscle,
        })),
      })),
    };

    savePlan(plan);

    // Also ensure a profile exists so the student view loads
    if (!loadProfile()) {
      saveProfile({
        name: "Aluno",
        age: 25,
        weight: 70,
        height: 170,
        sex: "masculino",
        goal: "hipertrofia",
        level: "intermediario",
        daysPerWeek: days.length,
        hoursPerSession: 1,
      });
    }

    toast({ title: "Treino salvo!", description: "O aluno verá este treino ao abrir o app." });
    navigate("/");
  };

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
          <Button onClick={savePlanHandler} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar Treino
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Plan info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Informações do Treino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Título</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Treino Hipertrofia - João" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Descrição</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição do plano" rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Days */}
        <div className="space-y-3">
          {days.map((day, di) => (
            <div key={di} className="rounded-2xl border border-border overflow-hidden">
              {/* Day Header */}
              <button
                onClick={() => setExpandedDay(expandedDay === di ? -1 : di)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div className="text-left">
                    <h3 className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {day.day} {day.focus && `- ${day.focus}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">{day.exercises.length} exercício(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); duplicateDay(di); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  {days.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); removeDay(di); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {expandedDay === di ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </button>

              {/* Day Content */}
              {expandedDay === di && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Dia da semana</label>
                      <Select value={day.day} onValueChange={v => updateDay(di, "day", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAY_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Foco do dia</label>
                      <Input value={day.focus} onChange={e => updateDay(di, "focus", e.target.value)} placeholder="Ex: Peito + Tríceps" />
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="space-y-3">
                    {day.exercises.map((ex, ei) => (
                      <ExerciseEditor
                        key={ei}
                        exercise={ex}
                        index={ei}
                        onUpdate={(field, value) => updateExercise(di, ei, field, value)}
                        onRemove={() => removeExercise(di, ei)}
                        onSelectSuggestion={(name, muscle) => selectSuggestion(di, ei, name, muscle)}
                        canRemove={day.exercises.length > 1}
                      />
                    ))}
                  </div>

                  <Button variant="outline" className="w-full gap-2" onClick={() => addExercise(di)}>
                    <Plus className="w-4 h-4" />
                    Adicionar Exercício
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {days.length < 7 && (
          <Button variant="outline" className="w-full gap-2" onClick={addDay}>
            <Plus className="w-4 h-4" />
            Adicionar Dia ({days.length}/7)
          </Button>
        )}

        <Button onClick={savePlanHandler} className="w-full gap-2" size="lg">
          <Save className="w-4 h-4" />
          Salvar Treino do Aluno
        </Button>
      </div>
    </div>
  );
};

// --- Exercise Editor Sub-component ---

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
        {canRemove && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onRemove}>
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Músculo</label>
          <Select value={exercise.muscle} onValueChange={v => onUpdate("muscle", v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MUSCLE_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Nome do exercício</label>
          <Input
            value={exercise.name}
            onChange={e => onUpdate("name", e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Digite ou selecione"
            className="h-9 text-sm"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {suggestions.map(s => (
                <button
                  key={s}
                  onMouseDown={e => { e.preventDefault(); onSelectSuggestion(s, exercise.muscle); setShowSuggestions(false); }}
                  className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Séries</label>
          <Input
            type="number"
            min={1}
            max={10}
            value={exercise.sets}
            onChange={e => onUpdate("sets", parseInt(e.target.value) || 1)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Repetições</label>
          <Input
            value={exercise.reps}
            onChange={e => onUpdate("reps", e.target.value)}
            placeholder="10-12"
            className="h-9 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Descanso</label>
          <Select value={exercise.rest} onValueChange={v => onUpdate("rest", v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["30s", "45s", "60s", "90s", "120s", "180s"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default Personal;
