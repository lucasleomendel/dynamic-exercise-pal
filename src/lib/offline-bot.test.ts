import { describe, expect, it, vi } from "vitest";
const invoke = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke }, auth: { getSession: vi.fn() } } }));
import { offlineReply } from "./offline-bot";

describe("bot after failed AI connection", () => {
  it("answers the reported question without querying the failed server again", async () => {
    const response = await offlineReply("Como ganhar massa muscular?", undefined, true);
    expect(response).toContain("Ganho de massa muscular");
    expect(invoke).not.toHaveBeenCalled();
  });
});