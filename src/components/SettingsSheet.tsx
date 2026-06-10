import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, Dumbbell, Sun, Moon, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasPersonalAccess } from "@/lib/admin";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { savePlan } from "@/lib/storage";
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
  const [advancedMode, setAdvancedMode] = useState(false);
  const [methods, setMethods] = useState<TrainingMethod[]>([]);
  const [trainingMethod, setTrainingMethod] = useState<string>("");

  const showPersonal = hasPersonalAccess(user);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("fitforge_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!open) return;
    supabase.from("training_methods").select("slug,name,short_description").eq("active", true)
      .then(({ data }) => setMethods((data ?? []) as TrainingMethod[]));
    if (user) {
      supabase.from("profiles").select("advanced_mode,training_method").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => {
          setAdvancedMode(!!data?.advanced_mode);
          setTrainingMethod(data?.training_method ?? "");
        });
    }
  }, [open, user]);

  const [regenerating, setRegenerating] = useState(false);

  const regeneratePlan = async (methodSlug: string | null) => {
    setRegenerating(true);
    const t = toast.loading(methodSlug ? "Aplicando método e regenerando treino..." : "Voltando ao treino padrão...");
    try {
      const { data, error } = await supabase.functions.invoke("apply-training-method", {
        body: { method: methodSlug ?? "" },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      // Atualiza cache local + notifica app
      if ((data as any)?.plan) {
        const plan = (data as any).plan;
        savePlan(plan);
        window.dispatchEvent(new CustomEvent("fitforge:plan-updated", { detail: plan }));
      }
      toast.success("Treino atualizado!", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao regenerar treino", { id: t });
    } finally {
      setRegenerating(false);
    }
  };

  const updateProfile = async (
    patch: { advanced_mode?: boolean; training_method?: string | null },
    opts: { regenerate?: boolean; methodForRegen?: string | null } = {}
  ) => {
    if (!user) { toast.error("Faça login para salvar preferências"); return; }
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    if (opts.regenerate) await regeneratePlan(opts.methodForRegen ?? null);
  };


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
        <SheetHeader className="border-b border-border pb-3">
          <span className="text-[10px] uppercase tracking-[0.22em] text-primary font-semibold">Sistema</span>
          <SheetTitle className="text-foreground font-display text-2xl tracking-wide leading-none" style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}>
            CONFIGURAÇÕES
          </SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-3">
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

          <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm">Modo avançado</h3>
                <p className="text-xs text-muted-foreground">Habilita métodos de treino avançados</p>
              </div>
              <Switch
                checked={advancedMode}
                disabled={regenerating}
                onCheckedChange={(v) => {
                  setAdvancedMode(v);
                  if (!v) {
                    setTrainingMethod("");
                    updateProfile({ advanced_mode: false, training_method: null }, { regenerate: true, methodForRegen: null });
                  } else {
                    updateProfile({ advanced_mode: true }, { regenerate: true, methodForRegen: trainingMethod || null });
                  }
                }}
              />
            </div>
            {advancedMode && (
              <div className="pt-2 border-t border-border space-y-2">
                <label className="text-xs text-muted-foreground">Método de treino</label>
                <Select
                  value={trainingMethod || "default"}
                  disabled={regenerating}
                  onValueChange={(v) => {
                    const val = v === "default" ? "" : v;
                    setTrainingMethod(val);
                    updateProfile({ training_method: val || null }, { regenerate: true, methodForRegen: val || null });
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Padrão" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão (sem técnica)</SelectItem>
                    {methods.map((m) => (
                      <SelectItem key={m.slug} value={m.slug}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {trainingMethod && (
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {methods.find((m) => m.slug === trainingMethod)?.short_description}
                  </p>
                )}
              </div>
            )}
          </div>

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
