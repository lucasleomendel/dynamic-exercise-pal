import type { CapacitorConfig } from '@capacitor/cli';

// O app Android abre o site publicado: cada "Publicar" atualiza o app automaticamente,
// sem precisar gerar/instalar um novo APK.
const config: CapacitorConfig = {
  appId: 'app.lovable.c011db9c0e234167ad65afcd8245f3cc',
  appName: 'FitForge',
  webDir: 'dist',
  server: {
    url: 'https://dynamic-exercise-pal.lovable.app',
    cleartext: false,
  },
  android: { backgroundColor: '#0f1419' },
};

export default config;
