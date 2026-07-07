import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import { supabase } from "@/integrations/supabase/client";
import { getExerciseDetails, primeExerciseDetails, type ExerciseDetail } from "@/lib/exercise-details-cache";
import { ArrowLeft, Search, Play, Dumbbell, Loader2, Filter, X, Target, Timer, RotateCcw, ExternalLink, Sparkles, Flame } from "lucide-react";


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
  image_url: string | null;
  video_url: string | null;
  description: string | null;
  steps: string[] | null;
}

const MUSCLE_LABEL: Record<string, string> = {
  peito: "Peito", costas: "Costas", quadriceps: "Quadríceps", posterior: "Posterior",
  gluteos: "Glúteos", ombros: "Ombros", biceps: "Bíceps", triceps: "Tríceps",
  abdomen: "Abdômen", panturrilha: "Panturrilha",
};

const MUSCLE_GRADIENT: Record<string, string> = {
  peito: "from-red-600 via-orange-500 to-amber-500",
  costas: "from-blue-600 via-indigo-500 to-violet-500",
  quadriceps: "from-emerald-600 via-green-500 to-lime-400",
  posterior: "from-teal-600 via-cyan-500 to-sky-400",
  gluteos: "from-pink-600 via-rose-500 to-fuchsia-400",
  ombros: "from-amber-500 via-yellow-500 to-orange-400",
  biceps: "from-violet-600 via-purple-500 to-indigo-400",
  triceps: "from-fuchsia-600 via-pink-500 to-rose-400",
  abdomen: "from-orange-600 via-red-500 to-pink-500",
  panturrilha: "from-sky-600 via-blue-500 to-indigo-400",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  iniciante: "bg-emerald-500/90 text-white",
  intermediario: "bg-amber-500/90 text-white",
  avancado: "bg-red-500/90 text-white",
};

const PAGE_SIZE = 24;
const searchQuery = (name: string) => encodeURIComponent(`como fazer ${name} exercício academia técnica`);
const openImage = (name: string) =>
  window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} exercício musculação execução`)}`, "_blank");

