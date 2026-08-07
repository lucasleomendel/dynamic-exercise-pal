import { UserProfile } from "@/lib/workout-generator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Edit3,
  Trash2,
  Target,
  Calendar,
  Clock,
  Activity,
  Scale,
  Ruler,
  Mail,
  Flame,
  Dumbbell,
  TrendingUp,
} from "lucide-react";

interface Props {
  profile: UserProfile;
  onEdit: () => void;
  onClear: () => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

const goalLabels: Record<string, { label: string; emoji: string }> = {
  hipertrofia: { label: "Hipertrofia", emoji: "💪" },
  emagrecimento: { label: "Emagrecimento", emoji: "🔥" },
  resistencia: { label: "Resistência", emoji: "🏃" },
  forca: { label: "Força", emoji: "🏋️" },
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

const getHistoryStats = () => {
  try {
    const raw = localStorage.getItem("fitforge_history");
    if (!raw) return { total: 0, last7: 0, streak: 0 };
    const items: { date: string }[] = JSON.parse(raw);
    const now = new Date();
    const dates = new Set(items.map((i) => i.date.slice(0, 10)));
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (dates.has(key)) streak++;
      else if (i > 0) break;
    }
    const last7 = items.filter((i) => {
      const diff = (now.getTime() - new Date(i.date).getTime()) / 86400000;
      return diff <= 7;
    }).length;
    return { total: items.length, last7, streak };
  } catch {
    return { total: 0, last7: 0, streak: 0 };
  }
};

const ProfileSheet = ({ profile, onEdit, onClear, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const bmiNum = profile.weight / ((profile.height / 100) ** 2);
  const bmi = bmiNum.toFixed(1);
  const bmiInfo = getBmiInfo(bmiNum);
  const timeLabel = profile.hoursPerSession < 1 ? `${Math.round(profile.hoursPerSession * 60)}min` : `${profile.hoursPerSession}h`;
  const controlled = open !== undefined;
  const goal = goalLabels[profile.goal];
  const level = levelLabels[profile.level];
  const stats = getHistoryStats();
  const initials = (profile.name || "U").trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    : "—";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!controlled && (
        <SheetTrigger asChild>
          <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
            <User className="w-4 h-4" />
          </button>
        </SheetTrigger>
      )}
      <SheetContent
        side="right"
        className="bg-background border-l border-border overflow-y-auto p-0 w-full sm:max-w-md"
      >
        {/* HERO — Industrial compact */}
        <div className="relative px-5 pt-7 pb-5 border-b-2 border-border bg-gradient-to-br from-primary/15 via-background to-background">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/15 border-2 border-primary/40 flex items-center justify-center text-primary font-display text-2xl tracking-wider shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-semibold">Atleta</div>
              <h2 className="font-display text-3xl leading-none tracking-wide text-foreground truncate mt-1">
                {profile.name || "Sem nome"}
              </h2>
              {user?.email && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1.5 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                <Calendar className="w-3 h-3" />
                Membro desde {memberSince}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary px-3 py-2.5 rounded-md bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              onClick={onClear}
              className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-destructive px-3 py-2.5 rounded-md bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* BENTO: IMC (col-span-2) + 3 stats */}
          <div className="grid grid-cols-4 gap-2">
            {/* IMC card destaque */}
            <div className="col-span-2 row-span-2 rounded-lg border border-border bg-card p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">IMC</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${bmiInfo.color}`}>
                    {bmiInfo.label}
                  </span>
                </div>
                <div className="font-display text-5xl text-foreground leading-none tracking-wide">{bmi}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Índice atual</div>
              </div>
              <div className="relative flex gap-3 mt-3">
                <div>
                  <div className="font-display text-xl text-foreground leading-none">{profile.weight}<span className="text-[10px] text-muted-foreground ml-0.5 font-sans">kg</span></div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">Peso</div>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <div className="font-display text-xl text-foreground leading-none">{profile.height}<span className="text-[10px] text-muted-foreground ml-0.5 font-sans">cm</span></div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">Altura</div>
                </div>
              </div>
            </div>

            {/* Streak */}
            <StatCell
              icon={<Flame className="w-3.5 h-3.5" />}
              label="Streak"
              value={String(stats.streak)}
              suffix="dias"
              accent
            />
            {/* Total treinos */}
            <StatCell
              icon={<Dumbbell className="w-3.5 h-3.5" />}
              label="Total"
              value={String(stats.total)}
              suffix="treinos"
            />
            {/* Última semana */}
            <StatCell
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              label="7 dias"
              value={String(stats.last7)}
              suffix="sessões"
            />
            {/* Idade */}
            <StatCell
              icon={<User className="w-3.5 h-3.5" />}
              label="Idade"
              value={String(profile.age)}
              suffix="anos"
            />
          </div>

          {/* PESSOAL */}
          <SectionHeader>Pessoal</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            <InfoRow icon={<Scale className="w-3.5 h-3.5" />} label="Sexo" value={profile.sex === "masculino" ? "Masculino" : "Feminino"} />
            <InfoRow icon={<Activity className="w-3.5 h-3.5" />} label="Nível" value={`${level?.emoji} ${level?.label || "—"}`} />
          </div>

          {/* TREINO */}
          <SectionHeader>Treino</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            <InfoRow icon={<Target className="w-3.5 h-3.5" />} label="Objetivo" value={`${goal?.emoji} ${goal?.label || "—"}`} />
            <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Frequência" value={`${profile.daysPerWeek}x / semana`} />
            <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Sessão" value={`${timeLabel} / dia`} />
            <InfoRow
              icon={<Ruler className="w-3.5 h-3.5" />}
              label="Volume sem."
              value={`${(profile.daysPerWeek * profile.hoursPerSession).toFixed(1)}h`}
            />
          </div>

          {profile.selectedMuscles && profile.selectedMuscles.length > 0 && (
            <>
              <SectionHeader>Grupos ativos</SectionHeader>
              <div className="flex flex-wrap gap-1.5">
                {profile.selectedMuscles.map((m) => (
                  <span
                    key={m}
                    className="px-2.5 py-1 rounded-md bg-secondary border border-border text-[10px] uppercase tracking-wider font-semibold text-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 pt-2">
    <div className="h-px flex-1 bg-border" />
    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">{children}</span>
    <div className="h-px flex-1 bg-border" />
  </div>
);

const StatCell = ({
  icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) => (
  <div
    className={`rounded-lg border p-2.5 flex flex-col justify-between min-h-[68px] ${
      accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"
    }`}
  >
    <div className={`flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold ${accent ? "text-primary" : "text-muted-foreground"}`}>
      {icon}
      <span>{label}</span>
    </div>
    <div>
      <div className="font-display text-2xl text-foreground leading-none tracking-wide">{value}</div>
      {suffix && <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{suffix}</div>}
    </div>
  </div>
);

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-md border border-border bg-card px-3 py-2.5">
    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
      {icon}
      <span className="text-[9px] uppercase tracking-wider font-semibold">{label}</span>
    </div>
    <div className="text-sm font-semibold text-foreground leading-tight">{value}</div>
  </div>
);

export default ProfileSheet;
