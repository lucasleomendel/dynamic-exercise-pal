# 🔗 Guia de Sincronização com Lovable

## 📋 Visão Geral

Este repositório está configurado para **sincronização bidirecional contínua** com seu projeto no Lovable. Qualquer mudança em qualquer um dos lados será refletida automaticamente no outro.

## 🚀 Setup Inicial

### 1. Configurar Secrets no GitHub

Acesse: `Settings > Secrets and variables > Actions`

Adicione os seguintes secrets:

```
LOVABLE_PROJECT_ID=seu_project_id_aqui
LOVABLE_API_KEY=sua_api_key_aqui
```

**Como obter essas credenciais:**
- `LOVABLE_PROJECT_ID`: Copie da URL do seu projeto: `https://lovable.dev/projects/[AQUI]`
- `LOVABLE_API_KEY`: Gere em `Lovable > Settings > API Keys`

### 2. Configurar Variáveis de Ambiente Localmente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha os valores:

```env
VITE_LOVABLE_PROJECT_ID=seu_project_id
VITE_LOVABLE_API_KEY=sua_api_key
VITE_SUPABASE_URL=sua_supabase_url
VITE_SUPABASE_ANON_KEY=sua_supabase_key
VITE_SYNC_INTERVAL=5000  # 5 segundos
VITE_AUTO_SYNC_ENABLED=true
```

### 3. Instalar Dependências

```bash
npm install
```

## 🔄 Como Funciona a Sincronização

### Fluxo Automático

```
GitHub (seu código)
        ↓
GitHub Actions (testa & valida)
        ↓
Lovable API (sincroniza)
        ↓
Lovable Project (atualizado)
        ↓
Lovable Interface (reflete mudanças)
        ↓
De volta ao GitHub (ciclo contínuo)
```

### Sincronização em Tempo Real (Frontend)

1. **Inicialização**: Ao abrir a app, a sincronização automática inicia
2. **Intervalo**: A cada 5 segundos, verifica mudanças (configurável)
3. **Push**: Mudanças locais são enviadas para Lovable
4. **Pull**: Mudanças do Lovable são trazidas para o repositório

## 💻 Usando no Seu Código

### Exemplo 1: Componente com Sincronização Automática

```typescript
import { useLovableSync } from '@/hooks/useLovableSync';

export function MyComponent() {
  const { status, isLoading, pushChanges } = useLovableSync({
    autoStart: true,
    onSyncSuccess: (status) => {
      console.log('✅ Sincronizado:', status);
    },
    onSyncError: (error) => {
      console.error('❌ Erro:', error);
    },
  });

  const handleUpdate = async () => {
    await pushChanges({
      field: 'value',
      timestamp: Date.now(),
    });
  };

  return (
    <div>
      <p>Última sincronização: {status?.lastSync}</p>
      <p>Mudanças: {status?.changeCount}</p>
      <button onClick={handleUpdate} disabled={isLoading}>
        {isLoading ? 'Sincronizando...' : 'Atualizar'}
      </button>
    </div>
  );
}
```

### Exemplo 2: Usar Serviço Diretamente

```typescript
import { lovableSyncService } from '@/services/lovableSyncService';

// Obter status
const status = await lovableSyncService.getSyncStatus();
console.log('Status:', status);

// Enviar mudanças
await lovableSyncService.pushChanges({
  userUpdate: { name: 'João', age: 30 },
});
```

## 📊 Monitorar Sincronização

### Dashboard de Status (Recomendado)

Crie um componente de debug:

```typescript
import { useLovableSync } from '@/hooks/useLovableSync';

export function SyncStatus() {
  const { status, isLoading } = useLovableSync({ autoStart: true });

  if (!status) return <div>Carregando...</div>;

  return (
    <div className="p-4 border rounded">
      <h3>Status de Sincronização</h3>
      <p>Última atualização: {new Date(status.lastSync).toLocaleString('pt-BR')}</p>
      <p>Sincronizando: {status.isSyncing ? '🔄' : '✅'}</p>
      <p>Mudanças pendentes: {status.changeCount}</p>
      {status.error && <p className="text-red-500">Erro: {status.error}</p>}
    </div>
  );
}
```

### Logs no Console

Os logs mostram o progresso:

```
🔄 Iniciando sincronização automática...
✅ Sincronização concluída {lastSync: ..., changeCount: 5}
🛑 Sincronização automática parada
```

## ⚙️ Configurações Avançadas

### Alterar Intervalo de Sincronização

No `.env.local`:

```env
# Sincronizar a cada 10 segundos
VITE_SYNC_INTERVAL=10000

# Sincronizar a cada 1 segundo (não recomendado)
VITE_SYNC_INTERVAL=1000
```

### Desabilitar Sincronização Automática

```env
VITE_AUTO_SYNC_ENABLED=false
```

Depois use manualmente:

```typescript
import { lovableSyncService } from '@/services/lovableSyncService';

// Sincronizar sob demanda
await lovableSyncService.getSyncStatus();
```

### Webhook para GitHub Actions

Ao fazer push no GitHub:

1. GitHub Actions valida o código
2. Se sucesso, notifica Lovable
3. Lovable atualiza automaticamente

## 🔒 Segurança

- ✅ API Key nunca exposta no cliente (usar proxy)
- ✅ Secrets protegidos no GitHub
- ✅ HTTPS obrigatório para sincronização
- ✅ Validação de integridade em mudanças

## 🐛 Solução de Problemas

### Sincronização não inicia

```bash
# Verifique se as variáveis estão definidas
echo $VITE_LOVABLE_PROJECT_ID
echo $VITE_LOVABLE_API_KEY

# Verifique os logs do navegador (F12)
```

### Erro "401 Unauthorized"

- Verifique se `LOVABLE_API_KEY` está correto
- Regene a chave em Lovable > Settings

### Mudanças não aparecem no Lovable

1. Verifique o console (F12) para erros
2. Confirme que `VITE_AUTO_SYNC_ENABLED=true`
3. Verifique conectividade de rede
4. Manualmente sincronize usando `pushChanges()`

## 📚 Estrutura de Arquivos

```
.
├── src/
│   ├── services/
│   │   └── lovableSyncService.ts    # Lógica de sincronização
│   ├── hooks/
│   │   └── useLovableSync.ts        # Hook React
│   └── components/
│       └── SyncStatus.tsx            # Componente de status (exemplo)
├── .github/
│   └── workflows/
│       └── sync-lovable.yml          # GitHub Actions
├── .env.example                      # Template de variáveis
└── LOVABLE_SYNC_SETUP.md            # Este arquivo
```

## 🎯 Próximos Passos

1. ✅ Configure os secrets no GitHub
2. ✅ Preencha o `.env.local`
3. ✅ Rode `npm install && npm run dev`
4. ✅ Verifique os logs de sincronização
5. ✅ Teste uma mudança em ambos os lados
6. ✅ Configure o webhook (opcional)

## 📞 Suporte

Para problemas:
- Verifique os logs do navegador (F12)
- Verifique GitHub Actions: `Actions > Sync with Lovable`
- Consulte a documentação do Lovable API

---

**Status**: ✅ Pronto para sincronização
**Última atualização**: 2026-06-01
