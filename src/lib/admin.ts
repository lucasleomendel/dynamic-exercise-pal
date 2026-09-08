import type { User } from "@supabase/supabase-js";

// Master admin identity is controlled exclusively via Supabase app_metadata.role
// (admin-managed claim that the user cannot self-assign). No emails or other
// identifiers are hardcoded in the source.
export const isMasterAdmin = (user: User | null | undefined): boolean => {
  const appMeta = (user?.app_metadata ?? {}) as Record<string, unknown>;
  return appMeta.role === "master_admin";
};

// Reads admin-controlled app_metadata (cannot be set by the user themselves).
export const isPersonalTrainer = (user: User | null | undefined): boolean => {
  const appMeta = (user?.app_metadata ?? {}) as Record<string, unknown>;
  return appMeta.role === "personal" && !!appMeta.cref;
};

export const hasPersonalAccess = (user: User | null | undefined): boolean => {
  return isMasterAdmin(user) || isPersonalTrainer(user);
};
