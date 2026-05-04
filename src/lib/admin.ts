import type { User } from "@supabase/supabase-js";

export const MASTER_EMAIL = "lucas.mendel@hotmail.com";

export const isMasterAdmin = (email: string | undefined | null): boolean => {
  return email?.toLowerCase() === MASTER_EMAIL.toLowerCase();
};

// Reads admin-controlled app_metadata (cannot be set by the user themselves).
export const isPersonalTrainer = (user: User | null | undefined): boolean => {
  const appMeta = (user?.app_metadata ?? {}) as Record<string, unknown>;
  return appMeta.role === "personal" && !!appMeta.cref;
};

export const hasPersonalAccess = (user: User | null | undefined): boolean => {
  return isMasterAdmin(user?.email) || isPersonalTrainer(user);
};
