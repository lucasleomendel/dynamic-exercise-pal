import { useState } from "react";
import { UserProfile, ALL_MUSCLE_GROUPS, MuscleGroup } from "@/lib/workout-generator";
import { Dumbbell, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onSubmit: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const UserProfileForm = ({ onSubmit, initialProfile }: Props) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>(initialProfile || {});
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>(
    initialProfile?.selectedMuscles || [...ALL_MUSCLE_GROUPS]
  );

  const update = (field: string, value: string | number | boolean) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleMuscle = (m: MuscleGroup) => {
    setSelectedMuscles(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const nextStep = () => {
    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    } else if (profile.name && profile.age && profile.weight && profile.height && profile.sex && profile.goal && profile.level && profile.daysPerWeek && profile.hoursPerSession) {
      onSubmit({ ...profile, selectedMuscles } as UserProfile);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const muscleLabels: Record<MuscleGroup, { emoji: string; label: string }> = {
    peito: { emoji: '🫁', label: 'Peito' },
    costas: { emoji: '🔙', label: 'Costas' },
    pernas: { emoji: '🦵', label: 'Pernas' },
    ombros: { emoji: '💪', label: 'Ombros' },
    biceps: { emoji: '💪', label: 'Bíceps' },
    triceps: { emoji: '🦾', label: 'Tríceps' },
    abdomen: { emoji: '🎯', label: 'Abdômen' },
  };

  const steps = [
    {
      title: "Como você se chama?",
      content: (
        <input
          type="text"
          placeholder="Seu nome"
          value={profile.name || ""}
          onChange={e => update("name", e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
        />
      ),
      valid: !!profile.name,
    },
    {
      title: "Informações básicas",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Idade</label>
            <input type="number" placeholder="25" value={profile.age || ""} onChange={e => update("age", +e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Sexo</label>
            <div className="flex gap-2">
              {(["masculino", "feminino"] as const).map(s => (
                <button key={s} onClick={() => update("sex", s)}
                  className={`flex-1 py-3 rounded-lg border text-sm font-medium capitalize transition-all ${profile.sex === s ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:border-primary/50"}`}>
                  {s === "masculino" ? "♂ Masc" : "♀ Fem"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Peso (kg)</label>
            <input type="number" placeholder="75" value={profile.weight || ""} onChange={e => update("weight", +e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Altura (cm)</label>
            <input type="number" placeholder="175" value={profile.height || ""} onChange={e => update("height", +e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
        </div>
      ),
      valid: !!profile.age && !!profile.weight && !!profile.height && !!profile.sex,
    },
    {
      title: "Qual seu objetivo?",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "hipertrofia", label: "💪 Hipertrofia", desc: "Ganhar massa muscular" },
            { value: "emagrecimento", label: "🔥 Emagrecimento", desc: "Perder gordura" },
            { value: "resistencia", label: "🏃 Resistência", desc: "Melhorar condicionamento" },
            { value: "forca", label: "🏋️ Força", desc: "Aumentar cargas máximas" },
          ] as const).map(g => (
            <button key={g.value} onClick={() => update("goal", g.value)}
              className={`p-4 rounded-xl border text-left transition-all ${profile.goal === g.value ? "bg-primary/10 border-primary card-glow" : "bg-secondary border-border hover:border-primary/50"}`}>
              <span className="text-lg font-semibold block">{g.label}</span>
              <span className="text-xs text-muted-foreground">{g.desc}</span>
            </button>
          ))}
        </div>
      ),
      valid: !!profile.goal,
    },
    {
      title: "Qual seu nível?",
      content: (
        <div className="flex flex-col gap-3">
          {([
            { value: "iniciante", label: "🌱 Iniciante", desc: "Menos de 6 meses de treino" },
            { value: "intermediario", label: "⚡ Intermediário", desc: "6 meses a 2 anos de treino" },
            { value: "avancado", label: "🔥 Avançado", desc: "Mais de 2 anos de treino" },
          ] as const).map(l => (
            <button key={l.value} onClick={() => update("level", l.value)}
              className={`p-4 rounded-xl border text-left transition-all ${profile.level === l.value ? "bg-primary/10 border-primary card-glow" : "bg-secondary border-border hover:border-primary/50"}`}>
              <span className="text-lg font-semibold">{l.label}</span>
              <span className="text-sm text-muted-foreground ml-2">{l.desc}</span>
            </button>
          ))}
        </div>
      ),
      valid: !!profile.level,
    },
    {
      title: "Sua rotina de treino",
      content: (
        <div className="space-y-6">
          <div>
            <label className="text-sm text-muted-foreground mb-3 block">Quantos dias por semana você pode treinar?</label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map(d => (
                <button key={d} onClick={() => update("daysPerWeek", d)}
                  className={`flex-1 py-3 rounded-lg border text-lg font-bold transition-all ${profile.daysPerWeek === d ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:border-primary/50"}`}>
                  {d}x
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-3 block">Quanto tempo disponível por sessão?</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 0.5, label: "30 min" },
                { value: 0.75, label: "45 min" },
                { value: 1, label: "1 hora" },
                { value: 1.5, label: "1h30" },
              ]).map(t => (
                <button key={t.value} onClick={() => update("hoursPerSession", t.value)}
                  className={`py-3 rounded-lg border font-medium transition-all ${profile.hoursPerSession === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:border-primary/50"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {/* Split legs option - show when 4+ days and legs are selected */}
          {(profile.daysPerWeek || 0) >= 4 && (
            <div>
              <button
                onClick={() => update("splitLegs", !profile.splitLegs)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${profile.splitLegs ? "bg-primary/10 border-primary card-glow" : "bg-secondary border-border hover:border-primary/50"}`}
              >
                <span className="text-sm font-semibold block">🦵 Dividir treino de perna em 2 dias?</span>
                <span className="text-xs text-muted-foreground">Anterior (quadríceps) + Posterior (glúteo/panturrilha)</span>
              </button>
            </div>
          )}
        </div>
      ),
      valid: !!profile.daysPerWeek && !!profile.hoursPerSession,
    },
    // Muscle group selection step
    ...((profile.sex === 'masculino' || profile.sex === 'feminino') ? [{
      title: "Quais grupos musculares quer treinar?",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Desmarque os grupos que não quer incluir no treino.</p>
          <div className="grid grid-cols-2 gap-3">
            {ALL_MUSCLE_GROUPS.map(m => (
              <button key={m} onClick={() => toggleMuscle(m)}
                className={`p-4 rounded-xl border text-left transition-all ${selectedMuscles.includes(m) ? "bg-primary/10 border-primary card-glow" : "bg-secondary border-border text-muted-foreground hover:border-primary/50"}`}>
                <span className="text-lg font-semibold block">{muscleLabels[m].emoji} {muscleLabels[m].label}</span>
              </button>
            ))}
          </div>
        </div>
      ),
      valid: selectedMuscles.length >= 2,
    }] : []),
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">FitForge</span>
        </div>

        {/* Step with animation */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <h2 className="font-display text-2xl font-bold mb-6">{current.title}</h2>
            <div className="mb-8">{current.content}</div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={prevStep}
              className="px-6 py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-secondary text-foreground border border-border hover:bg-secondary/80 active:scale-[0.98]"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
          <button
            onClick={nextStep}
            disabled={!current.valid}
            className="flex-1 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]"
          >
            {step < steps.length - 1 ? "Continuar" : "Gerar Meu Treino"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileForm;
