import { useState, useEffect, useCallback, useMemo } from "react";
import { Droplets, Plus, Minus } from "lucide-react";

interface Props {
  weight: number;
  hoursPerSession: number;
  daysPerWeek: number;
}

function calculateDailyWater(weight: number, hoursPerSession: number, daysPerWeek: number): number {
  // Base: 35ml per kg of body weight
  let base = weight * 35;
  // Add for exercise: ~500ml per hour of training, spread across week
  const weeklyExtraML = hoursPerSession * 500 * daysPerWeek;
  base += weeklyExtraML / 7;
  // Round to nearest 100ml, convert to liters
  return Math.round(base / 100) * 100 / 1000;
}

const WATER_KEY = "fitforge_water";

interface WaterState {
  date: string;
  glasses: number;
}

function loadWater(): WaterState {
  const raw = localStorage.getItem(WATER_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as WaterState;
    const today = new Date().toISOString().split("T")[0];
    if (parsed.date === today) return parsed;
  }
  return { date: new Date().toISOString().split("T")[0], glasses: 0 };
}

function saveWater(state: WaterState) {
  localStorage.setItem(WATER_KEY, JSON.stringify(state));
}

const WaterTracker = ({ weight, hoursPerSession, daysPerWeek }: Props) => {
  const [water, setWater] = useState<WaterState>(loadWater);
  const dailyTarget = useMemo(() => calculateDailyWater(weight, hoursPerSession, daysPerWeek), [weight, hoursPerSession, daysPerWeek]);
  const glassSize = 0.25; // 250ml per glass
  const targetGlasses = Math.ceil(dailyTarget / glassSize);
  const currentLiters = (water.glasses * glassSize).toFixed(2);
  const progress = Math.min((water.glasses / targetGlasses) * 100, 100);

  useEffect(() => {
    saveWater(water);
  }, [water]);

  const addGlass = useCallback(() => {
    setWater(prev => ({ ...prev, glasses: prev.glasses + 1 }));
  }, []);

  const removeGlass = useCallback(() => {
    setWater(prev => ({ ...prev, glasses: Math.max(0, prev.glasses - 1) }));
  }, []);

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Hidratação</h3>
            <p className="text-xs text-muted-foreground">Meta: {dailyTarget.toFixed(1)}L/dia</p>
          </div>
        </div>
        <span className="text-lg font-bold text-foreground">{currentLiters}L</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 rounded-full bg-secondary overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: progress >= 100
              ? 'hsl(var(--primary))'
              : 'hsl(var(--ring))',
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {water.glasses}/{targetGlasses} copos (250ml)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={removeGlass}
            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={addGlass}
            className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {progress >= 100 && (
        <p className="text-xs text-primary font-semibold text-center mt-2">✅ Meta atingida! Continue hidratado.</p>
      )}
    </div>
  );
};

export default WaterTracker;
