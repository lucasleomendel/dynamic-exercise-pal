/**
 * Hook simplificado para sincronização com localStorage
 * Sem necessidade de API Key
 */

import { useEffect, useCallback, useState } from 'react';
import { simpleSyncService, type SyncStatus } from '@/services/simpleSyncService';

export interface UseSimpleSyncOptions {
  autoStart?: boolean;
  onSyncSuccess?: (status: SyncStatus) => void;
  onSyncError?: (error: Error) => void;
}

export function useSimpleSync(options: UseSimpleSyncOptions = {}) {
  const { autoStart = true, onSyncSuccess, onSyncError } = options;
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (autoStart) {
      simpleSyncService.startAutoSync().catch((error) => {
        console.error('Failed to start auto sync:', error);
        onSyncError?.(error);
      });

      // Atualizar status a cada 3 segundos
      const interval = setInterval(() => {
        const newStatus = simpleSyncService.getSyncStatus();
        setStatus(newStatus);
        onSyncSuccess?.(newStatus);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [autoStart, onSyncSuccess, onSyncError]);

  const saveData = useCallback(
    (key: string, value: any) => {
      try {
        simpleSyncService.saveData(key, value);
        setStatus(simpleSyncService.getSyncStatus());
        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onSyncError?.(err);
        return false;
      }
    },
    [onSyncError]
  );

  const getData = useCallback(
    (key: string) => {
      try {
        return simpleSyncService.getData(key);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onSyncError?.(err);
        return null;
      }
    },
    [onSyncError]
  );

  const checkStatus = useCallback(() => {
    const newStatus = simpleSyncService.getSyncStatus();
    setStatus(newStatus);
    return newStatus;
  }, []);

  return {
    status,
    isLoading,
    saveData,
    getData,
    checkStatus,
  };
}
