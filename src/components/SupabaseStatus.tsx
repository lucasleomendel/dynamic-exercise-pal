/**
 * Componente para exibir o status da conexão Supabase
 * Use para debugar problemas de conexão
 */

import { useEffect, useState } from 'react';
import { testSupabaseConnection } from '@/integrations/supabase/test-connection';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export function SupabaseStatus() {
  const [status, setStatus] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const result = await testSupabaseConnection();
        setStatus(result);
      } catch (error: any) {
        setStatus({
          success: false,
          message: 'Erro ao testar conexão',
          error: error.message
        });
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-blue-800">🔄 Testando conexão com Supabase...</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
        <p className="text-gray-800">Status indisponível</p>
      </div>
    );
  }

  if (status.success) {
    return (
      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">✅ Supabase Conectado</h3>
        <p className="text-green-700 text-sm mb-2">{status.message}</p>
        {status.data && (
          <pre className="text-xs bg-green-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(status.data, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
      <h3 className="font-semibold text-red-800 mb-2">❌ Erro na Conexão</h3>
      <p className="text-red-700 text-sm mb-1">{status.message}</p>
      {status.error && (
        <p className="text-red-600 text-xs font-mono bg-red-100 p-2 rounded mt-2">
          {status.error}
        </p>
      )}
    </div>
  );
}