// Dispara a IA em segundo plano para gerar imagens dos exercícios que ainda não têm.
const SUPABASE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-exercise-images`;
async function triggerBackgroundImageGen(limit = 3): Promise<{ processed: number; remaining: number } | null> {
  try {
    const res = await fetch(`${SUPABASE_FN_URL}?limit=${limit}`, {
      method: "POST",
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export default function ExerciseLibrary() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LibraryExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string>("todos");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<LibraryExercise | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [aiStatus, setAiStatus] = useState<{ remaining: number; working: boolean }>({ remaining: 0, working: false });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const bgTimer = useRef<number | null>(null);

  const loadItems = async () => {
    // Payload enxuto para a listagem — description/steps sob demanda no modal.
    const { data, error } = await supabase
      .from("exercise_library")
      .select("id,name,muscle_group,secondary_muscles,equipment,difficulty,default_sets,default_reps,default_rest,technique_tip,image_url,video_url")
      .eq("active", true).order("muscle_group").order("name");
    if (error) console.error("[ExerciseLibrary] load error:", error.message);
    if (!error && data) setItems(data as LibraryExercise[]);
  };

  // Atualiza somente a image_url dos itens processados, evitando refetch total.
  const patchImages = async (ids: string[]) => {
    if (ids.length === 0) return;
    const { data } = await supabase.from("exercise_library").select("id,image_url").in("id", ids);
    if (!data) return;
    const map = new Map(data.map((d) => [d.id, d.image_url as string | null]));
    setItems((prev) => prev.map((it) => (map.has(it.id) ? { ...it, image_url: map.get(it.id) ?? it.image_url } : it)));
  };

  useEffect(() => {
    (async () => {
      await loadItems();
      setLoading(false);
    })();
  }, []);

  // Gera imagens pendentes em segundo plano, sem recarregar a lista inteira.
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const result = await triggerBackgroundImageGen(3);
      if (cancelled || !result) return;
      const done = (result as { results?: Array<{ id: string; ok: boolean }> }).results?.filter((r) => r.ok).map((r) => r.id) ?? [];
      if (done.length) await patchImages(done);
      setAiStatus({ remaining: result.remaining, working: result.remaining > 0 });
      if (result.remaining === 0 && bgTimer.current) {
        window.clearInterval(bgTimer.current);
        bgTimer.current = null;
      }
    };
    // status inicial baseado no estado local (sem query extra)
    const pending = items.filter((i) => !i.image_url).length;
    setAiStatus({ remaining: pending, working: pending > 0 });
    if (pending > 0) {
      tick();
      bgTimer.current = window.setInterval(tick, 25000);
    }
    return () => {
      cancelled = true;
      if (bgTimer.current) { window.clearInterval(bgTimer.current); bgTimer.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const muscles = useMemo(() => {
    const set = new Set(items.map((i) => i.muscle_group));
    return ["todos", ...Array.from(set)];
  }, [items]);

  const fuse = useMemo(
    () => new Fuse(items, {
      keys: [{ name: "name", weight: 0.7 }, { name: "equipment", weight: 0.2 }, { name: "muscle_group", weight: 0.1 }],
      threshold: 0.4, ignoreLocation: true, minMatchCharLength: 2,
    }),
    [items]
  );

  const baseFiltered = useMemo(
    () => muscle === "todos" ? items : items.filter((i) => i.muscle_group === muscle),
    [items, muscle]
  );

  const filtered = useMemo(() => {
    const term = search.trim();
    if (!term) return baseFiltered;
    const results = fuse.search(term).map((r) => r.item);
    return muscle === "todos" ? results : results.filter((i) => i.muscle_group === muscle);
  }, [baseFiltered, fuse, search, muscle]);

  const suggestions = useMemo(() => {
    const term = search.trim();
    if (term.length < 2) return [];
    return fuse.search(term, { limit: 6 }).map((r) => r.item);
  }, [fuse, search]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [search, muscle]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length)); },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visible);
  const featured = shown[0];
  const rest = shown.slice(1);

  const applySuggestion = (ex: LibraryExercise) => {
    setSearch(ex.name); setSuggestOpen(false); setHighlight(-1); setSelected(ex);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && highlight >= 0) { e.preventDefault(); applySuggestion(suggestions[highlight]); }
    else if (e.key === "Escape") setSuggestOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HERO HEADER */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 pt-5 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-secondary/80 backdrop-blur border border-border flex items-center justify-center hover:bg-secondary" aria-label="Voltar">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                <Flame className="w-3 h-3" /> Biblioteca Pro
              </div>
              <h1 className="text-3xl sm:text-4xl leading-none tracking-wide mt-1" style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}>
                ARSENAL DE EXERCÍCIOS
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {loading ? "Carregando biblioteca…" : `${items.length} movimentos · ${muscles.length - 1} grupos musculares · curadoria IA`}
              </p>
            </div>

            {aiStatus.working && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-[11px] font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                IA gerando imagens · {aiStatus.remaining} restantes
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setSuggestOpen(true); setHighlight(-1); }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
              onKeyDown={onKeyDown}
              placeholder="Buscar exercício (tolera erros)…"
              className="w-full h-12 pl-10 pr-10 rounded-xl bg-card/80 backdrop-blur border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
            {search && (
              <button onClick={() => { setSearch(""); setSuggestOpen(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md hover:bg-background/50 flex items-center justify-center" aria-label="Limpar">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}

            {suggestOpen && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-30 max-h-80 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li key={s.id}
                      onMouseDown={(e) => { e.preventDefault(); applySuggestion(s); }}
                      onMouseEnter={() => setHighlight(i)}
                      className={`px-3.5 py-2.5 text-sm cursor-pointer flex items-center justify-between gap-3 ${highlight === i ? "bg-secondary" : ""}`}>
                    <span className="truncate">{s.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 font-bold">
                      {MUSCLE_LABEL[s.muscle_group] ?? s.muscle_group}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Filter chips */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {muscles.map((m) => (
              <button key={m} onClick={() => setMuscle(m)}
                className={`px-3.5 h-8 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                  muscle === m ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-105" : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}>
                {m === "todos" ? "Todos" : (MUSCLE_LABEL[m] ?? m)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando arsenal…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            Nenhum exercício encontrado para "{search}".
          </div>
        ) : (
          <>
            {/* Featured card grande */}
            {featured && (
              <FeaturedCard exercise={featured} onOpen={() => setSelected(featured)} />
            )}

            {/* Grid */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} onOpen={() => setSelected(ex)} />
              ))}
            </div>

            {visible < filtered.length && (
              <div ref={sentinelRef} className="flex items-center justify-center py-10 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando mais {Math.min(PAGE_SIZE, filtered.length - visible)}…
              </div>
            )}
            {visible >= filtered.length && filtered.length > PAGE_SIZE && (
              <p className="text-center text-xs text-muted-foreground py-8">
                {filtered.length} exercícios · fim do arsenal
              </p>
            )}
          </>
        )}
      </main>

      {selected && <ExerciseModal exercise={selected} onClose={() => setSelected(null)} />}

      {/* Status flutuante em mobile */}
      {aiStatus.working && (
        <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-primary/95 text-primary-foreground text-[11px] font-semibold shadow-2xl">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> IA · {aiStatus.remaining} imagens restantes
        </div>
      )}
    </div>
  );
}

