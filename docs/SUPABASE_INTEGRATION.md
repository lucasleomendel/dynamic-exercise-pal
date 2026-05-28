# Supabase Integration Guide

Esta documentação descreve a integração completa do Supabase no projeto `dynamic-exercise-pal`.

## 📦 Estrutura de Arquivos

```
src/
├── integrations/supabase/
│   ├── client.ts              # Cliente Supabase para o browser
│   ├── server.ts              # Cliente Supabase para server-side
│   ├── session-manager.ts     # Gerenciamento automático de sessão
│   ├── types.ts               # Tipos do banco de dados
│   └── index.ts               # Barrel export
├── hooks/
│   ├── useSupabaseAuth.ts    # Hook para autenticação
│   └── useSupabaseQuery.ts   # Hook para queries com realtime
├── contexts/
│   └── SupabaseContext.tsx   # Provider para inicialização global
└── ...
```

## 🚀 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` com:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Para operações server-side (opcional):
```bash
VITE_SUPABASE_SERVICE_KEY=your-service-role-key
```

### 2. Inicializar Provider

No seu `main.tsx`:

```tsx
import { SupabaseProvider } from '@/contexts/SupabaseContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  </React.StrictMode>,
);
```

## 📖 Uso

### Autenticação

```tsx
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

function LoginComponent() {
  const { user, loading, signIn, logout } = useSupabaseAuth();

  const handleLogin = async () => {
    await signIn('email@example.com', 'password');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <>
          <p>Bem-vindo, {user.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Queries com Realtime

```tsx
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';

function ExercisesList() {
  const { data: exercises, loading, error } = useSupabaseQuery(
    'exercises',
    {
      select: 'id,name,description',
      orderBy: 'name:asc',
      limit: 50,
      realtime: true, // Atualizar em tempo real
    }
  );

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <ul>
      {exercises.map((ex) => (
        <li key={ex.id}>{ex.name}</li>
      ))}
    </ul>
  );
}
```

### Operações Diretas

```tsx
import { supabase } from '@/integrations/supabase/client';

// Criar
const { data, error } = await supabase
  .from('exercises')
  .insert({ name: 'Supino' });

// Ler
const { data } = await supabase
  .from('exercises')
  .select()
  .eq('id', 'xxx');

// Atualizar
const { data } = await supabase
  .from('exercises')
  .update({ name: 'Supino Inclinado' })
  .eq('id', 'xxx');

// Deletar
const { data } = await supabase
  .from('exercises')
  .delete()
  .eq('id', 'xxx');
```

## 🔐 Segurança

### Row-Level Security (RLS)

Certifique-se de que as políticas RLS estão habilitadas:

```sql
-- Exemplo: Usuários só conseguem ler seus próprios dados
CREATE POLICY "Users can view their own data"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Variáveis de Ambiente Sensíveis

- **VITE_SUPABASE_PUBLISHABLE_KEY**: Segura expor no browser (anon key)
- **VITE_SUPABASE_SERVICE_KEY**: ⚠️ Nunca exponha no browser (use apenas em server-side)

## 🔄 Sincronização Automática de Sessão

O `session-manager` mantém os tokens atualizados automaticamente:

```tsx
import { startSessionManager, stopSessionManager } from '@/integrations/supabase/session-manager';

// Iniciar (já acontece no SupabaseProvider)
startSessionManager();

// Parar
stopSessionManager();
```

## 🆘 Troubleshooting

### Erro: "Faltam variáveis de ambiente do Supabase"

Verifique se `.env.local` tem as variáveis corretas:
```bash
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

### Sessão expirando frequentemente

Ajuste o intervalo de refresh em `src/integrations/supabase/session-manager.ts`:
```typescript
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // Mude para o desejado
```

### Realtime não funcionando

1. Verifique se Realtime está habilitado no dashboard Supabase
2. Confirme que `realtime: true` está na opção da query
3. Verifique a tabela tem `realtime` habilitado

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
