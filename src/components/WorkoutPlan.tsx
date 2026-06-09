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
  const { signOut, isGuest, exitGuestMode } = useAuth();
  const navigate = useNavigate();
  const goToAuth = useCallback(() => {
    exitGuestMode();
    navigate("/auth");
  }, [exitGuestMode, navigate]);
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

        // Save to workout history APENAS quando o dia for 100% concluído
        const day = plan.days[dayIdx];
        if (day) {
          const completedCount = Object.entries(next).filter(([k, v]) => v && k.startsWith(`${dayIdx}-`)).length;
          if (completedCount === day.exercises.length) {
            saveWorkoutHistory({
              date: new Date().toISOString(),
              completedExercises: completedCount,
              totalExercises: day.exercises.length,
              dayFocus: day.focus,
            });
            toast.success("Parabéns! Treino concluído! 🎉", {
              description: `Você completou todos os ${day.exercises.length} exercícios de ${day.focus}.`,
            });
          }
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="FitForge" className="w-9 h-9 rounded-lg object-contain" />
            <span className="font-display font-bold text-lg hidden sm:inline" style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}>FitForge</span>
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
                {isGuest ? (
                  <DropdownMenuItem onClick={goToAuth} className="text-primary focus:text-primary">
                    <LogOut className="w-4 h-4 mr-2" /> Entrar / Cadastrar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sair
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {isGuest && (
          <div className="max-w-4xl mx-auto px-4 pb-2">
            <div className="flex items-center justify-between gap-2 text-[11px] px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <span>👤 Modo visitante · seus dados ficam só nesse dispositivo</span>
              <button onClick={goToAuth} className="font-semibold hover:underline shrink-0">Entrar</button>
            </div>
          </div>
        )}

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

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* BENTO LOBBY */}
        {(() => {
          const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon
          const todayName = DAY_NAMES[todayIdx];
          const todayDayIdx = plan.days.findIndex(d => d.day === todayName);
          const todayDay = todayDayIdx >= 0 ? plan.days[todayDayIdx] : plan.days[0];
          const todayDayActualIdx = todayDayIdx >= 0 ? todayDayIdx : 0;
          const completedToday = todayDay
            ? todayDay.exercises.filter((_, j) => checked[`${todayDayActualIdx}-${j}`]).length
            : 0;
          const totalToday = todayDay?.exercises.length ?? 0;
          const progressPct = totalToday ? Math.round((completedToday / totalToday) * 100) : 0;

          // Weekly streak: last 7 days from history
          const history = (() => { try { return JSON.parse(localStorage.getItem("fitforge:history") || "[]"); } catch { return []; } })();
          const last7 = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dayStr = d.toISOString().slice(0, 10);
            const done = history.some((h: any) => h.date?.slice(0, 10) === dayStr && h.completedExercises > 0);
            return { dayStr, done, label: ["D", "S", "T", "Q", "Q", "S", "S"][(d.getDay())] };
          });
          const streakCount = last7.filter(d => d.done).length;

          // Top PR
          const weightsArr = loadWeights();
          const topPr = weightsArr.length
            ? weightsArr.reduce((a, b) => (b.weight > a.weight ? b : a))
            : null;

          const goToToday = () => setExpandedDay(todayDayActualIdx);

          return (
            <div className="grid grid-cols-4 auto-rows-min gap-3 mb-6 animate-fade-in">
              {/* Greeting */}
              <div className="col-span-4 md:col-span-2 bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-xl font-display text-primary">
                    {(profile.name || "FF").slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-3xl leading-none tracking-tight truncate">
                    BEM-VINDO, <span className="text-primary">{(profile.name || "Atleta").toUpperCase()}</span>
                  </h1>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1 truncate">
                    {plan.title} · {plan.daysPerWeek}x semana · IMC {bmi}
                  </p>
                </div>
              </div>

              {/* Weekly Streak */}
              <div className="col-span-4 md:col-span-2 bg-card border border-border rounded-2xl p-5 flex flex-col justify-between gap-3">
                <div className="flex justify-between items-start">
                  <span className="font-display text-lg text-muted-foreground">STREAK SEMANAL</span>
                  <span className="text-primary font-bold text-sm">{streakCount}/7 DIAS</span>
                </div>
                <div className="flex justify-between items-end gap-1 h-12">
                  {last7.map((d, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-all ${d.done ? "bg-primary" : "bg-secondary"}`}
                      style={{ height: d.done ? `${60 + (i % 3) * 12}%` : "20%" }}
                      title={d.dayStr}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  {last7.map((d, i) => <span key={i}>{d.label}</span>)}
                </div>
              </div>

              {/* Today's workout - featured */}
              <div className="col-span-4 md:col-span-2 md:row-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                <div className="mb-4">
                  <div className="text-primary font-display text-sm tracking-widest mb-1">TREINO DE HOJE</div>
                  <h2 className="font-display text-5xl leading-none">
                    {todayDay?.focus.toUpperCase() || "DESCANSO"}{" "}
                    <span className="text-muted-foreground">({todayDay?.day.slice(0, 3).toUpperCase()})</span>
                  </h2>
                </div>
                {todayDay && (
                  <>
                    <ul className="space-y-2.5 flex-grow">
                      {todayDay.exercises.slice(0, 4).map((ex, j) => (
                        <li key={j} className="flex justify-between items-center border-b border-border pb-2 text-sm">
                          <span className={`truncate ${checked[`${todayDayActualIdx}-${j}`] ? "text-muted-foreground line-through" : "text-foreground/90"}`}>
                            {ex.name}
                          </span>
                          <span className="text-muted-foreground shrink-0 ml-2 text-xs font-bold">
                            {ex.sets}×{ex.reps}
                          </span>
                        </li>
                      ))}
                      {todayDay.exercises.length > 4 && (
                        <li className="text-xs text-muted-foreground text-center pt-1">
                          + {todayDay.exercises.length - 4} exercícios
                        </li>
                      )}
                    </ul>
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="text-primary">{completedToday}/{totalToday}</span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                    <button
                      onClick={goToToday}
                      className="w-full bg-primary hover:brightness-110 text-primary-foreground font-display py-4 rounded-xl text-2xl transition-all mt-4 shadow-[var(--shadow-glow)]"
                    >
                      INICIAR TREINO
                    </button>
                  </>
                )}
              </div>

              {/* Macros preview */}
              <div className="col-span-4 md:col-span-2 bg-card border border-border rounded-2xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-display text-xl">MACROS DO DIA</span>
                  <button
                    onClick={() => setOpenSheet("diet")}
                    className="text-[10px] uppercase tracking-widest text-primary font-bold hover:underline"
                  >
                    Ver dieta
                  </button>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Proteína", target: Math.round(profile.weight * 2), color: "primary" },
                    { label: "Carboidratos", target: Math.round(profile.weight * 4), color: "primary" },
                    { label: "Gorduras", target: Math.round(profile.weight * 1), color: "primary" },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-[11px] mb-1 uppercase">
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="font-bold">{m.target}g</span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: "0%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hydration ring */}
              <div className="col-span-2 md:col-span-1 bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="absolute -rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="hsl(var(--secondary))" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="50" cy="50" r="45"
                      stroke="hsl(var(--primary))" strokeWidth="8" fill="transparent"
                      strokeDasharray="282" strokeDashoffset="110" strokeLinecap="round"
                    />
                  </svg>
                  <span className="font-display text-2xl">
                    {((profile.weight * 35 + (profile.daysPerWeek > 0 ? profile.hoursPerSession * 500 : 0)) / 1000).toFixed(1)}L
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">HIDRATAÇÃO</span>
              </div>

              {/* Top PR */}
              <div className="col-span-2 md:col-span-1 bg-card border border-border rounded-2xl p-4 flex flex-col justify-center">
                <span className="text-primary text-[10px] font-bold uppercase tracking-widest mb-1">RECORDE</span>
                <div className="font-display text-3xl leading-none">
                  {topPr ? `${topPr.weight}KG` : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 uppercase truncate">
                  {topPr?.exerciseName || "Sem registros"}
                </div>
              </div>

              {/* Shortcuts */}
              <div className="col-span-4 bg-card border border-border rounded-2xl p-3 flex justify-between gap-2">
                <button
                  onClick={onEdit}
                  className="flex-1 bg-secondary hover:bg-secondary/70 h-11 rounded-xl flex items-center justify-center gap-2 transition-all group"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-display text-sm tracking-wide group-hover:text-primary">GERAR TREINO</span>
                </button>
                <button
                  onClick={() => navigate("/progress")}
                  className="flex-1 bg-secondary hover:bg-secondary/70 h-11 rounded-xl flex items-center justify-center gap-2 transition-all group"
                >
                  <span className="font-display text-sm tracking-wide group-hover:text-primary">HISTÓRICO</span>
                </button>
                <button
                  onClick={() => setOpenSheet("body")}
                  className="flex-1 bg-secondary hover:bg-secondary/70 h-11 rounded-xl flex items-center justify-center gap-2 transition-all group"
                >
                  <span className="font-display text-sm tracking-wide group-hover:text-primary">CORPO</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Water Tracker (detalhado) */}
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
                    <h3 className="font-display font-bold text-lg" style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}>{day.day}</h3>
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
      {activeTimer && (
        <RestTimer
          key={activeTimer + Date.now()}
          duration={activeTimer}
          onComplete={() => setActiveTimer(null)}
        />
      )}

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
