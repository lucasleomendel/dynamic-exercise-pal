import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, ShieldCheck } from "lucide-react";

const CREFValidation = () => {
  const [cref, setCref] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "valid" | "invalid">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const formatCref = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    return digits;
  };

  const validateCREF = async () => {
    if (!cref.trim() || !user) return;
    setStatus("pending");
    setErrorMsg("");

    try {
      const { data, error } = await supabase.functions.invoke("validate-cref", {
        body: { cref: cref.toUpperCase(), userId: user.id },
      });

      if (error) {
        setStatus("invalid");
        setErrorMsg("Erro ao validar CREF. Tente novamente.");
        return;
      }

      if (data?.valid) {
        setStatus("valid");
        setTimeout(() => navigate("/personal"), 1500);
      } else {
        setStatus("invalid");
        setErrorMsg(data?.error || "CREF inválido.");
      }
    } catch {
      setStatus("invalid");
      setErrorMsg("Erro de conexão.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Validação CREF</CardTitle>
          <CardDescription>
            Insira seu registro profissional para acessar o painel de Personal Trainer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Número CREF</label>
            <div className="flex gap-2">
              <Input
                placeholder="000000-G/UF"
                value={cref}
                onChange={(e) => setCref(e.target.value.toUpperCase())}
                maxLength={11}
                disabled={status === "pending"}
              />
            </div>
            <p className="text-xs text-muted-foreground">Formato: 000000-G/UF (ex: 012345-G/SP)</p>
          </div>

          <Button
            onClick={validateCREF}
            disabled={!cref.trim() || status === "pending"}
            className="w-full"
          >
            {status === "pending" ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Validando...</>
            ) : (
              "Validar CREF"
            )}
          </Button>

          {status === "valid" && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">CREF válido! Redirecionando...</span>
            </div>
          )}

          {status === "invalid" && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">{errorMsg}</span>
            </div>
          )}

          <a
            href="https://www.cref.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-primary hover:underline mt-2"
          >
            Consultar CREF no site oficial
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default CREFValidation;
