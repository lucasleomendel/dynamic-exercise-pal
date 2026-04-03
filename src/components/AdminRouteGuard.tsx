import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isMasterAdmin, hasPersonalAccess } from "@/lib/admin";
import { Lock, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

const AdminRouteGuard = ({ children }: AdminRouteGuardProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [cref, setCref] = useState("");
  const [validating, setValidating] = useState(false);

  if (loading) return null;

  const userMeta = user?.user_metadata as Record<string, unknown> | undefined;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Acesso Restrito
          </h1>
          <p className="text-sm text-muted-foreground">Faça login para acessar.</p>
          <Button onClick={() => navigate("/auth")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  // Master admin or already validated personal
  if (hasPersonalAccess(user.email, userMeta)) {
    return <>{children}</>;
  }

  // CREF validation form
  const handleValidateCref = async () => {
    if (!cref.trim()) return;
    setValidating(true);

    try {
      const { data, error } = await supabase.functions.invoke("validate-cref", {
        body: { cref: cref.trim(), userId: user.id },
      });

      if (error) throw error;

      if (data?.valid) {
        toast({ title: "CREF validado! ✅", description: `Registro ${data.cref} confirmado. Bem-vindo, Personal!` });
        // Refresh session to get updated metadata
        await supabase.auth.refreshSession();
        window.location.reload();
      } else {
        toast({ title: "CREF inválido", description: data?.error || "Verifique o número e tente novamente.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível validar o CREF.", variant: "destructive" });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Área do Personal Trainer
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Para acessar o painel, informe seu número de registro CREF.
          </p>
        </div>

        <div className="space-y-3">
          <Input
            value={cref}
            onChange={e => setCref(e.target.value.toUpperCase())}
            placeholder="000000-G/UF (ex: 012345-G/SP)"
            className="text-center text-lg tracking-wider"
            maxLength={12}
          />
          <p className="text-[10px] text-muted-foreground">
            Formato: 6 dígitos + G (graduado) ou P (provisionado) + UF
          </p>
          <Button onClick={handleValidateCref} disabled={validating || cref.length < 9} className="w-full gap-2">
            {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {validating ? "Validando..." : "Validar CREF"}
          </Button>
        </div>

        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar ao App
        </Button>
      </div>
    </div>
  );
};

export default AdminRouteGuard;
