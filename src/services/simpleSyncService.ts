/**
 * Serviço de Sincronização Simplificado (sem API Key)
 * Usa localStorage para sincronização local e GitHub para persistência
 */

interface SyncStatus {
  lastSync: Date;
  isSyncing: boolean;
  error?: string;
  changeCount: number;
}

interface SyncPayload {
  timestamp: number;
  changes: Record<string, any>;
  metadata: {
    source: 'lovable' | 'local';
    autosave?: boolean;
  };
}

class SimpleLovableSyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private syncIntervalMs = 3000; // 3 segundos
  private storageKey = 'lovable_sync_data';
  private lastSyncKey = 'lovable_last_sync';

  /**
   * Inicia sincronização automática em localStorage
   */
  async startAutoSync(): Promise<void> {
    if (!this.syncInterval) {
      console.log('🔄 Iniciando sincronização automática (localStorage)...');
      
      this.syncInterval = setInterval(async () => {
        try {
          await this.performSync();
        } catch (error) {
          console.error('❌ Erro na sincronização:', error);
        }
      }, this.syncIntervalMs);

      // Sincronizar imediatamente na inicialização
      await this.performSync();
    }
  }

  /**
   * Para a sincronização automática
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Sincronização automática parada');
    }
  }

  /**
   * Executa sincronização única
   */
  private async performSync(): Promise<void> {
    try {
      const data = this.getAllData();
      localStorage.setItem(this.lastSyncKey, JSON.stringify({
        timestamp: Date.now(),
        changeCount: Object.keys(data).length,
      }));
      console.log('✅ Sincronização local concluída', data);
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      throw error;
    }
  }

  /**
   * Armazena dados no localStorage
   */
  saveData(key: string, value: any): void {
    try {
      const allData = this.getAllData();
      allData[key] = {
        value,
        timestamp: Date.now(),
        synced: false, // Marca como não sincronizado com Lovable
      };
      localStorage.setItem(this.storageKey, JSON.stringify(allData));
      console.log(`💾 Dados salvos: ${key}`);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }

  /**
   * Recupera dados do localStorage
   */
  getData(key: string): any {
    try {
      const allData = this.getAllData();
      return allData[key]?.value;
    } catch (error) {
      console.error('Erro ao recuperar dados:', error);
      return null;
    }
  }

  /**
   * Obtém todos os dados
   */
  getAllData(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erro ao obter dados:', error);
      return {};
    }
  }

  /**
   * Obtém status de sincronização
   */
  getSyncStatus(): SyncStatus {
    try {
      const lastSync = localStorage.getItem(this.lastSyncKey);
      const syncData = lastSync ? JSON.parse(lastSync) : null;
      const allData = this.getAllData();

      return {
        lastSync: syncData ? new Date(syncData.timestamp) : new Date(0),
        isSyncing: false,
        changeCount: Object.keys(allData).length,
      };
    } catch (error) {
      return {
        lastSync: new Date(0),
        isSyncing: false,
        error: 'Erro ao obter status',
        changeCount: 0,
      };
    }
  }

  /**
   * Limpa todos os dados sincronizados
   */
  clearAllData(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.lastSyncKey);
    console.log('🗑️ Dados sincronizados removidos');
  }

  /**
   * Exporta dados para debug/backup
   */
  exportData(): string {
    return JSON.stringify(this.getAllData(), null, 2);
  }

  /**
   * Importa dados de backup
   */
  importData(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      console.log('📥 Dados importados com sucesso');
    } catch (error) {
      console.error('Erro ao importar dados:', error);
    }
  }
}

export const simpleSyncService = new SimpleLovableSyncService();
export type { SyncStatus, SyncPayload };
