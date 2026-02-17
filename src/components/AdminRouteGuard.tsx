import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadAdminPassword } from "@/lib/storage";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

const AdminRouteGuard = ({ children }: AdminRouteGuardProps) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const hasPassword = loadAdminPassword();
    const sessionAuth = sessionStorage.getItem("fitforge_admin_auth");

    if (!hasPassword) {
      // No password set, redirect to home
      navigate("/", { replace: true });
      return;
    }

    if (sessionAuth === "true") {
      setAuthorized(true);
    }

    setChecking(false);
  }, [navigate]);

  if (checking) return null;

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Acesso Restrito
          </h1>
          <p className="text-sm text-muted-foreground">
            Esta área é exclusiva para o Personal Trainer. Acesse através das Configurações no app.
          </p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao App
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
