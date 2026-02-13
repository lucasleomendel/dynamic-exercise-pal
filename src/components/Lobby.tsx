import { UserProfile, WorkoutPlan } from "@/lib/workout-generator";
import { Dumbbell, Edit3, Trash2, User, Target, Calendar, Clock, ArrowRight } from "lucide-react";

interface Props {
  profile: UserProfile;
  plan: WorkoutPlan;
  onEdit: () => void;
  onViewPlan: () => void;
  onClear: () => void;
}

const goalLabels: Record<string, string> = {
  hipertrofia: "💪 Hipertrofia",
  emagrecimento: "🔥 Emagrecimento",
  resistencia: "🏃 Resistência",
  forca: "🏋️ Força",
};

const levelLabels: Record<string, string> = {
  iniciante: "🌱 Iniciante",
  intermediario: "⚡ Intermediário",
  avancado: "🔥 Avançado",
};

const Lobby = ({ profile, plan, onEdit, onViewPlan, onClear }: Props) => {
  const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
  const timeLabel = profile.hoursPerSession < 1 ? `${Math.round(profile.hoursPerSession * 60)}min` : `${profile.hoursPerSession}h`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>FitForge</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gradient" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Olá, {profile.name}! 👋
          </h1>
          <p className="text-muted-foreground">Seu perfil e treino estão salvos. Você pode editar a qualquer momento.</p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-border p-6 mb-6 card-elevated">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Seu Perfil</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={onEdit} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20">
                <Edit3 className="w-3.5 h-3.5" />
                Editar
              </button>
              <button onClick={onClear} className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20">
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: "👤", label: "Idade", value: `${profile.age} anos` },
              { icon: "⚖️", label: "Peso", value: `${profile.weight}kg` },
              { icon: "📏", label: "Altura", value: `${profile.height}cm` },
              { icon: "📊", label: "IMC", value: bmi },
              { icon: "♀♂", label: "Sexo", value: profile.sex === "masculino" ? "Masculino" : "Feminino" },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-secondary/50 p-3">
                <span className="text-xs text-muted-foreground block mb-1">{item.icon} {item.label}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="rounded-xl bg-secondary/50 p-3">
              <span className="text-xs text-muted-foreground block mb-1"><Target className="w-3 h-3 inline" /> Objetivo</span>
              <span className="font-semibold text-foreground text-sm">{goalLabels[profile.goal]}</span>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3">
              <span className="text-xs text-muted-foreground block mb-1">🎯 Nível</span>
              <span className="font-semibold text-foreground text-sm">{levelLabels[profile.level]}</span>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3">
              <span className="text-xs text-muted-foreground block mb-1"><Calendar className="w-3 h-3 inline" /> Frequência</span>
              <span className="font-semibold text-foreground">{profile.daysPerWeek}x/sem</span>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3">
              <span className="text-xs text-muted-foreground block mb-1"><Clock className="w-3 h-3 inline" /> Sessão</span>
              <span className="font-semibold text-foreground">{timeLabel}</span>
            </div>
          </div>
        </div>

        {/* Go to Workout */}
        <button
          onClick={onViewPlan}
          className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]"
        >
          Ver Meu Treino
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Lobby;
