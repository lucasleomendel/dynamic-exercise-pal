import { useState, useCallback } from "react";
import { WorkoutPlan as WorkoutPlanType, UserProfile } from "@/lib/workout-generator";
import ExerciseCard from "./ExerciseCard";
import ProfileSheet from "./ProfileSheet";
import ProgressSheet from "./ProgressSheet";
import BodyCompositionSheet from "./BodyCompositionSheet";
import DietSheet from "./DietSheet";
import WaterTracker from "./WaterTracker";
import ChatBot from "./ChatBot";
import SettingsSheet from "./SettingsSheet";
import RestTimer from "./RestTimer";
import { Calendar, ChevronDown, LogOut, BarChart3, MoreVertical, Download, UtensilsCrossed, Ruler, Settings, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logoImg from "@/assets/logo-fitforge.png";
import { generateWorkoutPDF } from "@/lib/pdf-generator";
import { toast } from "sonner";
import { loadChecked, saveChecked, saveWeight, loadWeights, saveWorkoutHistory, savePlan } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface Props {
  plan: WorkoutPlanType;
  profile: UserProfile;
  onEdit: () => void;
  onClear: () => void;
  onPlanUpdate?: (plan: WorkoutPlanType) => void;
}

const WorkoutPlan = ({ plan, profile, onEdit, onClear, onPlanUpdate }: Props) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const entries = loadWeights();
    const map: Record<string, number> = {};
    entries.forEach(e => { map[e.exerciseKey] = e.weight; });
    return map;
  });
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [weightSaved, setWeightSaved] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState<null | "diet" | "body" | "settings" | "profile">(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await generateWorkoutPDF(plan, profile);
      toast.success("PDF do treino baixado! 📥");
    } catch {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setExporting(false);
    }
  }, [plan, profile]);

  const handleDayChange = useCallback((dayIndex: number, newDay: string) => {
    const updatedPlan = {
      ...plan,
      days: plan.days.map((d, i) => i === dayIndex ? { ...d, day: newDay } : d),
    };
    savePlan(updatedPlan);
    onPlanUpdate?.(updatedPlan);
  }, [plan, onPlanUpdate]);

  const toggleCheck = useCallback((key: string) => {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveChecked(next);

      // If checking (not unchecking), start rest timer
      if (!prev[key]) {
        // Find the exercise to get rest time
        const [dayIdx, exIdx] = key.split('-').map(Number);
        const exercise = plan.days[dayIdx]?.exercises[exIdx];
        if (exercise) {
          setActiveTimer(exercise.rest);
        }

        // Save to workout history
        const day = plan.days[dayIdx];
        if (day) {
          const completedCount = Object.entries(next).filter(([k, v]) => v && k.startsWith(`${dayIdx}-`)).length;
          saveWorkoutHistory({
            date: new Date().toISOString(),
            completedExercises: completedCount,
            totalExercises: day.exercises.length,
            dayFocus: day.focus,
          });
        }
      }

      return next;
    });
  }, [plan]);

  const handleWeightChange = useCallback((key: string, weight: number, exerciseName: string, muscle: string) => {
    setWeights(prev => ({ ...prev, [key]: weight }));
    saveWeight({
      exerciseKey: key,
      exerciseName,
      muscle,
      weight,
      date: new Date().toISOString(),
    });
    setWeightSaved(key);
    setTimeout(() => setWeightSaved(null), 1500);
  }, []);

  const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="FitForge" className="w-9 h-9 rounded-lg object-contain" />
            <span className="font-display font-bold text-lg hidden sm:inline" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>FitForge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/progress")}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-primary/20 hover:text-primary transition-colors"
              title="Painel de Progresso"
              aria-label="Progresso"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
                  aria-label="Menu"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setOpenSheet("profile")}>
                  <User className="w-4 h-4 mr-2" /> Meu perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenSheet("diet")}>
                  <UtensilsCrossed className="w-4 h-4 mr-2" /> Dieta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenSheet("body")}>
                  <Ruler className="w-4 h-4 mr-2" /> Composição corporal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} disabled={exporting}>
                  {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Baixar PDF do treino
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOpenSheet("settings")}>
                  <Settings className="w-4 h-4 mr-2" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Hidden controlled sheets */}
        <ProfileSheet
          profile={profile}
          onEdit={onEdit}
          onClear={() => { setOpenSheet(null); setShowClearDialog(true); }}
          open={openSheet === "profile"}
          onOpenChange={(v) => setOpenSheet(v ? "profile" : null)}
        />
        <DietSheet
          goal={profile.goal}
          weight={profile.weight}
          height={profile.height}
          age={profile.age}
          sex={profile.sex}
          open={openSheet === "diet"}
          onOpenChange={(v) => setOpenSheet(v ? "diet" : null)}
        />
        <BodyCompositionSheet
          sex={profile.sex}
          age={profile.age}
          weight={profile.weight}
          height={profile.height}
          open={openSheet === "body"}
          onOpenChange={(v) => setOpenSheet(v ? "body" : null)}
        />
        <SettingsSheet
          open={openSheet === "settings"}
          onOpenChange={(v) => setOpenSheet(v ? "settings" : null)}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold mb-2 text-gradient" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{plan.title}</h1>
          <p className="text-muted-foreground">{plan.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-8 animate-fade-in">
          {[
            { label: "Peso", value: `${profile.weight}kg` },
            { label: "Altura", value: `${profile.height}cm` },
            { label: "IMC", value: bmi },
            { label: "Dias/sem", value: `${plan.daysPerWeek}x` },
            { label: "Sessão", value: profile.hoursPerSession < 1 ? `${Math.round(profile.hoursPerSession * 60)}min` : `${profile.hoursPerSession}h` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="card-elevated rounded-xl p-3 sm:p-4 text-center"
            >
              <span className="text-lg sm:text-xl font-bold font-display text-primary">{stat.value}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground block mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Water Tracker */}
        <div className="mb-6 animate-fade-in">
          <WaterTracker weight={profile.weight} hoursPerSession={profile.hoursPerSession} daysPerWeek={profile.daysPerWeek} />
        </div>

        {/* Days */}
        <div className="space-y-3">
          {plan.days.map((day, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedDay(expandedDay === i ? -1 : i)}
                className="w-full flex items-center justify-between p-5 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{day.day}</h3>
                    <p className="text-sm text-muted-foreground">{day.focus} • {day.exercises.length} exercícios</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${expandedDay === i ? "rotate-180" : ""}`} />
              </button>

              {expandedDay === i && (
                <div className="overflow-hidden animate-accordion-down">
                  <div className="px-5 pb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">Dia da semana</label>
                      <Select value={day.day} onValueChange={(v) => handleDayChange(i, v)}>
                        <SelectTrigger className="h-8 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAY_NAMES.map(n => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="px-5 pb-5 space-y-2">
                    {day.exercises.map((ex, j) => {
                      const exKey = `${i}-${j}`;
                      return (
                        <ExerciseCard
                          key={j}
                          exercise={ex}
                          index={j}
                          exerciseKey={exKey}
                          checked={!!checked[exKey]}
                          onToggleCheck={toggleCheck}
                          savedWeight={weights[exKey]}
                          onWeightChange={(key, w) => handleWeightChange(key, w, ex.name, ex.muscle)}
                          weightSaved={weightSaved === exKey}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress button */}
        <ProgressSheet />
      </div>

      <ChatBot profile={profile} />

      {/* Rest Timer */}
      <AnimatePresence>
        {activeTimer && (
          <RestTimer
            key={activeTimer + Date.now()}
            duration={activeTimer}
            onComplete={() => setActiveTimer(null)}
          />
        )}
      </AnimatePresence>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai apagar seu perfil, treino, progresso e histórico de pesos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkoutPlan;
