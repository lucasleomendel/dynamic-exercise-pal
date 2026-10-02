import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarClock } from "lucide-react";

interface Run { ran_at: string; status: string; notes: string | null; exercises_added: number | null; exercises_updated: number | null }

const parseGroups = (notes: string | null) => {
  const m = notes?.match(/Grupos:\s*([^|]+)/);
  return m ? m[1].split(",").map((g) => g.trim()).filter(Boolean) : [];
};

export default function LibraryScanStats() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("library_updates")
      .select("ran_at,status,notes,exercises_added,exercises_updated")
      .order("ran_at", { ascending: false }).limit(200)
      .then(({ data, error }) => {
        if (error) setError(error.message); else setRuns((data ?? []) as Run[]);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; ok: number; added: number; last: string }>();
    for (const r of runs) {
      for (const g of parseGroups(r.notes)) {
        const s = map.get(g) ?? { total: 0, ok: 0, added: 0, last: r.ran_at };
        s.total++; if (r.status === "success") s.ok++;
        s.added += r.exercises_added ?? 0;
        map.set(g, s);
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [runs]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (error) return <p className="text-sm text-destructive">Não foi possível carregar: {error}</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-md p-3 bg-card">
        <CalendarClock className="w-4 h-4 text-primary" />
        Varredura automática diária às 01:00 (horário de Brasília), 3 grupos por vez em rodízio.
        Última execução: {runs[0] ? new Date(runs[0].ran_at).toLocaleString("pt-BR") : "—"}
      </div>
      {stats.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>}
      <div className="grid sm:grid-cols-2 gap-2">
        {stats.map(([g, s]) => {
          const rate = Math.round((s.ok / s.total) * 100);
          return (
            <div key={g} className="border border-border rounded-md p-3 bg-card space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold capitalize">{g}</span>
                <Badge variant={rate >= 80 ? "default" : rate >= 40 ? "secondary" : "destructive"}>{rate}%</Badge>
              </div>
              <div className="h-1.5 rounded bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${rate}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {s.ok}/{s.total} execuções com sucesso · {s.added} exercícios adicionados · última {new Date(s.last).toLocaleDateString("pt-BR")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
