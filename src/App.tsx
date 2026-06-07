import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import Index from "./pages/Index";
import Personal from "./pages/Personal";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CREFValidation from "./pages/CREFValidation";
import Progress from "./pages/Progress";
import ResetPassword from "./pages/ResetPassword";
import Diagnostico from "./pages/Diagnostico";
import AdminRouteGuard from "./components/AdminRouteGuard";
import CompleteProfileDialog from "./components/CompleteProfileDialog";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isGuest } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user && !isGuest) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isGuest } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user || isGuest) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CompleteProfileDialog />
          <Routes>
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/diagnostico" element={<ProtectedRoute><Diagnostico /></ProtectedRoute>} />
            <Route path="/cref-validation" element={<ProtectedRoute><CREFValidation /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/personal" element={<ProtectedRoute><AdminRouteGuard><Personal /></AdminRouteGuard></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
