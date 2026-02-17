import { useState, useEffect, useCallback } from "react";
import { Timer, X, Play, Pause, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RestTimerProps {
  duration: string; // e.g. "60s", "90s", "120s"
  onComplete?: () => void;
}

function parseSeconds(rest: string): number {
  const match = rest.match(/(\d+)/);
  return match ? parseInt(match[1]) : 60;
}

const RestTimer = ({ duration, onComplete }: RestTimerProps) => {
  const totalSeconds = parseSeconds(duration);
  const [seconds, setSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!isRunning || seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, seconds, onComplete]);

  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const reset = useCallback(() => {
    setSeconds(totalSeconds);
    setIsRunning(true);
  }, [totalSeconds]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-24 right-4 z-40 w-48"
      >
        <div className={`rounded-2xl border p-4 shadow-lg backdrop-blur-xl ${seconds === 0 ? "bg-primary/20 border-primary" : "bg-background/95 border-border"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Descanso</span>
            </div>
            <button onClick={() => setShow(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-center mb-3">
            <span className={`text-3xl font-bold tabular-nums ${seconds === 0 ? "text-primary" : "text-foreground"}`}>
              {minutes}:{secs.toString().padStart(2, "0")}
            </span>
            {seconds === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-primary font-medium mt-1"
              >
                Hora de treinar! 💪
              </motion.p>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-secondary mb-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isRunning ? "Pausar" : "Retomar"}
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center px-3 py-1.5 rounded-lg text-xs bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RestTimer;
