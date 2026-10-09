import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hydrateFromCloud, maybeDailySync } from "@/lib/cloud-sync";
import { clearAll } from "@/lib/storage";

const GUEST_KEY = "fitforge_guest_mode";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isGuest: false,
  signOut: async () => {},
  enterGuestMode: () => {},
  exitGuestMode: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try { return localStorage.getItem(GUEST_KEY) === "1"; } catch { return false; }
  });

  const hydratedRef = useRef(false);
  const activeUserIdRef = useRef<string | null>(null);
  const authEventSeenRef = useRef(false);

  const runHydration = () => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    Promise.all([hydrateFromCloud(), maybeDailySync()]).catch((error) => {
      // Allow a later visibility/auth event to retry after a transient outage.
      hydratedRef.current = false;
      console.warn("[FitForge] Falha ao hidratar dados da conta.", error);
    });
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authEventSeenRef.current = true;
        const nextUserId = session?.user?.id ?? null;
        const previousUserId = activeUserIdRef.current;

        // Any transition away from an authenticated identity invalidates the
        // shared browser cache. This also covers expired sessions and sign-out
        // events that did not originate from this component's signOut handler.
        if (previousUserId && previousUserId !== nextUserId) {
          clearAll();
          hydratedRef.current = false;
        }

        if (nextUserId) {
          let cacheOwner: string | null = null;
          let wasGuest = false;
          try {
            cacheOwner = localStorage.getItem("fitforge_cache_owner_user_id");
            wasGuest = localStorage.getItem(GUEST_KEY) === "1";
          } catch {
            // Fail closed if local storage cannot establish cache ownership.
            clearAll();
          }

          // Older versions did not tag local data with its account. If ownership
          // is unknown, discard that ambiguous cache rather than expose one
          // account's profile, plan, or history to another account.
          if (wasGuest || cacheOwner !== nextUserId) clearAll();
          try {
            localStorage.setItem("fitforge_cache_owner_user_id", nextUserId);
            localStorage.removeItem(GUEST_KEY);
          } catch (error) {
            console.warn("[FitForge] Não foi possível registrar o proprietário do cache local.", error);
          }
          setIsGuest(false);
        } else {
          // A persisted authenticated cache must not remain visible in a logged-out session.
          try {
            if (localStorage.getItem("fitforge_cache_owner_user_id")) clearAll();
          } catch {
            clearAll();
          }
        }

        activeUserIdRef.current = nextUserId;
        setSession(session);
        setLoading(false);
        if (event === "SIGNED_IN" && session?.user) {
          setTimeout(runHydration, 0);
        }
      }
    );

    // The initial session lookup can resolve after onAuthStateChange. If an
    // auth event already arrived, its session is newer and must win.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (authEventSeenRef.current) return;
      const userId = session?.user?.id ?? null;
      if (userId) {
        let owner: string | null = null;
        let wasGuest = false;
        try {
          owner = localStorage.getItem("fitforge_cache_owner_user_id");
          wasGuest = localStorage.getItem(GUEST_KEY) === "1";
        } catch {
          clearAll();
        }
        if (wasGuest || owner !== userId) clearAll();
        try {
          localStorage.setItem("fitforge_cache_owner_user_id", userId);
          localStorage.removeItem(GUEST_KEY);
        } catch (error) {
          console.warn("[FitForge] Não foi possível registrar o proprietário do cache local.", error);
        }
        setIsGuest(false);
      } else {
        try {
          if (localStorage.getItem("fitforge_cache_owner_user_id")) clearAll();
        } catch {
          clearAll();
        }
      }
      activeUserIdRef.current = userId;
      setSession(session);
      setLoading(false);
      if (session?.user) {
        setTimeout(runHydration, 0);
      }
    }).catch((error) => {
      console.warn("[FitForge] Não foi possível recuperar a sessão inicial.", error);
      if (!authEventSeenRef.current) setLoading(false);
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        maybeDailySync().catch((error) => {
          console.warn("[FitForge] Falha ao retomar sincronização diária.", error);
          window.dispatchEvent(new CustomEvent("fitforge:sync-error", {
            detail: { operation: "visibility-daily-sync", error },
          }));
        });
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const signOut = useCallback(async () => {
    // Prevent the next account/session from inheriting this user's cached data.
    clearAll();
    try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
    setIsGuest(false);
    hydratedRef.current = false;
    await supabase.auth.signOut({ scope: "local" });
  }, []);

  const enterGuestMode = useCallback(() => {
    // Guest mode must start from a clean app cache so no previous account data
    // can be displayed or later queued for synchronization.
    clearAll();
    try { localStorage.setItem(GUEST_KEY, "1"); } catch { /* ignore */ }
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    // Leaving guest mode discards guest-only data instead of carrying it into
    // the next authenticated account.
    clearAll();
    try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
    setIsGuest(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      isGuest,
      signOut,
      enterGuestMode,
      exitGuestMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
