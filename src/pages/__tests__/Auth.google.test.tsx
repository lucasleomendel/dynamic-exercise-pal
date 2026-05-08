import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Auth from "@/pages/Auth";

// ---- Mocks ----
const signInWithOAuth = vi.fn();
vi.mock("@/integrations/lovable", () => ({
  lovable: { auth: { signInWithOAuth: (...a: unknown[]) => signInWithOAuth(...a) } },
}));

const supabaseSignIn = vi.fn();
const supabaseSignUp = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...a: unknown[]) => supabaseSignIn(...a),
      signUp: (...a: unknown[]) => supabaseSignUp(...a),
    },
  },
}));

const enterGuestMode = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ enterGuestMode }),
}));

const toastFn = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastFn }),
}));

const renderAuth = () =>
  render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe("E2E – Login com Google", () => {
  it("redireciona para o provedor em novo cadastro/login (fluxo OAuth feliz)", async () => {
    signInWithOAuth.mockResolvedValueOnce({ redirected: true });

    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /entrar com google/i }));

    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1));
    expect(signInWithOAuth).toHaveBeenCalledWith("google", {
      redirect_uri: window.location.origin,
    });
    // Sem toast de erro no caminho feliz
    expect(toastFn).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" })
    );
  });

  it("login recorrente: tokens já presentes (sem redirect) não dispara erro", async () => {
    signInWithOAuth.mockResolvedValueOnce({
      redirected: false,
      tokens: { access_token: "x", refresh_token: "y" },
    });

    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /entrar com google/i }));

    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalled());
    expect(toastFn).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" })
    );
  });

  it("trata 429 (muitas requisições) exibindo toast destrutivo", async () => {
    signInWithOAuth.mockResolvedValueOnce({
      error: { message: "429: Muitas requisições. Tente novamente em alguns segundos.", status: 429 },
    });

    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /entrar com google/i }));

    await waitFor(() =>
      expect(toastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          description: expect.stringMatching(/429|muitas requisi/i),
        })
      )
    );
  });

  it("trata 402 (créditos esgotados/pagamento) exibindo toast destrutivo", async () => {
    signInWithOAuth.mockResolvedValueOnce({
      error: { message: "402: Pagamento necessário. Adicione créditos.", status: 402 },
    });

    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /entrar com google/i }));

    await waitFor(() =>
      expect(toastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          description: expect.stringMatching(/402|pagamento|cr[ée]dito/i),
        })
      )
    );
  });

  it("trata erro genérico do provedor (provider não habilitado)", async () => {
    signInWithOAuth.mockResolvedValueOnce({
      error: { message: "Unsupported provider: provider is not enabled" },
    });

    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /entrar com google/i }));

    await waitFor(() =>
      expect(toastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/erro.*google/i),
          variant: "destructive",
        })
      )
    );
  });

  it("trata exceção inesperada (rede caiu)", async () => {
    signInWithOAuth.mockRejectedValueOnce(new Error("Network down"));

    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /entrar com google/i }));

    await waitFor(() =>
      expect(toastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          description: expect.stringMatching(/network down/i),
        })
      )
    );
  });

  it("desabilita o botão durante a requisição (evita duplo clique)", async () => {
    let resolveFn: (v: unknown) => void = () => {};
    signInWithOAuth.mockImplementationOnce(
      () => new Promise((res) => { resolveFn = res; })
    );

    renderAuth();
    const btn = screen.getByRole("button", { name: /entrar com google/i });
    await userEvent.click(btn);

    await waitFor(() => expect(btn).toBeDisabled());

    resolveFn({ redirected: true });
    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1));
  });
});
