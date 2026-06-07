import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, LogIn, UserCircle2, ShieldCheck, Dumbbell } from "lucide-react";
import logoImg from "@/assets/logo-fitforge.png";

type Mode = "login" | "signup" | "forgot";
type Role = "aluno" | "personal";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("aluno");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cref, setCref] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { enterGuestMode } = useAuth();
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Login realizado com sucesso!" });
      } else if (mode === "signup") {
        if (role === "personal" && cref.trim().length < 9) {
          toast({ title: "CREF obrigatório", description: "Informe o registro completo (ex: 012345-G/SP).", variant: "destructive" });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: role === "personal" ? { pending_cref: cref.trim().toUpperCase(), requested_role: "personal" } : {},
          },
        });
        if (error) throw error;

        // Se for personal e a sessão já existe (auto-confirm), valida CREF agora.
        if (role === "personal" && data.session?.user) {
          try {
            const { data: vd } = await supabase.functions.invoke("validate-cref", {
              body: { cref: cref.trim().toUpperCase(), userId: data.session.user.id },
            });
            if (vd?.valid) {
              await supabase.auth.refreshSession();
              toast({ title: "Personal cadastrado!", description: `CREF ${vd.cref} validado.` });
              return;
            }
            toast({ title: "Conta criada, CREF pendente", description: vd?.error || "Valide o CREF ao entrar.", variant: "destructive" });
            return;
          } catch {
            toast({ title: "Conta criada", description: "CREF será validado no primeiro login." });
            return;
          }
        }

        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta.",
        });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Email enviado", description: "Confira sua caixa para redefinir a senha." });
        setMode("login");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) {
        toast({ title: "Erro ao conectar com Google", description: result.error.message ?? "Tente novamente.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro inesperado", description: e instanceof Error ? e.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Entrar" : mode === "signup" ? "Criar Conta" : "Recuperar senha";
  const subtitle =
    mode === "login" ? "Acesse seu treino personalizado" :
    mode === "signup" ? "Comece sua jornada fitness" :
    "Enviaremos um link para seu email";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <img src={logoImg} alt="FitForge" className="w-16 h-16 mx-auto rounded-2xl" />
          <h1 className="font-display text-3xl text-foreground tracking-wide">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-lg">
            <button
              type="button"
              onClick={() => setRole("aluno")}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                role === "aluno" ? "bg-background text-foreground shadow" : "text-muted-foreground"
              }`}
            >
              <Dumbbell className="w-4 h-4" /> Aluno
            </button>
            <button
              type="button"
              onClick={() => setRole("personal")}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                role === "personal" ? "bg-background text-foreground shadow" : "text-muted-foreground"
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Personal
            </button>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
          </div>

          {mode !== "forgot" && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {mode === "signup" && role === "personal" && (
            <div className="space-y-1">
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={cref}
                  onChange={(e) => setCref(e.target.value.toUpperCase())}
                  placeholder="CREF (ex: 012345-G/SP)"
                  className="pl-10 tracking-wider"
                  maxLength={12}
                  required
                />
              </div>
              <p className="text-[10px] text-muted-foreground px-1">
                6 dígitos + G (graduado) ou P (provisionado) + UF
              </p>
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <LogIn className="w-4 h-4" />
            {loading ? "Carregando..." : mode === "login" ? "Entrar" : mode === "signup" ? "Cadastrar" : "Enviar link"}
          </Button>
        </form>

        {mode === "login" && (
          <div className="text-center">
            <button
              onClick={() => setMode("forgot")}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
        )}

        {mode !== "forgot" && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} disabled={loading}>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Entrar com Google
            </Button>

            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => { enterGuestMode(); navigate("/", { replace: true }); }}
            >
              <UserCircle2 className="w-4 h-4" />
              Continuar como visitante
            </Button>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" && (
            <>
              Não tem conta?{" "}
              <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                Cadastre-se
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Já tem conta?{" "}
              <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                Faça login
              </button>
            </>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
              Voltar ao login
            </button>
          )}
        </p>
      </div>
    </div>
  );
};

export default Auth;
