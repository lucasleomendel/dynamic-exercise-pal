import { Loader2 } from "lucide-react";

// Tela de carregamento leve (sem biblioteca de animação, entra no pacote inicial).
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-background animate-in fade-in duration-300">
    <div className="flex flex-col items-center">
      <Loader2 className="h-12 w-12 text-primary animate-spin" />
      <h1 className="mt-4 text-3xl font-bold text-primary tracking-wide">FitForge</h1>
    </div>
  </div>
);

export default LoadingScreen;