// ─── CARDS ─────────────────────────────────────────────────────────────

function ExerciseThumb({ exercise, className = "" }: { exercise: LibraryExercise; className?: string }) {
  const [failed, setFailed] = useState(false);
  const gradient = MUSCLE_GRADIENT[exercise.muscle_group] ?? "from-secondary to-background";
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
      {exercise.image_url && !failed ? (
        <img src={exercise.image_url} alt={exercise.name} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setFailed(true)} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Dumbbell className="w-16 h-16 text-white/30" />
          {!exercise.image_url && (
            <span className="absolute bottom-2 right-2 text-[9px] uppercase tracking-widest text-white/60 font-bold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> IA
            </span>
          )}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
    </div>
  );
}

function FeaturedCard({ exercise, onOpen }: { exercise: LibraryExercise; onOpen: () => void }) {
  return (
    <article onClick={onOpen}
      className="group relative rounded-2xl overflow-hidden border border-border bg-card cursor-pointer hover:border-primary/50 transition-all shadow-xl">
      <div className="grid md:grid-cols-2 gap-0 min-h-[280px]">
        <ExerciseThumb exercise={exercise} className="h-56 md:h-full" />
        <div className="p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                <Flame className="w-3 h-3" /> Destaque
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {MUSCLE_LABEL[exercise.muscle_group] ?? exercise.muscle_group}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl leading-tight mb-3" style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}>
              {exercise.name.toUpperCase()}
            </h2>
            {exercise.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {exercise.description}
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {exercise.difficulty && (
              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${DIFFICULTY_COLOR[exercise.difficulty] ?? "bg-secondary text-foreground"}`}>
                {exercise.difficulty}
              </span>
            )}
            {exercise.equipment && (
              <span className="px-2.5 py-1 rounded-md bg-secondary text-[11px] font-semibold">{exercise.equipment}</span>
            )}
            <span className="px-2.5 py-1 rounded-md bg-secondary text-[11px] font-semibold">
              {exercise.default_sets ?? 3}×{exercise.default_reps ?? "10-12"}
            </span>
            <button className="ml-auto h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-primary/90">
              <Play className="w-3.5 h-3.5" /> Ver técnica
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ExerciseCard({ exercise, onOpen }: { exercise: LibraryExercise; onOpen: () => void }) {
  return (
    <article onClick={onOpen}
      className="group relative rounded-xl overflow-hidden border border-border bg-card hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col">
      <ExerciseThumb exercise={exercise} className="h-40" />

      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2 z-10">
        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[9px] font-bold uppercase tracking-widest">
          {MUSCLE_LABEL[exercise.muscle_group] ?? exercise.muscle_group}
        </span>
        {exercise.difficulty && (
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${DIFFICULTY_COLOR[exercise.difficulty] ?? "bg-secondary text-foreground"}`}>
            {exercise.difficulty}
          </span>
        )}
      </div>

      <div className="p-3.5 flex-1 flex flex-col gap-2">
        <h3 className="font-bold leading-tight line-clamp-2 text-[15px]">{exercise.name}</h3>
        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          {exercise.equipment && <span className="px-2 py-0.5 rounded-md bg-secondary font-semibold">{exercise.equipment}</span>}
          <span className="px-2 py-0.5 rounded-md bg-secondary font-semibold">{exercise.default_sets ?? 3}×{exercise.default_reps ?? "10-12"}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="mt-auto h-9 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 border border-primary/30 transition-colors">
          <Play className="w-3.5 h-3.5" /> Detalhes
        </button>
      </div>
    </article>
  );
}

// ─── MODAL ─────────────────────────────────────────────────────────────

