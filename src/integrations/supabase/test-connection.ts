/**
 * Arquivo de teste para validar a conexão com Supabase
 * Não use em produção
 */

import { supabase } from './client';

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}> {
  try {
    console.log('🔍 Testando conexão com Supabase...');

    // Teste 1: Verificar se o cliente foi criado
    if (!supabase) {
      return {
        success: false,
        message: 'Erro: Cliente Supabase não foi inicializado',
        error: 'Cliente não criado'
      };
    }

    console.log('✅ Cliente Supabase inicializado com sucesso');

    // Teste 2: Testar a chamada na tabela 'profiles'
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao consultar tabela profiles:', error);
      return {
        success: false,
        message: 'Erro ao conectar com a base de dados',
        error: error.message
      };
    }

    console.log('✅ Conexão com banco de dados funcionando!');

    // Teste 3: Obter informações da sessão
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError && authError.status !== 400) {
      console.warn('⚠️ Aviso de autenticação:', authError.message);
    }

    const message = user
      ? `✅ Autenticado como: ${user.email}`
      : '⚠️ Não autenticado (ainda)';

    console.log(message);

    return {
      success: true,
      message: `Conexão Supabase OK! ${message}`,
      data: {
        projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID,
        url: import.meta.env.VITE_SUPABASE_URL,
        authenticated: !!user,
        userEmail: user?.email || 'N/A'
      }
    };

  } catch (error: any) {
    console.error('❌ Erro durante teste de conexão:', error);
    return {
      success: false,
      message: 'Erro inesperado durante teste de conexão',
      error: error?.message || String(error)
    };
  }
}

// Executar teste automaticamente em desenvolvimento
if (import.meta.env.DEV) {
  testSupabaseConnection().then(result => {
    console.log('\n📋 RESULTADO DO TESTE:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n');
  });
}