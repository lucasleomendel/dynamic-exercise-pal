import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Play, Dumbbell, Loader2, Filter } from "lucide-react";

interface LibraryExercise {
  id: string;
  name: string;
  muscle_group: string;
  secondary_muscles: string[] | null;
  equipment: string | null;
  difficulty: string | null;
  default_sets: number | null;
  default_reps: string | null;
  default_rest: string | null;
  technique_tip: string | null;
}

const MUSCLE_LABEL: Record<string, string> = {
  peito: "Peito",
  costas: "Costas",
  quadriceps: "Quadríceps",
  posterior: "Posterior",
  gluteos: "Glúteos",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  abdomen: "Abdômen",
  panturrilha: "Panturrilha",
};

const MUSCLE_GRADIENT: Record<string, string> = {
  peito: "from-red-500/40 to-orange-500/20",
  costas: "from-blue-500/40 to-indigo-500/20",
  quadriceps: "from-emerald-500/40 to-green-500/20",
  posterior: "from-teal-500/40 to-cyan-500/20",
  gluteos: "from-pink-500/40 to-rose-500/20",
  ombros: "from-amber-500/40 to-yellow-500/20",
  biceps: "from-violet-500/40 to-purple-500/20",
  triceps: "from-fuchsia-500/40 to-pink-500/20",
  abdomen: "from-orange-500/40 to-red-500/20",
  panturrilha: "from-sky-500/40 to-blue-500/20",
};

const openVideo = (name: string) => {
  const q = encodeURIComponent(`como fazer ${name} exercício academia técnica`);
  window.open(`https://www.youtube.com/results?search_query=${q}`, "_blank");
};

const openImage = (name: string) => {
  const q = encodeURIComponent(`${name} exercício musculação execução`);
  window.open(`https://www.google.com/search?tbm=isch&q=${q}`, "_blank");
};

export default function ExerciseLibrary() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LibraryExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string>("todos");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("id,name,muscle_group,secondary_muscles,equipment,difficulty,default_sets,default_reps,default_rest,technique_tip")
        .eq("active", true)
        .order("muscle_group")
        .order("name");
      if (!error && data) setItems(data as LibraryExercise[]);
      setLoading(false);
    })();
  }, []);

  const muscles = useMemo(() => {
    const set = new Set(items.map((i) => i.muscle_group));
    return ["todos", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((it) => {
      if (muscle !== "todos" && it.muscle_group !== muscle) return false;
      if (!term) return true;
      return (
        it.name.toLowerCase().includes(term) ||
        it.equipment?.toLowerCase().includes(term) ||
        MUSCLE_LABEL[it.muscle_group]?.toLowerCase().includes(term)
      );
    });
  }, [items, search, muscle]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl leading-none tracking-wide" style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}>
                BIBLIOTECA DE EXERCÍCIOS
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? "Carregando…" : `${items.length} exercícios · ${muscles.length - 1} grupos musculares`}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, equipamento ou músculo…"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {muscles.map((m) => (
              <button
                key={m}
                onClick={() => setMuscle(m)}
                className={`px-3 h-7 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                  muscle === m
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "todos" ? "TODOS" : (MUSCLE_LABEL[m] ?? m).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando biblioteca…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            Nenhum exercício encontrado para “{search}”.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((ex) => (
              <article
                key={ex.id}
                className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors flex flex-col"
              >
                <button
                  onClick={() => openImage(ex.name)}
                  className={`relative h-28 bg-gradient-to-br ${MUSCLE_GRADIENT[ex.muscle_group] ?? "from-secondary to-background"} flex items-center justify-center group`}
                >
                  <Dumbbell className="w-10 h-10 text-foreground/70 group-hover:scale-110 transition-transform" />
                  <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-background/70 backdrop-blur">
                    {MUSCLE_LABEL[ex.muscle_group] ?? ex.muscle_group}
                  </span>
                  {ex.difficulty && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/70 backdrop-blur capitalize">
                      {ex.difficulty}
                    </span>
                  )}
                </button>

                <div className="p-3 flex-1 flex flex-col gap-2">
                  <h3 className="font-semibold leading-tight line-clamp-2">{ex.name}</h3>

                  <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {ex.equipment && (
                      <span className="px-2 py-0.5 rounded-md bg-secondary">{ex.equipment}</span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-secondary">
                      {ex.default_sets ?? 3}x{ex.default_reps ?? "10-12"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-secondary">Descanso {ex.default_rest ?? "60s"}</span>
                  </div>

                  {ex.technique_tip && (
                    <p className="text-xs text-muted-foreground line-clamp-2">💡 {ex.technique_tip}</p>
                  )}

                  <div className="mt-auto pt-2 flex gap-2">
                    <button
                      onClick={() => openVideo(ex.name)}
                      className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-primary/90"
                    >
                      <Play className="w-3.5 h-3.5" /> Ver vídeo
                    </button>
                    <button
                      onClick={() => openImage(ex.name)}
                      className="h-9 px-3 rounded-lg bg-secondary text-xs font-semibold hover:bg-secondary/80"
                    >
                      Fotos
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
