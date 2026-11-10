import { beforeEach, describe, expect, it, vi } from "vitest";
const invoke = vi.hoisted(() => vi.fn());
const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke }, auth: { getSession } } }));
import { offlineReply, queryBotReply, profileEstimateReply } from "./offline-bot";
import type { UserProfile } from "./workout-generator";

beforeEach(() => vi.clearAllMocks());

describe("fast chat routing", () => {
  it("calculates estimates locally but leaves dietary analysis to the assistant", () => {
    const profile: UserProfile = { name: "Teste", weight: 80, height: 170, age: 26, sex: "masculino", goal: "forca", level: "avancado", daysPerWeek: 6, hoursPerSession: 1 };
    const answer = profileEstimateReply("Como calcular meus macros?", profile);
    expect(answer).toContain("160 g");
    expect(answer).toContain("2800 ml");
    expect(profileEstimateReply("Avalie minha dieta detalhadamente", profile)).toBe("");
    expect(profileEstimateReply("Como calcular meus macros?")).toBe("");
    expect(invoke).not.toHaveBeenCalled();
  });
  it("skips auth and server requests for ordinary coaching questions", async () => {
    expect(await queryBotReply("Como calcular meus macros?")).toBe("");
    expect(getSession).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });
  it("still reads real workout data without AI inference", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "test" } } });
    invoke.mockResolvedValue({ data: { handled: true, content: "Plano ativo" }, error: null });
    expect(await queryBotReply("Mostre meu treino atual")).toBe("Plano ativo");
    expect(invoke).toHaveBeenCalledWith("bot-query", { body: { text: "Mostre meu treino atual" }, signal: undefined });
  });
  it("does not start a request after cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    expect(await queryBotReply("últimos commits", controller.signal)).toBe("");
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("bot after failed AI connection", () => {
  it("answers the reported question without querying the failed server again", async () => {
    const response = await offlineReply("Como ganhar massa muscular?", undefined, true);
    expect(response).toContain("Ganho de massa muscular");
    expect(invoke).not.toHaveBeenCalled();
  });
});