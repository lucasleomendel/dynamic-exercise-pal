export type BotQuery = { tool: string; term?: string; action?: "commits" | "listar" | "arquivo"; path?: string };

export function routeBotQuery(text: string): BotQuery | null {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/github|\bgit\b|commits?|repositorio|\barquivo\b/.test(t)) {
    if (/commits?/.test(t)) return { tool: "github_repo", action: "commits" };
    const path = text.match(/(?:arquivo|pasta|diretorio)\s+[`"']?([\w./-]+)/i)?.[1]
      ?? text.match(/(?:ler|leia)\s+[`"']?([\w./-]+)/i)?.[1] ?? "";
    return { tool: "github_repo", action: /pasta|diretorio|listar/.test(t) ? "listar" : "arquivo", path };
  }
  if (/metricas|estatisticas|totais/.test(t)) return { tool: "metricas_app" };
  if (/rotinas|jobs|varredura/.test(t)) return { tool: "status_rotinas" };
  if (/auditoria/.test(t)) return { tool: "auditoria_recente" };
  if (/historico|cargas|progressao/.test(t)) return { tool: "historico_aluno" };
  if (/meu perfil|meus dados/.test(t)) return { tool: "perfil_aluno" };
  if (/meu treino|meu plano|treino atual|plano ativo/.test(t)) return { tool: "ver_treino_atual" };
  return null;
}

export const ADMIN_BOT_TOOLS = new Set(["github_repo", "metricas_app", "status_rotinas", "auditoria_recente"]);
export function canUseBotTool(tool: string, isAdmin: boolean): boolean {
  return !ADMIN_BOT_TOOLS.has(tool) || isAdmin;
}

export function safeRepositoryPath(path: string): boolean {
  return path.length <= 200 && /^[\w./-]*$/.test(path) && !path.split("/").some(part =>
    part === ".." || part === ".git" || /^\.env(?:\.|$)/i.test(part));
}