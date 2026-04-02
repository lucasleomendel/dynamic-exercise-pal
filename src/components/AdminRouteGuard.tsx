import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isMasterAdmin } from "@/lib/admin";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

const AdminRouteGuard = ({ children }: AdminRouteGuardProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || !isMasterAdmin(user.email)) {
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
            Esta área é exclusiva para o administrador master.
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
