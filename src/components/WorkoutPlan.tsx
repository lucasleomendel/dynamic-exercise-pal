import { useState } from "react";
import { WorkoutPlan as WorkoutPlanType, UserProfile } from "@/lib/workout-generator";
import ExerciseCard from "./ExerciseCard";
import ProfileSheet from "./ProfileSheet";
import ProgressSheet from "./ProgressSheet";
import BodyCompositionSheet from "./BodyCompositionSheet";
import DietSheet from "./DietSheet";
import { Dumbbell, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { loadChecked, saveChecked, saveWeight, loadWeights } from "@/lib/storage";

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

  const toggleCheck = (key: string) => {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveChecked(next);
      return next;
    });
  };

  const handleWeightChange = (key: string, weight: number, exerciseName: string, muscle: string) => {
    setWeights(prev => ({ ...prev, [key]: weight }));
    saveWeight({
      exerciseKey: key,
      exerciseName,
      muscle,
      weight,
      date: new Date().toISOString(),
    });
  };

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
            <span className="font-display font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>FitForge</span>
          </div>
          <div className="flex items-center gap-2">
            <DietSheet goal={profile.goal} weight={profile.weight} height={profile.height} age={profile.age} sex={profile.sex} />
            <BodyCompositionSheet sex={profile.sex} age={profile.age} weight={profile.weight} height={profile.height} />
            <ProfileSheet profile={profile} onEdit={onEdit} onClear={onClear} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2 text-gradient" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{plan.title}</h1>
          <p className="text-muted-foreground">{plan.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {[
            { label: "Peso", value: `${profile.weight}kg` },
            { label: "Altura", value: `${profile.height}cm` },
            { label: "IMC", value: bmi },
            { label: "Dias/sem", value: `${plan.daysPerWeek}x` },
            { label: "Sessão", value: profile.hoursPerSession < 1 ? `${Math.round(profile.hoursPerSession * 60)}min` : `${profile.hoursPerSession}h` },
          ].map(stat => (
            <div key={stat.label} className="card-elevated rounded-xl p-4 text-center">
              <span className="text-xl font-bold font-display text-primary">{stat.value}</span>
              <span className="text-xs text-muted-foreground block mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="space-y-3">
          {plan.days.map((day, i) => (
            <div key={i} className="rounded-2xl border border-border overflow-hidden transition-all">
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
                {expandedDay === i ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>

              {expandedDay === i && (
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
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress button */}
        <ProgressSheet />
      </div>
    </div>
  );
};

export default WorkoutPlan;
