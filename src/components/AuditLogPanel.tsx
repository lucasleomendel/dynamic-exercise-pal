import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, ScrollText, User, Dumbbell, ShieldCheck } from "lucide-react";
import { fetchAuditLog, type AuditEntry } from "@/lib/audit";
import { useToast } from "@/hooks/use-toast";

const ENTITY_META: Record<string, { label: string; Icon: typeof User }> = {
  aluno: { label: "Aluno", Icon: User },
  treino: { label: "Treino", Icon: Dumbbell },
  permissao: { label: "Permissão", Icon: ShieldCheck },
};

const ACTION_LABEL: Record<string, string> = {
  criar: "Criou",
  atualizar: "Atualizou",
  excluir: "Excluiu",
  vincular: "Vinculou",
  desvincular: "Desvinculou",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const AuditLogPanel = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await fetchAuditLog(150));
    } catch (e) {
      toast({
        title: "Erro ao carregar auditoria",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const q = filter.trim().toLowerCase();
  const visible = q
    ? entries.filter(e =>
        [e.actor_email, e.entity, e.action, e.entity_label]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q))
      )
    : entries;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}
          >
            <ScrollText className="w-4 h-4" /> Log de Auditoria
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filtrar por autor, ação, aluno..."
        />

        {loading && entries.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando registros...</p>
        )}

        {!loading && visible.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma alteração registrada ainda.
          </p>
        )}

        <div className="space-y-2">
          {visible.map(entry => {
            const meta = ENTITY_META[entry.entity] ?? { label: entry.entity, Icon: ScrollText };
            const Icon = meta.Icon;
            const details = entry.details && Object.keys(entry.details).length > 0 ? entry.details : null;
            return (
              <div key={entry.id} className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {ACTION_LABEL[entry.action] ?? entry.action} · {meta.label}
                      {entry.entity_label ? ` — ${entry.entity_label}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.actor_email ?? entry.actor_id}
                      {entry.actor_role === "master_admin" && " (admin geral)"}
                    </p>
                    {details && (
                      <pre className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap break-words">
                        {JSON.stringify(details, null, 1)}
                      </pre>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLogPanel;
