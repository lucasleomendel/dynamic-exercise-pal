# FitForge

Aplicação de planejamento de treinos personalizados, acompanhamento de progresso e hidratação, construída com React, TypeScript, Vite e Supabase.

- **Aplicação publicada:** https://dynamic-exercise-pal.lovable.app
- **Projeto Lovable:** https://lovable.dev/projects/c2ba9560-bd20-48d7-a5b0-f2651063d841
- **Repositório:** https://github.com/lucasleomendel/dynamic-exercise-pal

## Desenvolvimento local

Requisitos: Node.js 22 e npm.

```sh
git clone https://github.com/lucasleomendel/dynamic-exercise-pal.git
cd dynamic-exercise-pal
npm ci
npm run dev
```

## Variáveis de ambiente

Crie um arquivo `.env` local com as configurações do seu projeto Supabase. Use `.env.example` como referência e mantenha valores específicos da sua instalação fora do controle de versão.

Variáveis esperadas pelo cliente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Nunca coloque chaves `service_role`, tokens privados ou segredos no frontend, em arquivos versionados ou em logs.

## Verificações

```sh
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

O workflow **FitForge CI** executa testes, lint, build de produção e auditoria de dependências de produção em cada pull request para `main`. Atualizações de dependências devem ser feitas explicitamente em commits revisáveis; o CI não deve escrever no repositório.

## Sincronização com a nuvem

A sincronização atual é implementada em `src/lib/cloud-sync.ts`. O documento histórico `LOVABLE_SYNC_SETUP.md` está obsoleto e não descreve o fluxo atual.

## Segurança e publicação

- Mudanças são revisadas em pull requests antes de chegar à branch `main`.
- Não faça merge enquanto o CI/preview não estiver verde e as alterações não forem revisadas.
- A proteção contra senhas vazadas deve ser habilitada nas configurações do Supabase Auth.
- Se uma chave privilegiada tiver sido exposta no histórico do repositório, revogue-a/rotacione-a no painel do Supabase e verifique os logs de uso. Remover a chave de um commit posterior não invalida a chave exposta.
