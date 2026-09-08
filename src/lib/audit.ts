import { supabase } from "@/integrations/supabase/client";
import { isMasterAdmin } from "@/lib/admin";

export type AuditEntity = "aluno" | "treino" | "permissao";
export type AuditAction =
  | "criar"
  | "atualizar"
  | "excluir"
  | "vincular"
  | "desvincular";

export interface AuditEntry {
  id: string;
  actor_id: string;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  entity_label: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface LogInput {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  entityLabel?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Registra uma ação administrativa no log de auditoria.
 * Nunca lança erro — auditoria não deve quebrar o fluxo do usuário.
 */
export async function logAudit(input: LogInput): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      actor_role: isMasterAdmin(user)
        ? "master_admin"
        : ((user.app_metadata as Record<string, unknown>)?.role as string) ?? "personal",
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      entity_label: input.entityLabel ?? null,
      details: input.details ?? {},
    });
  } catch {
    // silencioso por design
  }
}

export async function fetchAuditLog(limit = 100): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as AuditEntry[];
}

/** Diferença legível entre dois objetos (para detalhes de atualização). */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { de: unknown; para: unknown }> {
  const out: Record<string, { de: unknown; para: unknown }> = {};
  for (const key of Object.keys(after)) {
    const a = before?.[key] ?? null;
    const b = after[key] ?? null;
    if (JSON.stringify(a) !== JSON.stringify(b)) out[key] = { de: a, para: b };
  }
  return out;
}
