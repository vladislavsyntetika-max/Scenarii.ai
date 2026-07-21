import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Trash2, ChevronDown, ChevronUp,
  BookOpen, Loader2, AlertCircle, PenTool,
  Camera, Mic, Layers, Music, Clock,
} from 'lucide-react';
import { useLocation } from 'wouter';

// ── Types ────────────────────────────────────────────────────────────────────

interface Shot {
  id: number;
  section: string;
  timing: string;
  visual: string;
  voiceover: string;
  overlay?: string;
  sfx?: string;
}

interface RichData {
  hooks?: Array<{ text: string; style: string }>;
  shots?: Shot[];
  music?: string;
  totalDuration?: string;
}

interface SavedScript {
  id: number;
  niche: string;
  idea: string;
  hook: string;
  body: string;
  cta: string;
  rawData?: RichData | null;
  createdAt: string;
}

// ── ScriptCard ────────────────────────────────────────────────────────────────

function ScriptCard({
  script,
  onDelete,
}: {
  script: SavedScript;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasRichData = !!(script.rawData?.shots?.length);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить этот сценарий?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}`, { method: 'DELETE' });
      if (res.ok) onDelete(script.id);
    } finally {
      setDeleting(false);
    }
  };

  const date = new Date(script.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl bg-card border border-border/60 overflow-hidden"
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-bold tracking-widest text-primary uppercase">
              {script.niche}
            </span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground">{date}</span>
            {hasRichData && (
              <>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-semibold">
                  Покадровый
                </span>
              </>
            )}
          </div>
          <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground/90">
            «{script.hook}»
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-40"
            aria-label="Удалить"
          >
            {deleting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />}
          </button>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 px-4 sm:px-5 py-5 space-y-5">
              {/* Idea pill */}
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 leading-relaxed">
                💡 {script.idea}
              </div>

              {hasRichData ? (
                /* ── Rich view (new format) ── */
                <>
                  {/* Shots */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold tracking-widest text-primary uppercase flex items-center gap-1.5">
                      📋 Покадровый план
                    </div>
                    {script.rawData!.shots!.map((shot, i) => (
                      <div
                        key={shot.id ?? i}
                        className="rounded-xl border border-border/50 bg-background/40 overflow-hidden"
                      >
                        <div className="flex items-center gap-3 px-3 py-2 bg-muted/20 border-b border-border/30">
                          <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                            {shot.section}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                            <Clock className="w-3 h-3" />
                            {shot.timing}
                          </div>
                        </div>
                        <div className="px-3 py-3 space-y-2.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                              <Camera className="w-3 h-3" /> Кадр
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed">{shot.visual}</p>
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                              <Mic className="w-3 h-3" /> Текст
                            </div>
                            <p className="text-xs font-medium leading-relaxed">«{shot.voiceover}»</p>
                          </div>
                          {(shot.overlay || shot.sfx) && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {shot.overlay && (
                                <span className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5 text-[10px] text-primary font-medium">
                                  <Layers className="w-2.5 h-2.5" /> {shot.overlay}
                                </span>
                              )}
                              {shot.sfx && (
                                <span className="bg-muted/40 border border-border/40 rounded-md px-2 py-0.5 text-[10px] text-muted-foreground">
                                  🔊 {shot.sfx}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Music */}
                  {script.rawData!.music && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold tracking-widest text-primary uppercase flex items-center gap-1.5">
                        <Music className="w-3 h-3" /> Музыка
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{script.rawData!.music}</p>
                    </div>
                  )}
                </>
              ) : (
                /* ── Legacy plain-text view ── */
                <>
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold tracking-widest text-primary uppercase">🎬 Крючок</div>
                    <p className="font-semibold text-sm leading-snug">«{script.hook}»</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold tracking-widest text-primary uppercase">📖 Тело</div>
                    <div className="text-muted-foreground space-y-1 text-xs leading-relaxed">
                      {(script.body ?? '').split('\n').filter(Boolean).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold tracking-widest text-primary uppercase">📣 Призыв</div>
                    <p className="font-semibold text-sm italic">«{script.cta}»</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MyScripts() {
  const [scripts, setScripts] = useState<SavedScript[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch('/api/scripts')
      .then(r => r.json())
      .then((data: SavedScript[]) => {
        setScripts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Не удалось загрузить сценарии.');
        setLoading(false);
      });
  }, []);

  const handleDelete = (id: number) => {
    setScripts(prev => prev?.filter(s => s.id !== id) ?? null);
  };

  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-background text-foreground overflow-x-hidden selection:bg-primary/30 relative z-0">
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background opacity-80" />

      <div className="w-full max-w-[480px] p-6 sm:p-8 flex flex-col relative pb-32">

        <header className="pt-8 pb-8 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-card border border-border/50 text-primary flex items-center justify-center mb-5 shadow-[0_0_30px_hsl(var(--primary)/0.25)] relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />
            <BookOpen className="w-7 h-7 relative z-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Мои сценарии</h1>
          <p className="text-muted-foreground text-sm">Все сохранённые сценарии</p>
        </header>

        <main className="flex-1 flex flex-col gap-4">
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3.5 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && scripts?.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center py-20 gap-4"
            >
              <div className="text-5xl">📝</div>
              <p className="text-muted-foreground text-sm">
                Сохранённых сценариев пока нет.<br />Сгенерируйте и сохраните первый!
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 font-semibold text-sm shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Создать сценарий
              </button>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {scripts?.map(script => (
              <ScriptCard key={script.id} script={script} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div className="w-full max-w-[480px] px-4 pb-5">
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 flex gap-1.5 shadow-2xl">
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
            >
              <PenTool className="w-4 h-4" />
              Генератор
            </button>
            <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/15 text-primary text-sm font-semibold">
              <BookOpen className="w-4 h-4" />
              Мои сценарии
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
