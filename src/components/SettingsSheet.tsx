import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Dumbbell, Lock, KeyRound, Check, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { loadAdminPassword, saveAdminPassword, verifyAdminPassword } from "@/lib/storage";

const SettingsSheet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [passwordInput, setPasswordInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"menu" | "access" | "setup" | "change">("menu");
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("fitforge_theme") as "dark" | "light") || "dark";
  });

  const existingPassword = loadAdminPassword();

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("fitforge_theme", theme);
  }, [theme]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setMode("menu");
      setPasswordInput("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleAccessPersonal = () => {
    if (!existingPassword) {
      setMode("setup");
    } else {
      setMode("access");
    }
  };

  const handleSetupPassword = async () => {
    if (newPassword.length < 4) {
      toast({ title: "Senha muito curta", description: "A senha deve ter pelo menos 4 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas não conferem", description: "Digite a mesma senha nos dois campos.", variant: "destructive" });
      return;
    }
    await saveAdminPassword(newPassword);
    toast({ title: "Senha criada!", description: "Agora você pode acessar o modo Personal." });
    setOpen(false);
    navigate("/personal");
  };

  const handleLogin = async () => {
    const valid = await verifyAdminPassword(passwordInput);
    if (valid) {
      sessionStorage.setItem("fitforge_admin_auth", "true");
      setOpen(false);
      navigate("/personal");
    } else {
      toast({ title: "Senha incorreta", description: "Tente novamente.", variant: "destructive" });
      setPasswordInput("");
    }
  };

  const handleChangePassword = async () => {
    const valid = await verifyAdminPassword(passwordInput);
    if (!valid) {
      toast({ title: "Senha atual incorreta", description: "Tente novamente.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 4) {
      toast({ title: "Senha muito curta", description: "A senha deve ter pelo menos 4 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas não conferem", description: "Digite a mesma senha nos dois campos.", variant: "destructive" });
      return;
    }
    await saveAdminPassword(newPassword);
    toast({ title: "Senha atualizada!" });
    handleOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Configurações
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {mode === "menu" && (
            <>
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

              <button
                onClick={handleAccessPersonal}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Modo Personal</h3>
                  <p className="text-xs text-muted-foreground">Monte o treino do aluno manualmente</p>
                </div>
                <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
              </button>

              {existingPassword && (
                <button
                  onClick={() => setMode("change")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Alterar Senha ADM</h3>
                    <p className="text-xs text-muted-foreground">Atualize a senha de acesso</p>
                  </div>
                </button>
              )}
            </>
          )}

          {mode === "setup" && (
            <div className="space-y-4">
              <div className="text-center p-4">
                <KeyRound className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground">Criar Senha de Acesso</h3>
                <p className="text-xs text-muted-foreground mt-1">Defina uma senha para proteger o acesso ao modo Personal</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nova senha</label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 4 caracteres" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirmar senha</label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" onKeyDown={e => e.key === "Enter" && handleSetupPassword()} />
              </div>
              <Button className="w-full gap-2" onClick={handleSetupPassword}>
                <Check className="w-4 h-4" />
                Criar e Acessar
              </Button>
            </div>
          )}

          {mode === "access" && (
            <div className="space-y-4">
              <div className="text-center p-4">
                <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground">Acesso Restrito</h3>
                <p className="text-xs text-muted-foreground mt-1">Digite a senha de administrador</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Senha</label>
                <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Digite a senha" onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus />
              </div>
              <Button className="w-full gap-2" onClick={handleLogin}>
                <Dumbbell className="w-4 h-4" />
                Acessar Personal
              </Button>
            </div>
          )}

          {mode === "change" && (
            <div className="space-y-4">
              <div className="text-center p-4">
                <KeyRound className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground">Alterar Senha</h3>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Senha atual</label>
                <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Senha atual" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nova senha</label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirmar nova senha</label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" onKeyDown={e => e.key === "Enter" && handleChangePassword()} />
              </div>
              <Button className="w-full gap-2" onClick={handleChangePassword}>
                <Check className="w-4 h-4" />
                Atualizar Senha
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