function ExerciseModal({ exercise, onClose }: { exercise: LibraryExercise; onClose: () => void }) {
  const [detail, setDetail] = useState<{ description: string | null; steps: string[] | null }>({
    description: exercise.description ?? null,
    steps: exercise.steps ?? null,
  });

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onEsc); document.body.style.overflow = ""; };
  }, [onClose]);

  // Carrega descrição/passos sob demanda (payload da lista é enxuto).
  useEffect(() => {
    if (detail.description && detail.steps) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("exercise_library")
        .select("description,steps")
        .eq("id", exercise.id)
        .maybeSingle();
      if (!cancelled && data) setDetail({ description: data.description ?? null, steps: (data.steps as string[] | null) ?? null });
    })();
    return () => { cancelled = true; };
  }, [exercise.id]);

  const steps = detail.steps && detail.steps.length > 0 ? detail.steps : buildSteps(exercise);
  const embedSrc = null; // URLs de vídeo do banco não são verificadas; usar CTA confiável.
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery(exercise.name)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] bg-card border border-border sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95"
           onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background" aria-label="Fechar">
          <X className="w-4 h-4" />
        </button>

        <div className="relative aspect-video bg-black">
          {embedSrc ? (
            <iframe src={embedSrc} title={`Vídeo: ${exercise.name}`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen loading="lazy" />
          ) : (
            <button onClick={() => window.open(ytSearchUrl, "_blank")}
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 group cursor-pointer">
              {exercise.image_url ? (
                <img src={exercise.image_url} alt={exercise.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${MUSCLE_GRADIENT[exercise.muscle_group] ?? "from-secondary to-background"} opacity-60`} />
              )}
              <div className="relative w-16 h-16 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
              <span className="relative text-white text-sm font-semibold drop-shadow-lg">Assistir no YouTube</span>
            </button>
          )}
        </div>


        <div className="p-5 overflow-y-auto">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {MUSCLE_LABEL[exercise.muscle_group] ?? exercise.muscle_group}
              </span>
              <h2 className="text-2xl leading-tight mt-1" style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}>
                {exercise.name.toUpperCase()}
              </h2>
            </div>
            {exercise.difficulty && (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${DIFFICULTY_COLOR[exercise.difficulty] ?? "bg-secondary"}`}>
                {exercise.difficulty}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatBox icon={<RotateCcw className="w-3.5 h-3.5" />} label="Séries × Reps" value={`${exercise.default_sets ?? 3}×${exercise.default_reps ?? "10-12"}`} />
            <StatBox icon={<Timer className="w-3.5 h-3.5" />} label="Descanso" value={exercise.default_rest ?? "60s"} />
            <StatBox icon={<Dumbbell className="w-3.5 h-3.5" />} label="Equipamento" value={exercise.equipment ?? "Livre"} />
          </div>

          <Section title="Grupos musculares">
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-md bg-primary/15 text-primary text-xs font-semibold inline-flex items-center gap-1">
                <Target className="w-3 h-3" /> {MUSCLE_LABEL[exercise.muscle_group] ?? exercise.muscle_group}
              </span>
              {exercise.secondary_muscles?.map((m) => (
                <span key={m} className="px-2.5 py-1 rounded-md bg-secondary text-xs text-muted-foreground">{m}</span>
              ))}
            </div>
          </Section>

          <Section title="Descrição">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {detail.description ?? (
                <>
                  Exercício focado em <strong className="text-foreground">{(MUSCLE_LABEL[exercise.muscle_group] ?? exercise.muscle_group).toLowerCase()}</strong>
                  {exercise.equipment ? <> utilizando <strong className="text-foreground">{exercise.equipment.toLowerCase()}</strong></> : null}
                  . Execute com controle total do movimento, priorizando a conexão mente-músculo e a amplitude completa em cada repetição.
                </>
              )}
            </p>
          </Section>

          <Section title="Técnica passo a passo">
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-6 h-6 rounded-md bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-muted-foreground leading-relaxed pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </Section>

          {exercise.technique_tip && (
            <Section title="Dica do especialista">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground">
                💡 {exercise.technique_tip}
              </div>
            </Section>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${searchQuery(exercise.name)}`, "_blank")}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/90">
              <ExternalLink className="w-4 h-4" /> Mais vídeos
            </button>
            <button onClick={() => openImage(exercise.name)} className="h-10 px-4 rounded-lg bg-secondary text-sm font-semibold hover:bg-secondary/80">
              Fotos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 border border-border p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className="text-sm font-semibold mt-1 truncate capitalize">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">{title}</h3>
      {children}
    </section>
  );
}

function buildSteps(ex: LibraryExercise): string[] {
  const eq = ex.equipment?.toLowerCase() ?? "o equipamento";
  const muscle = (MUSCLE_LABEL[ex.muscle_group] ?? ex.muscle_group).toLowerCase();
  return [
    `Posicione-se corretamente ${eq.includes("máquina") || eq.includes("cabo") ? `na ${eq}` : `com ${eq}`}, ajustando altura, pegada e apoios ao seu biotipo.`,
    "Ative o core, mantenha a coluna neutra e os ombros retraídos antes de iniciar o movimento.",
    `Execute a fase excêntrica (descida/alongamento) de forma controlada em 2-3 segundos, sentindo o alongamento do ${muscle}.`,
    `Realize a fase concêntrica (subida/contração) com força, focando na contração máxima do ${muscle} no topo.`,
    `Complete ${ex.default_sets ?? 3} séries de ${ex.default_reps ?? "10-12"} repetições, descansando ${ex.default_rest ?? "60s"} entre elas.`,
    "Mantenha a respiração ritmada: expire na fase de esforço e inspire na fase de retorno.",
  ];
}

function toYouTubeEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    return null;
  } catch { return null; }
}
