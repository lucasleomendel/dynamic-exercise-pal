import { Exercise } from "@/lib/workout-generator";
import { Timer, RotateCcw, Play } from "lucide-react";

interface Props {
  exercise: Exercise;
  index: number;
}

const ExerciseCard = ({ exercise, index }: Props) => {
  const handleExample = () => {
    const query = encodeURIComponent(`como fazer ${exercise.name} exercício academia`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-all group">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold font-display text-sm shrink-0">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground truncate">{exercise.name}</h4>
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
