import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Play, Dumbbell, Loader2, Filter, X, Target, Timer, RotateCcw, ExternalLink } from "lucide-react";

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

// Imagens ilustrativas por grupo muscular (Unsplash, licença livre).
const MUSCLE_IMAGE: Record<string, string> = {
  peito: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=70&auto=format&fit=crop",
  costas: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=600&q=70&auto=format&fit=crop",
  quadriceps: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=70&auto=format&fit=crop",
  posterior: "https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=600&q=70&auto=format&fit=crop",
  gluteos: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=70&auto=format&fit=crop",
  ombros: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=600&q=70&auto=format&fit=crop",
  biceps: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=70&auto=format&fit=crop",
  triceps: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&q=70&auto=format&fit=crop",
  abdomen: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?w=600&q=70&auto=format&fit=crop",
  panturrilha: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=600&q=70&auto=format&fit=crop",
};

const PAGE_SIZE = 24;
const searchQuery = (name: string) => encodeURIComponent(`como fazer ${name} exercício academia técnica`);
const openImage = (name: string) =>
  window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} exercício musculação execução`)}`, "_blank");

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
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("id,name,muscle_group,secondary_muscles,equipment,difficulty,default_sets,default_reps,default_rest,technique_tip,image_url,video_url,description,steps")
        .eq("active", true).order("muscle_group").order("name");
      if (error) console.error("[ExerciseLibrary] load error:", error.message);
      if (!error && data) setItems(data as LibraryExercise[]);
      setLoading(false);
    })();
  }, []);


  const muscles = useMemo(() => {
    const set = new Set(items.map((i) => i.muscle_group));
    return ["todos", ...Array.from(set)];
  }, [items]);

  // Fuse.js fuzzy search: tolera erros de digitação e ordena por relevância.
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "name", weight: 0.7 },
          { name: "equipment", weight: 0.2 },
          { name: "muscle_group", weight: 0.1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [items]
  );

  const baseFiltered = useMemo(() => {
    return muscle === "todos" ? items : items.filter((i) => i.muscle_group === muscle);
  }, [items, muscle]);

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

  // Reseta paginação quando filtros mudam.
  useEffect(() => { setVisible(PAGE_SIZE); }, [search, muscle]);

  // Carregamento progressivo com IntersectionObserver.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visible);

  const applySuggestion = (ex: LibraryExercise) => {
    setSearch(ex.name);
    setSuggestOpen(false);
    setHighlight(-1);
    setSelected(ex);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && highlight >= 0) { e.preventDefault(); applySuggestion(suggestions[highlight]); }
    else if (e.key === "Escape") { setSuggestOpen(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80" aria-label="Voltar">
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

          <div className="mt-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSuggestOpen(true); setHighlight(-1); }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
              onKeyDown={onKeyDown}
              placeholder="Buscar (tolera erros de digitação)…"
              className="w-full h-10 pl-9 pr-9 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setSuggestOpen(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md hover:bg-background/50 flex items-center justify-center"
                aria-label="Limpar"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}

            {suggestOpen && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-20 max-h-72 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li
                    key={s.id}
                    onMouseDown={(e) => { e.preventDefault(); applySuggestion(s); }}
                    onMouseEnter={() => setHighlight(i)}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-3 ${highlight === i ? "bg-secondary" : ""}`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                      {MUSCLE_LABEL[s.muscle_group] ?? s.muscle_group}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {muscles.map((m) => (
              <button
                key={m}
                onClick={() => setMuscle(m)}
                className={`px-3 h-7 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                  muscle === m ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shown.map((ex) => (
                <article
                  key={ex.id}
                  onClick={() => setSelected(ex)}
                  className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors flex flex-col cursor-pointer group"
                >
                  <div className={`relative h-32 bg-gradient-to-br ${MUSCLE_GRADIENT[ex.muscle_group] ?? "from-secondary to-background"} overflow-hidden`}>
                    {(ex.image_url || MUSCLE_IMAGE[ex.muscle_group]) && (
                      <img
                        src={ex.image_url ?? MUSCLE_IMAGE[ex.muscle_group]}
                        alt={ex.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-300"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (ex.image_url && img.src === ex.image_url && MUSCLE_IMAGE[ex.muscle_group]) {
                            img.src = MUSCLE_IMAGE[ex.muscle_group];
                          } else {
                            img.style.display = "none";
                          }
                        }}
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                    <Dumbbell className="absolute right-3 bottom-3 w-8 h-8 text-foreground/60" />
                    <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-background/70 backdrop-blur">
                      {MUSCLE_LABEL[ex.muscle_group] ?? ex.muscle_group}
                    </span>
                    {ex.difficulty && (
                      <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/70 backdrop-blur capitalize">
                        {ex.difficulty}
                      </span>
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <h3 className="font-semibold leading-tight line-clamp-2">{ex.name}</h3>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {ex.equipment && <span className="px-2 py-0.5 rounded-md bg-secondary">{ex.equipment}</span>}
                      <span className="px-2 py-0.5 rounded-md bg-secondary">{ex.default_sets ?? 3}x{ex.default_reps ?? "10-12"}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(ex); }}
                      className="mt-auto h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-primary/90"
                    >
                      <Play className="w-3.5 h-3.5" /> Ver detalhes
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {visible < filtered.length && (
              <div ref={sentinelRef} className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando mais {Math.min(PAGE_SIZE, filtered.length - visible)}…
              </div>
            )}
            {visible >= filtered.length && filtered.length > PAGE_SIZE && (
              <p className="text-center text-xs text-muted-foreground py-6">Todos os {filtered.length} exercícios exibidos.</p>
            )}
          </>
        )}
      </main>

      {selected && <ExerciseModal exercise={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ExerciseModal({ exercise, onClose }: { exercise: LibraryExercise; onClose: () => void }) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onEsc); document.body.style.overflow = ""; };
  }, [onClose]);

  const steps = buildSteps(exercise);
  const embedSrc = `https://www.youtube.com/embed?listType=search&list=${searchQuery(exercise.name)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] bg-card border border-border sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background" aria-label="Fechar">
          <X className="w-4 h-4" />
        </button>

        <div className="relative aspect-video bg-black">
          <iframe
            src={embedSrc}
            title={`Vídeo: ${exercise.name}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {MUSCLE_LABEL[exercise.muscle_group] ?? exercise.muscle_group}
              </span>
              <h2 className="text-2xl leading-tight mt-1" style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}>
                {exercise.name.toUpperCase()}
              </h2>
            </div>
            {exercise.difficulty && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary capitalize shrink-0">
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
              Exercício focado em <strong className="text-foreground">{(MUSCLE_LABEL[exercise.muscle_group] ?? exercise.muscle_group).toLowerCase()}</strong>
              {exercise.equipment ? <> utilizando <strong className="text-foreground">{exercise.equipment.toLowerCase()}</strong></> : null}
              . Execute com controle total do movimento, priorizando a conexão mente-músculo e a amplitude completa em cada repetição.
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
            <button
              onClick={() => window.open(`https://www.youtube.com/results?search_query=${searchQuery(exercise.name)}`, "_blank")}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/90"
            >
              <ExternalLink className="w-4 h-4" /> Mais vídeos no YouTube
            </button>
            <button
              onClick={() => openImage(exercise.name)}
              className="h-10 px-4 rounded-lg bg-secondary text-sm font-semibold hover:bg-secondary/80"
            >
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
