/**
 * Componente de Debug - Teste de Sincronização com Lovable
 * Mostra status de conectividade e sincronização em tempo real
 */

import { useEffect, useState } from 'react';
import { useSimpleSync } from '@/hooks/useSimpleSync';

interface ConnectivityStatus {
  lovableUrl: string;
  isReachable: boolean;
  statusCode: number | null;
  responseTime: number;
  lastCheck: Date | null;
  error?: string;
}

export function SyncDebugPanel() {
  const { status: syncStatus } = useSimpleSync({ autoStart: true });
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>({
    lovableUrl: 'https://fitforgeprojet.lovable.app',
    isReachable: false,
    statusCode: null,
    responseTime: 0,
    lastCheck: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  // Teste inicial de conectividade
  useEffect(() => {
    checkLovableConnectivity();
    // Verificar a cada 30 segundos
    const interval = setInterval(checkLovableConnectivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkLovableConnectivity = async () => {
    setIsChecking(true);
    const startTime = performance.now();

    try {
      const response = await fetch(connectivity.lovableUrl, {
        method: 'HEAD',
        mode: 'no-cors',
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      setConnectivity({
        ...connectivity,
        isReachable: true,
        statusCode: response.status,
        responseTime: Math.round(responseTime),
        lastCheck: new Date(),
      });

      console.log('✅ Lovable conectado:', {
        url: connectivity.lovableUrl,
        status: response.status,
        tempo: `${responseTime.toFixed(2)}ms`,
      });
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      setConnectivity({
        ...connectivity,
        isReachable: false,
        statusCode: null,
        responseTime: Math.round(responseTime),
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      console.error('❌ Erro ao conectar Lovable:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 p-4 text-xs font-mono max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
        <h3 className="text-sm font-bold text-cyan-400">🔍 Debug Sincronização</h3>
        <button
          onClick={checkLovableConnectivity}
          disabled={isChecking}
          className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs disabled:opacity-50"
        >
          {isChecking ? '⏳' : '🔄'} Testar
        </button>
      </div>

      {/* Conectividade Lovable */}
      <div className="mb-3 pb-3 border-b border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400">Lovable:</span>
          <span className={connectivity.isReachable ? 'text-green-400' : 'text-red-400'}>
            {connectivity.isReachable ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
        <div className="text-slate-500 text-xs mb-1">{connectivity.lovableUrl}</div>
        {connectivity.statusCode && (
          <div className="text-slate-400">Status: {connectivity.statusCode}</div>
        )}
        <div className="text-slate-400">Tempo: {connectivity.responseTime}ms</div>
        {connectivity.lastCheck && (
          <div className="text-slate-500 text-xs">
            Último teste: {connectivity.lastCheck.toLocaleTimeString('pt-BR')}
          </div>
        )}
        {connectivity.error && (
          <div className="text-red-400 text-xs mt-1">Erro: {connectivity.error}</div>
        )}
      </div>

      {/* Sincronização Local */}
      <div className="mb-3 pb-3 border-b border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400">Sincronização:</span>
          <span className="text-blue-400">🔄 Ativa</span>
        </div>
        <div className="text-slate-400">
          Mudanças: <span className="text-yellow-400">{syncStatus?.changeCount ?? 0}</span>
        </div>
        {syncStatus?.lastSync && (
          <div className="text-slate-400 text-xs">
            Última: {syncStatus.lastSync.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </div>

      {/* Dados Armazenados */}
      <div>
        <div className="text-slate-400 mb-1">Dados Armazenados:</div>
        <div className="bg-slate-800 p-2 rounded text-xs text-slate-300 max-h-32 overflow-y-auto">
          <pre>
            {syncStatus?.changeCount === 0
              ? 'Nenhum dado sincronizado ainda'
              : `${syncStatus?.changeCount} mudanças`}
          </pre>
        </div>
      </div>

      {/* Informações Técnicas */}
      <details className="mt-3 pt-3 border-t border-slate-700">
        <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
          ℹ️ Informações Técnicas
        </summary>
        <div className="text-xs text-slate-500 mt-2">
          <div>localStorage: lovable_sync_data</div>
          <div>Intervalo: 3 segundos</div>
          <div>Mode: {import.meta.env.MODE}</div>
          <div>Versão: 1.0.0</div>
        </div>
      </details>
    </div>
  );
}
