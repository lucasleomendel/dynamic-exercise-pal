export const MASTER_EMAIL = "lucas.mendel@hotmail.com";

export const isMasterAdmin = (email: string | undefined | null): boolean => {
  return email?.toLowerCase() === MASTER_EMAIL.toLowerCase();
};
