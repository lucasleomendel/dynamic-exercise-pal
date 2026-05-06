import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, Dumbbell, Sun, Moon, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasPersonalAccess } from "@/lib/admin";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrainingMethod { slug: string; name: string; short_description: string; }


interface Props {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

const SettingsSheet = ({ open: openProp, onOpenChange }: Props = {}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;
  const setOpen = (v: boolean) => { onOpenChange?.(v); if (!controlled) setInternalOpen(v); };
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("fitforge_theme") as "dark" | "light") || "dark";
  });

  const showPersonal = hasPersonalAccess(user);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("fitforge_theme", theme);
  }, [theme]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!controlled && (
        <SheetTrigger asChild>
          <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className="bg-background border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Configurações
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Tema</h3>
              <p className="text-xs text-muted-foreground">{theme === "dark" ? "Modo escuro ativo" : "Modo claro ativo"}</p>
            </div>
          </button>

          {showPersonal && (
            <button
              onClick={() => { setOpen(false); navigate("/personal"); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Modo Personal</h3>
                <p className="text-xs text-muted-foreground">Monte o treino do aluno manualmente</p>
              </div>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
