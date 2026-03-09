import { WorkoutPlan, UserProfile } from "@/lib/workout-generator";
import { Dumbbell } from "lucide-react";
import { forwardRef } from "react";

interface Props {
  plan: WorkoutPlan;
  profile: UserProfile;
}

const ShareWorkoutCard = forwardRef<HTMLDivElement, Props>(({ plan, profile }, ref) => {
  const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);

  return (
    <div
      ref={ref}
      className="w-[400px] p-6 rounded-2xl text-white"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-xl">FitForge</span>
          <p className="text-xs text-emerald-400">Seu treino personalizado</p>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold mb-2">{plan.title}</h2>
      <p className="text-sm text-gray-300 mb-6">{plan.description}</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Peso", value: `${profile.weight}kg` },
          { label: "Altura", value: `${profile.height}cm` },
          { label: "IMC", value: bmi },
          { label: "Dias/sem", value: `${plan.daysPerWeek}x` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <span className="text-lg font-bold text-emerald-400">{stat.value}</span>
            <span className="text-[10px] text-gray-400 block mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Days Summary */}
      <div className="space-y-2">
        {plan.days.map((day, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg px-4 py-3"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <span className="font-semibold text-sm">{day.day}</span>
            <span className="text-xs text-emerald-400">{day.focus} • {day.exercises.length} exercícios</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-gray-400">
          Gerado por <span className="text-emerald-400 font-semibold">FitForge</span>
        </p>
      </div>
    </div>
  );
});

ShareWorkoutCard.displayName = "ShareWorkoutCard";

export default ShareWorkoutCard;
