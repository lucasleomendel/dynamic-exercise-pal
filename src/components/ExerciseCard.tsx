import { useState, useEffect, forwardRef } from "react";
import { Exercise } from "@/lib/workout-generator";
import { Timer, RotateCcw, Play, Check, Weight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  exercise: Exercise;
  index: number;
  checked?: boolean;
  onToggleCheck?: (key: string) => void;
  exerciseKey: string;
  savedWeight?: number;
  onWeightChange?: (key: string, weight: number) => void;
  weightSaved?: boolean;
}

const ExerciseCard = forwardRef<HTMLDivElement, Props>(({ exercise, index, checked, onToggleCheck, exerciseKey, savedWeight, onWeightChange, weightSaved }, ref) => {
  const [weightInput, setWeightInput] = useState(savedWeight?.toString() || "");

  // Sincroniza estado local quando savedWeight muda externamente
  useEffect(() => {
    if (savedWeight !== undefined) {
      setWeightInput(savedWeight.toString());
    }
  }, [savedWeight]);

  const handleExample = () => {
    const query = encodeURIComponent(`como fazer ${exercise.name} exercício academia`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
  };

  const handleWeightBlur = () => {
    const val = parseFloat(weightInput);
    if (!isNaN(val) && val > 0) {
      onWeightChange?.(exerciseKey, val);
    }
  };

  return (
    <div ref={ref} className={`p-4 rounded-xl border transition-all group ${checked ? "bg-primary/5 border-primary/30 opacity-70" : "bg-secondary/50 border-border hover:border-primary/30"}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggleCheck?.(exerciseKey)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all border ${checked ? "bg-primary border-primary text-primary-foreground" : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/50 hover:text-primary"}`}
        >
          {checked ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{String(index + 1).padStart(2, "0")}</span>}
        </button>

        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold truncate ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>{exercise.name}</h4>
          <p className="text-sm text-muted-foreground">{exercise.muscle}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
          <div className="flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{exercise.sets}x{exercise.reps}</span>
          </div>
          <div className="flex items-center gap-1">
            <Timer className="w-3.5 h-3.5" />
            <span>{exercise.rest}</span>
          </div>
          <button
            onClick={handleExample}
            title="Ver exemplo do exercício"
            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 ml-11">
        <Weight className="w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="number"
          placeholder="Peso (kg)"
          value={weightInput}
          onChange={e => setWeightInput(e.target.value)}
          onBlur={handleWeightBlur}
          className="w-24 h-7 px-2 text-xs rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {savedWeight && <span className="text-xs text-muted-foreground">kg</span>}
        <AnimatePresence>
          {weightSaved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">Salvo!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

ExerciseCard.displayName = "ExerciseCard";

export default ExerciseCard;
