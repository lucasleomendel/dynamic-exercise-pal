import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, LogIn, UserCircle2, ShieldCheck, Dumbbell, User, IdCard, Calendar, Phone } from "lucide-react";
import logoImg from "@/assets/logo-fitforge.png";

type Mode = "login" | "signup" | "forgot";
type Role = "aluno" | "personal";

const isValidCPF = (cpf: string): boolean => {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
  let d1 = 11 - (sum % 11); if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
  let d2 = 11 - (sum % 11); if (d2 >= 10) d2 = 0;
  return d2 === parseInt(c[10]);
};
const formatCPF = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const formatPhone = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");

const Auth = () => {
  // tab: login | signup_aluno | signup_personal
  const [tab, setTab] = useState<"login" | "signup_aluno" | "signup_personal">("login");
  const [mode, setMode] = useState<Mode>("login");
  const role: Role = tab === "signup_personal" ? "personal" : "aluno";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [cref, setCref] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { enterGuestMode } = useAuth();
  const navigate = useNavigate();

  const isSignup = tab !== "login" && mode !== "forgot";
  const isLogin = tab === "login" && mode !== "forgot";

  const switchTab = (t: typeof tab) => {
    setTab(t);
    setMode(t === "login" ? "login" : "signup");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Login realizado com sucesso!" });
      } else if (mode === "signup") {
        // Validações de signup
        if (!name.trim()) { toast({ title: "Informe seu nome", variant: "destructive" }); setLoading(false); return; }
        if (!isValidCPF(cpf)) { toast({ title: "CPF inválido", variant: "destructive" }); setLoading(false); return; }
        if (!birthDate) { toast({ title: "Informe sua data de nascimento", variant: "destructive" }); setLoading(false); return; }
        if (phone.replace(/\D/g, "").length < 10) { toast({ title: "Telefone inválido", variant: "destructive" }); setLoading(false); return; }
        if (role === "personal" && cref.trim().length < 9) {
          toast({ title: "CREF obrigatório", description: "Informe o registro completo (ex: 012345-G/SP).", variant: "destructive" });
          setLoading(false); return;
        }

        const metadata: Record<string, unknown> = {
          name: name.trim(),
          cpf: cpf.replace(/\D/g, ""),
          phone: phone.replace(/\D/g, ""),
          birth_date: birthDate,
        };
        if (role === "personal") {
          metadata.pending_cref = cref.trim().toUpperCase();
          metadata.requested_role = "personal";
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: metadata },
        });
        if (error) throw error;

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
        toast({ title: "Cadastro realizado!", description: "Verifique seu email para confirmar a conta." });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Email enviado", description: "Confira sua caixa para redefinir a senha." });
        setMode("login"); setTab("login");
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
      if (result.error) toast({ title: "Erro ao conectar com Google", description: result.error.message ?? "Tente novamente.", variant: "destructive" });
    } catch (e) {
      toast({ title: "Erro inesperado", description: e instanceof Error ? e.message : "Tente novamente.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const title = mode === "forgot" ? "Recuperar senha"
    : tab === "login" ? "Entrar"
    : tab === "signup_personal" ? "Cadastro Personal"
    : "Cadastro Aluno";
  const subtitle = mode === "forgot" ? "Enviaremos um link para seu email"
    : tab === "login" ? "Acesse seu treino personalizado"
    : tab === "signup_personal" ? "Cadastre-se com CREF para gerenciar alunos"
    : "Comece sua jornada fitness";
  const eyebrow = mode === "forgot" ? "Recuperação"
    : tab === "login" ? "Acesso"
    : tab === "signup_personal" ? "Profissional"
    : "Novo aluno";

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-sm mx-auto px-4 pt-6 pb-8 space-y-4">
        {/* Industrial Compact header */}
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <img src={logoImg} alt="FitForge" className="w-11 h-11 rounded-lg" />
          <div className="leading-tight">
            <span className="font-display text-xl tracking-wider text-foreground block">FITFORGE</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Forge your body · Build the plan</span>
          </div>
        </div>

        {/* 3-tab segmented control (always visible exceto em forgot) */}
        {mode !== "forgot" && (
          <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/60 rounded-lg border border-border">
            <button type="button" onClick={() => switchTab("login")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-display tracking-wider uppercase transition ${tab === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
            <button type="button" onClick={() => switchTab("signup_aluno")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-display tracking-wider uppercase transition ${tab === "signup_aluno" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Dumbbell className="w-3.5 h-3.5" /> Aluno
            </button>
            <button type="button" onClick={() => switchTab("signup_personal")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-display tracking-wider uppercase transition ${tab === "signup_personal" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <ShieldCheck className="w-3.5 h-3.5" /> Personal
            </button>
          </div>
        )}

        <div>
          <span className="text-[10px] uppercase tracking-[0.22em] text-primary font-semibold">{eyebrow}</span>
          <h1 className="font-display text-3xl text-foreground tracking-wide leading-none mt-1">{title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {isSignup && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" required />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
          </div>

          {mode !== "forgot" && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type={showPassword ? "text" : "password"} placeholder="Senha" value={password}
                onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {isSignup && (
            <>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input inputMode="numeric" placeholder="CPF (000.000.000-00)" value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))} className="pl-10" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input type="date" value={birthDate} max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setBirthDate(e.target.value)} className="pl-9" required />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input inputMode="tel" placeholder="(11) 99999-9999" value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))} className="pl-10" required />
                </div>
              </div>

              {role === "personal" && (
                <div className="space-y-1 rounded-lg border border-primary/40 bg-primary/5 p-3">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold">Validação CREF</span>
                  <div className="relative mt-1">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input value={cref} onChange={(e) => setCref(e.target.value.toUpperCase())}
                      placeholder="CREF (ex: 012345-G/SP)" className="pl-10 tracking-wider" maxLength={12} required />
                  </div>
                  <p className="text-[10px] text-muted-foreground">6 dígitos + G (graduado) ou P (provisionado) + UF. Validação imediata.</p>
                </div>
              )}
            </>
          )}

          <Button type="submit" className="w-full gap-2 font-display tracking-wider text-base h-11" disabled={loading}>
            <LogIn className="w-4 h-4" />
            {loading ? "CARREGANDO..." : mode === "login" ? "ENTRAR" : mode === "signup" ? (role === "personal" ? "CADASTRAR COMO PERSONAL" : "CRIAR CONTA") : "ENVIAR LINK"}
          </Button>
        </form>

        {isLogin && (
          <div className="text-center">
            <button onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              Esqueci minha senha
            </button>
          </div>
        )}

        {mode !== "forgot" && (
          <>
            <div className="relative pt-1">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground tracking-[0.2em] text-[10px]">ou</span>
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

            {isLogin && (
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => { enterGuestMode(); navigate("/", { replace: true }); }}>
                <UserCircle2 className="w-4 h-4" />
                Continuar como visitante
              </Button>
            )}
          </>
        )}

        {mode === "forgot" && (
          <p className="text-center text-sm">
            <button onClick={() => { setMode("login"); setTab("login"); }} className="text-primary font-medium hover:underline">
              Voltar ao login
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
