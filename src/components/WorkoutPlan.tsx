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
import { Dumbbell, Calendar, ChevronDown } from "lucide-react";
import { loadChecked, saveChecked, saveWeight, loadWeights, saveWorkoutHistory } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";
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

interface Props {
  plan: WorkoutPlanType;
  profile: UserProfile;
  onEdit: () => void;
  onClear: () => void;
}

const WorkoutPlan = ({ plan, profile, onEdit, onClear }: Props) => {
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
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg hidden sm:inline" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>FitForge</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <DietSheet goal={profile.goal} weight={profile.weight} height={profile.height} age={profile.age} sex={profile.sex} hoursPerSession={profile.hoursPerSession} />
            <BodyCompositionSheet sex={profile.sex} age={profile.age} weight={profile.weight} height={profile.height} />
            <SettingsSheet />
            <ProfileSheet profile={profile} onEdit={onEdit} onClear={() => setShowClearDialog(true)} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold mb-2 text-gradient" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{plan.title}</h1>
          <p className="text-muted-foreground">{plan.description}</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-5 gap-2 sm:gap-3 mb-8"
        >
          {[
            { label: "Peso", value: `${profile.weight}kg` },
            { label: "Altura", value: `${profile.height}cm` },
            { label: "IMC", value: bmi },
            { label: "Dias/sem", value: `${plan.daysPerWeek}x` },
            { label: "Sessão", value: profile.hoursPerSession < 1 ? `${Math.round(profile.hoursPerSession * 60)}min` : `${profile.hoursPerSession}h` },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              className="card-elevated rounded-xl p-3 sm:p-4 text-center"
            >
              <span className="text-lg sm:text-xl font-bold font-display text-primary">{stat.value}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground block mt-1">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Water Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <WaterTracker weight={profile.weight} hoursPerSession={profile.hoursPerSession} daysPerWeek={profile.daysPerWeek} />
        </motion.div>

        {/* Days */}
        <div className="space-y-3">
          {plan.days.map((day, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
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
                <motion.div
                  animate={{ rotate: expandedDay === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandedDay === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-2">
                      {day.exercises.map((ex, j) => {
                        const exKey = `${i}-${j}`;
                        return (
                          <motion.div
                            key={j}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: j * 0.04 }}
                          >
                            <ExerciseCard
                              exercise={ex}
                              index={j}
                              exerciseKey={exKey}
                              checked={!!checked[exKey]}
                              onToggleCheck={toggleCheck}
                              savedWeight={weights[exKey]}
                              onWeightChange={(key, w) => handleWeightChange(key, w, ex.name, ex.muscle)}
                              weightSaved={weightSaved === exKey}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Progress button */}
        <ProgressSheet />
      </div>

      <ChatBot />

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
