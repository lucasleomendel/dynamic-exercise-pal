import { Exercise } from "@/lib/workout-generator";
import { Timer, RotateCcw, Play, Check } from "lucide-react";

interface Props {
  exercise: Exercise;
  index: number;
  checked?: boolean;
  onToggleCheck?: (key: string) => void;
  exerciseKey: string;
}

const ExerciseCard = ({ exercise, index, checked, onToggleCheck, exerciseKey }: Props) => {
  const handleExample = () => {
    const query = encodeURIComponent(`como fazer ${exercise.name} exercício academia`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all group ${checked ? "bg-primary/5 border-primary/30 opacity-70" : "bg-secondary/50 border-border hover:border-primary/30"}`}>
      {/* Check button */}
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
  );
};

export default ExerciseCard;
