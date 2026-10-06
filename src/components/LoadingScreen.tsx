// Mesmo visual da tela de abertura do index.html, para a transição não "piscar".
const LoadingScreen = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background">
    <img src="/logo-splash.png" alt="FitForge" className="h-32 w-32 rounded-[28px] shadow-lg animate-pulse" />
    <h1 className="text-4xl font-extrabold tracking-[0.3em] text-primary">FITFORGE</h1>
    <p className="text-xs uppercase tracking-widest text-muted-foreground">Treino personalizado</p>
  </div>
);

export default LoadingScreen;
