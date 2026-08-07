import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hydrateFromCloud, maybeDailySync } from "@/lib/cloud-sync";

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

  const runHydration = () => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    hydrateFromCloud().catch(() => {});
    maybeDailySync().catch(() => {});
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
        if (session?.user) {
          try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
          setIsGuest(false);
        }
        if (event === "SIGNED_IN" && session?.user) {
          setTimeout(runHydration, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        setTimeout(runHydration, 0);
      }
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        maybeDailySync().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const signOut = useCallback(async () => {
    try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
    setIsGuest(false);
    hydratedRef.current = false;
    await supabase.auth.signOut();
  }, []);

  const enterGuestMode = useCallback(() => {
    try { localStorage.setItem(GUEST_KEY, "1"); } catch { /* ignore */ }
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(() => {
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
