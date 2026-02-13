import { UserProfile } from "@/lib/workout-generator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { User, Edit3, Trash2, Target, Calendar, Clock } from "lucide-react";

interface Props {
  profile: UserProfile;
  onEdit: () => void;
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

const ProfileSheet = ({ profile, onEdit, onClear }: Props) => {
  const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
  const timeLabel = profile.hoursPerSession < 1 ? `${Math.round(profile.hoursPerSession * 60)}min` : `${profile.hoursPerSession}h`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
          <User className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Meu Perfil
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20">
              <Edit3 className="w-3.5 h-3.5" />
              Editar
            </button>
            <button onClick={onClear} className="flex-1 flex items-center justify-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors px-3 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20">
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
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

          {/* Training Info */}
          <div className="grid grid-cols-2 gap-3">
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
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSheet;
