import { describe, expect, it } from "vitest";
import { routeBotQuery, canUseBotTool, safeRepositoryPath } from "../../supabase/functions/_shared/bot-tools";

describe("credit-free chat tools", () => {
  it("routes workout and history reads without a model", () => {
    expect(routeBotQuery("Mostre meu treino atual")?.tool).toBe("ver_treino_atual");
    expect(routeBotQuery("Consulte meu histórico")?.tool).toBe("historico_aluno");
  });
  it("routes live GitHub commits and explicit file paths", () => {
    expect(routeBotQuery("quais os últimos commits?")).toEqual({ tool: "github_repo", action: "commits" });
    expect(routeBotQuery("leia arquivo src/pages/Index.tsx")).toEqual({ tool: "github_repo", action: "arquivo", path: "src/pages/Index.tsx" });
  });
  it("restricts GitHub and app metrics to administrators", () => {
    expect(canUseBotTool("github_repo", false)).toBe(false);
    expect(canUseBotTool("metricas_app", false)).toBe(false);
    expect(canUseBotTool("github_repo", true)).toBe(true);
    expect(canUseBotTool("ver_treino_atual", false)).toBe(true);
  });
  it("blocks repository secrets and traversal", () => {
    expect(safeRepositoryPath(".env")).toBe(false);
    expect(safeRepositoryPath("src/../../.env.production")).toBe(false);
    expect(safeRepositoryPath(".git/config")).toBe(false);
    expect(safeRepositoryPath("src/pages/Index.tsx")).toBe(true);
  });
});