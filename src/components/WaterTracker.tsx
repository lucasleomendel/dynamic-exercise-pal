import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Droplets, Plus, Minus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { pullWater, syncWater } from "@/lib/cloud-sync";

interface Props {
  weight: number;
  hoursPerSession: number;
  daysPerWeek: number;
}

function calculateDailyWater(weight: number, hoursPerSession: number, daysPerWeek: number): number {
  const safeWeight = Number.isFinite(weight) && weight > 0 ? Math.min(weight, 350) : 70;
  const safeHours = Number.isFinite(hoursPerSession) && hoursPerSession > 0 ? Math.min(hoursPerSession, 4) : 1;
  const safeDays = Number.isFinite(daysPerWeek) && daysPerWeek > 0 ? Math.min(daysPerWeek, 7) : 3;
  const base = safeWeight * 35;
  const weeklyExtraML = safeHours * 500 * safeDays;
  const dailyML = base + weeklyExtraML / 7;
  return Math.max(1.5, Math.round(dailyML / 100) * 100 / 1000);
}

function getLocalDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const WATER_KEY = "fitforge_water";

interface WaterState {
  date: string;
  glasses: number;
}

function loadWater(): WaterState {
  const today = getLocalDateKey();
  const raw = localStorage.getItem(WATER_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<WaterState>;
      if (parsed.date === today && Number.isInteger(parsed.glasses) && (parsed.glasses ?? 0) >= 0) {
        return { date: today, glasses: parsed.glasses as number };
      }
    } catch (error) {
      console.warn("[FitForge] Registro de hidratação local inválido.", error);
    }
  }
  return { date: today, glasses: 0 };
}

function saveWater(state: WaterState) {
  localStorage.setItem(WATER_KEY, JSON.stringify(state));
}

const WaterTracker = ({ weight, hoursPerSession, daysPerWeek }: Props) => {
  const { user } = useAuth();
  const [water, setWater] = useState<WaterState>(loadWater);
  const hydratedRef = useRef(!user);
  const userId = user?.id;
  const dailyTarget = useMemo(() => calculateDailyWater(weight, hoursPerSession, daysPerWeek), [weight, hoursPerSession, daysPerWeek]);
  const waterRef = useRef(water);
  const targetRef = useRef(dailyTarget);

  useEffect(() => {
    waterRef.current = water;
  }, [water]);

  useEffect(() => {
    targetRef.current = dailyTarget;
  }, [dailyTarget]);

  useEffect(() => {
    const refreshDate = () => {
      const today = getLocalDateKey();
      setWater((prev) => prev.date === today ? prev : { date: today, glasses: 0 });
    };
    document.addEventListener("visibilitychange", refreshDate);
    return () => document.removeEventListener("visibilitychange", refreshDate);
  }, []);

  const dailyTarget = useMemo(() => calculateDailyWater(weight, hoursPerSession, daysPerWeek), [weight, hoursPerSession, daysPerWeek]);
  const glassSize = 0.25; // 250ml per glass
  const targetGlasses = Math.max(1, Math.ceil(dailyTarget / glassSize));
  const currentLiters = (water.glasses * glassSize).toFixed(2);
  const progress = Math.min((water.glasses / targetGlasses) * 100, 100);

  useEffect(() => {
    let active = true;
    const date = water.date;

    if (!userId) {
      hydratedRef.current = true;
      return () => { active = false; };
    }

    hydratedRef.current = false;
    pullWater(date, userId)
      .then((remote) => {
        if (!active) return;
        if (remote) {
          const next = { date, glasses: Math.max(0, remote.glasses) };
          setWater(next);
          saveWater(next);
        } else {
          hydratedRef.current = true;
          void syncWater({ date, glasses: waterRef.current.glasses, goalMl: Math.round(targetRef.current * 1000) }, userId)
            .catch((error) => console.warn("[FitForge] Falha ao sincronizar hidratação.", error));
        }
        hydratedRef.current = true;
      })
      .catch((error) => {
        if (!active) return;
        hydratedRef.current = true;
        console.warn("[FitForge] Falha ao carregar hidratação da conta.", error);
      });

    return () => { active = false; };
  }, [userId, water.date]);

  useEffect(() => {
    saveWater(water);
    if (!userId || !hydratedRef.current) return;
    void syncWater({
      date: water.date,
      glasses: water.glasses,
      goalMl: Math.round(dailyTarget * 1000),
    }, userId).catch((error) => {
      console.warn("[FitForge] Falha ao sincronizar hidratação.", error);
    });
  }, [water, userId, dailyTarget]);

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
            <h3 className="font-bold text-foreground" style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}>Hidratação</h3>
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
            disabled={water.glasses === 0}
            aria-label="Remover um copo de água"
            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={addGlass}
            aria-label="Adicionar um copo de água"
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
