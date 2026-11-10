import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), getSession: vi.fn(), maybeSingle: vi.fn(), savePlan: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: mocks.getUser, getSession: mocks.getSession },
    from: () => {
      const query = { select: () => query, eq: () => query, order: () => query, limit: () => query, maybeSingle: mocks.maybeSingle };
      return query;
    },
  },
}));
vi.mock("./storage", () => ({
  savePlan: mocks.savePlan, loadProfile: vi.fn(), saveProfile: vi.fn(), loadPlan: vi.fn(),
  loadWeights: vi.fn(), loadWorkoutHistory: vi.fn(), loadBodyComp: vi.fn(), loadChecked: vi.fn(), saveChecked: vi.fn(),
}));
import { pullPlan } from "./cloud-sync";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "student-a" } }, error: null });
  mocks.maybeSingle.mockResolvedValue({ data: { plan_data: { title: "Meu treino" } }, error: null });
});

describe("fast cache ownership checks", () => {
  it("makes only one remote identity check when reading the current plan", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "student-a" } } } });
    expect(await pullPlan()).toEqual({ title: "Meu treino" });
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
    expect(mocks.savePlan).toHaveBeenCalledTimes(1);
  });
  it("does not cache a late plan after the account changes", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "student-b" } } } });
    expect(await pullPlan()).toBeNull();
    expect(mocks.savePlan).not.toHaveBeenCalled();
  });
  it("does not cache a late plan after signing out", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    expect(await pullPlan()).toBeNull();
    expect(mocks.savePlan).not.toHaveBeenCalled();
  });
});