import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
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

describe("Email/password accounts", () => {
  it("navigates inside the app after successful email login", async () => {
    supabaseSignIn.mockResolvedValueOnce({ error: null });
    render(<MemoryRouter initialEntries={["/auth"]}><Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<div data-testid="signed-in" />} />
    </Routes></MemoryRouter>);
    await userEvent.type(screen.getByLabelText("E-mail"), "student@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "student-password");
    await userEvent.click(screen.getAllByRole("button", { name: /^entrar$/i }).find(button => button.getAttribute("type") === "submit") ?? (() => { throw new Error("Submit missing"); })());
    await waitFor(() => expect(screen.getByTestId("signed-in")).toBeInTheDocument());
    expect(supabaseSignIn).toHaveBeenCalledWith({ email: "student@example.com", password: "student-password" });
  });
  it("does not sign in a student until email confirmation", async () => {
    supabaseSignUp.mockResolvedValueOnce({ data: { session: null }, error: null });
    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /^aluno$/i }));
    await userEvent.type(screen.getByPlaceholderText("Nome completo"), "Aluno Teste");
    await userEvent.type(screen.getByLabelText("E-mail"), "student@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "student-password");
    await userEvent.type(screen.getByPlaceholderText("CPF (000.000.000-00)"), "52998224725");
    const date = document.querySelector('input[type="date"]');
    if (!(date instanceof HTMLInputElement)) throw new Error("Date input missing");
    await userEvent.type(date, "2000-01-01");
    await userEvent.type(screen.getByPlaceholderText("(11) 99999-9999"), "11999999999");
    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));
    await waitFor(() => expect(supabaseSignUp).toHaveBeenCalledTimes(1));
    expect(supabaseSignIn).not.toHaveBeenCalled();
    expect(supabaseSignUp.mock.calls[0][0].options.data.name).toBe("Aluno Teste");
    expect(supabaseSignUp.mock.calls[0][0].options.data.cpf).toBe("52998224725");
  });
});
