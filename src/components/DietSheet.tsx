import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UtensilsCrossed, RefreshCw, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { DietProfile, DietPlan, generateDietPlan } from "@/lib/diet-generator";

interface Props {
  goal: 'hipertrofia' | 'emagrecimento' | 'resistencia' | 'forca';
  weight: number;
  height: number;
  age: number;
  sex: 'masculino' | 'feminino';
}

const restrictionOptions = [
  { value: 'vegano', label: '🌱 Vegano' },
  { value: 'vegetariano', label: '🥗 Vegetariano' },
  { value: 'sem_lactose', label: '🥛 Sem lactose' },
  { value: 'sem_gluten', label: '🌾 Sem glúten' },
];

const activityOptions: { value: DietProfile['activityLevel']; label: string }[] = [
  { value: 'sedentario', label: 'Sedentário' },
  { value: 'leve', label: 'Leve' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'intenso', label: 'Intenso' },
  { value: 'muito_intenso', label: 'Muito intenso' },
];

const DietSheet = ({ goal, weight, height, age, sex }: Props) => {
  const [activityLevel, setActivityLevel] = useState<DietProfile['activityLevel']>('moderado');
  const [mealsPerDay, setMealsPerDay] = useState(5);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [preferences, setPreferences] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<number>(0);
  const [showTips, setShowTips] = useState(false);

  const toggleRestriction = (r: string) => {
    setRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const generate = () => {
    const profile: DietProfile = {
      goal, weight, height, age, sex,
      activityLevel,
      mealsPerDay,
      restrictions,
      preferences: preferences.split(',').map(s => s.trim()).filter(Boolean),
      dislikes: dislikes.split(',').map(s => s.trim()).filter(Boolean),
    };
    setPlan(generateDietPlan(profile));
  };

  const regenerate = () => generate();

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
          <UtensilsCrossed className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Planejador de Dieta
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!plan ? (
            <>
              {/* Activity Level */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Nível de atividade diária</label>
                <div className="flex flex-wrap gap-2">
                  {activityOptions.map(a => (
                    <button
                      key={a.value}
                      onClick={() => setActivityLevel(a.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityLevel === a.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border border-border hover:border-primary/50'}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meals per day */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Refeições por dia</label>
                <div className="flex gap-2">
                  {[3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => setMealsPerDay(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mealsPerDay === n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border border-border hover:border-primary/50'}`}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Restrictions */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Restrições alimentares</label>
                <div className="grid grid-cols-2 gap-2">
                  {restrictionOptions.map(r => (
                    <button
                      key={r.value}
                      onClick={() => toggleRestriction(r.value)}
                      className={`p-2 rounded-lg text-xs font-medium text-left transition-all ${restrictions.includes(r.value) ? 'bg-primary/10 border border-primary' : 'bg-secondary border border-border hover:border-primary/50'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Preferências (separar por vírgula)</label>
                <input
                  type="text"
                  placeholder="ex: frango, arroz, ovo..."
                  value={preferences}
                  onChange={e => setPreferences(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Dislikes */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Alimentos que não gosta (separar por vírgula)</label>
                <input
                  type="text"
                  placeholder="ex: peixe, abacate..."
                  value={dislikes}
                  onChange={e => setDislikes(e.target.value)}
                  className={inputClass}
                />
              </div>

              <button
                onClick={generate}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Gerar Dieta
              </button>
            </>
          ) : (
            <>
              {/* Macro summary */}
              <div className="rounded-xl bg-secondary/50 p-4 text-center">
                <span className="text-xs text-muted-foreground block mb-1">Meta Diária</span>
                <span className="text-2xl font-bold text-foreground">{plan.totalCalories} kcal</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-secondary/50 p-3 text-center">
                  <span className="text-[10px] text-muted-foreground block">Proteína</span>
                  <span className="text-sm font-bold text-foreground">{plan.totalProtein}g</span>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3 text-center">
                  <span className="text-[10px] text-muted-foreground block">Carbos</span>
                  <span className="text-sm font-bold text-foreground">{plan.totalCarbs}g</span>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3 text-center">
                  <span className="text-[10px] text-muted-foreground block">Gordura</span>
                  <span className="text-sm font-bold text-foreground">{plan.totalFat}g</span>
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-2">
                {plan.meals.map((meal, i) => (
                  <div key={i} className="rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedMeal(expandedMeal === i ? -1 : i)}
                      className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="text-left">
                        <span className="text-sm font-semibold text-foreground block">{meal.name}</span>
                        <span className="text-[10px] text-muted-foreground">{meal.time} • {meal.totalCalories} kcal</span>
                      </div>
                      {expandedMeal === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {expandedMeal === i && (
                      <div className="px-3 pb-3 space-y-2">
                        {meal.foods.map((food, j) => (
                          <div key={j} className="rounded-lg bg-secondary/30 p-2">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-medium text-foreground">{food.item}</span>
                              <span className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap">{food.calories} kcal</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{food.portion}</span>
                            <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span>P: {food.protein}g</span>
                              <span>C: {food.carbs}g</span>
                              <span>G: {food.fat}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tips */}
              <button
                onClick={() => setShowTips(!showTips)}
                className="w-full flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {showTips ? 'Ocultar dicas' : 'Ver dicas nutricionais'}
              </button>

              {showTips && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                  {plan.tips.map((tip, i) => (
                    <div key={i} className="rounded-lg bg-primary/5 border border-primary/20 p-2 text-xs text-foreground">
                      💡 {tip}
                    </div>
                  ))}
                </div>
              )}

              {/* Regenerate */}
              <button
                onClick={regenerate}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-secondary text-foreground hover:bg-secondary/80 active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                Gerar Nova Dieta
              </button>

              <button
                onClick={() => setPlan(null)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Voltar às configurações
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DietSheet;
