import { UserProfile } from "@/lib/workout-generator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { User, Edit3, Trash2, Target, Calendar, Clock, Activity, Ruler, Scale, UserCircle2 } from "lucide-react";

interface Props {
  profile: UserProfile;
  onEdit: () => void;
  onClear: () => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

const goalLabels: Record<string, { label: string; emoji: string; color: string }> = {
  hipertrofia: { label: "Hipertrofia", emoji: "💪", color: "from-orange-500/20 to-red-500/20" },
  emagrecimento: { label: "Emagrecimento", emoji: "🔥", color: "from-yellow-500/20 to-orange-500/20" },
  resistencia: { label: "Resistência", emoji: "🏃", color: "from-blue-500/20 to-cyan-500/20" },
  forca: { label: "Força", emoji: "🏋️", color: "from-purple-500/20 to-pink-500/20" },
};

const levelLabels: Record<string, { label: string; emoji: string }> = {
  iniciante: { label: "Iniciante", emoji: "🌱" },
  intermediario: { label: "Intermediário", emoji: "⚡" },
  avancado: { label: "Avançado", emoji: "🔥" },
};

const getBmiInfo = (bmi: number) => {
  if (bmi < 18.5) return { label: "Abaixo", color: "text-blue-400" };
  if (bmi < 25) return { label: "Saudável", color: "text-emerald-400" };
  if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-400" };
  return { label: "Obesidade", color: "text-red-400" };
};

const ProfileSheet = ({ profile, onEdit, onClear, open, onOpenChange }: Props) => {
  const bmiNum = profile.weight / ((profile.height / 100) ** 2);
  const bmi = bmiNum.toFixed(1);
  const bmiInfo = getBmiInfo(bmiNum);
  const timeLabel = profile.hoursPerSession < 1 ? `${Math.round(profile.hoursPerSession * 60)}min` : `${profile.hoursPerSession}h`;
  const controlled = open !== undefined;
  const goal = goalLabels[profile.goal];
  const level = levelLabels[profile.level];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!controlled && (
        <SheetTrigger asChild>
          <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
            <User className="w-4 h-4" />
          </button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className="bg-background border-border overflow-y-auto p-0 w-full sm:max-w-md">
        {/* Hero Header */}
        <div className={`relative bg-gradient-to-br ${goal?.color || "from-primary/20 to-primary/5"} px-6 pt-8 pb-6 border-b border-border`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center shadow-lg">
              <UserCircle2 className="w-9 h-9 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-foreground truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Meu perfil
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {goal?.emoji} {goal?.label} · {level?.emoji} {level?.label}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary px-3 py-2.5 rounded-xl bg-background/70 hover:bg-background transition-colors backdrop-blur"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              onClick={onClear}
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-destructive px-3 py-2.5 rounded-xl bg-background/70 hover:bg-background transition-colors backdrop-blur"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Vitals: highlight IMC */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Métricas</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${bmiInfo.color}`}>
                {bmiInfo.label}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-4xl font-bold font-display text-foreground leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {bmi}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">IMC atual</div>
              </div>
              <div className="flex gap-2">
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{profile.weight}<span className="text-xs text-muted-foreground ml-0.5">kg</span></div>
                  <div className="text-[10px] text-muted-foreground">Peso</div>
                </div>
                <div className="w-px bg-border" />
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{profile.height}<span className="text-xs text-muted-foreground ml-0.5">cm</span></div>
                  <div className="text-[10px] text-muted-foreground">Altura</div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal */}
          <div>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Pessoal</h3>
            <div className="grid grid-cols-3 gap-2">
              <InfoChip icon={<User className="w-3.5 h-3.5" />} label="Idade" value={`${profile.age}`} suffix="anos" />
              <InfoChip icon={<Scale className="w-3.5 h-3.5" />} label="Sexo" value={profile.sex === "masculino" ? "M" : "F"} />
              <InfoChip icon={<Activity className="w-3.5 h-3.5" />} label="Nível" value={level?.emoji || "—"} />
            </div>
          </div>

          {/* Training */}
          <div>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Treino</h3>
            <div className="grid grid-cols-2 gap-2">
              <InfoChip icon={<Target className="w-3.5 h-3.5" />} label="Objetivo" value={`${goal?.emoji} ${goal?.label || "—"}`} compact />
              <InfoChip icon={<Activity className="w-3.5 h-3.5" />} label="Nível" value={`${level?.emoji} ${level?.label || "—"}`} compact />
              <InfoChip icon={<Calendar className="w-3.5 h-3.5" />} label="Frequência" value={`${profile.daysPerWeek}x`} suffix="por semana" />
              <InfoChip icon={<Clock className="w-3.5 h-3.5" />} label="Sessão" value={timeLabel} suffix="por dia" />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const InfoChip = ({
  icon,
  label,
  value,
  suffix,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  compact?: boolean;
}) => (
  <div className="rounded-xl bg-secondary/60 hover:bg-secondary transition-colors p-3 border border-transparent hover:border-border">
    <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
      {icon}
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
    </div>
    <div className={`font-semibold text-foreground leading-tight ${compact ? "text-sm" : "text-base"}`}>
      {value}
    </div>
    {suffix && <div className="text-[10px] text-muted-foreground mt-0.5">{suffix}</div>}
  </div>
);

export default ProfileSheet;
