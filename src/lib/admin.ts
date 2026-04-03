export const MASTER_EMAIL = "lucas.mendel@hotmail.com";

export const isMasterAdmin = (email: string | undefined | null): boolean => {
  return email?.toLowerCase() === MASTER_EMAIL.toLowerCase();
};

export const isPersonalTrainer = (userMetadata: Record<string, unknown> | undefined): boolean => {
  return userMetadata?.role === "personal" && !!userMetadata?.cref;
};

export const hasPersonalAccess = (email: string | undefined | null, userMetadata?: Record<string, unknown>): boolean => {
  return isMasterAdmin(email) || isPersonalTrainer(userMetadata);
};
