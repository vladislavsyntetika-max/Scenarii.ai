import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Copy, Check, RotateCcw, PenTool, Type,
  Loader2, AlertCircle, BookOpen, Bookmark, BookmarkCheck,
  Camera, Mic, Layers, Music, Clock,
} from 'lucide-react';
import { useLocation } from 'wouter';

// ── Types ────────────────────────────────────────────────────────────────────

interface HookVariant {
  text: string;
  style: string;
}

interface Shot {
  id: number;
  section: string;
  timing: string;
  visual: string;
  voiceover: string;
  overlay?: string;
  sfx?: string;
}

interface RichScript {
  hooks: HookVariant[];
  shots: Shot[];
  music: string;
  totalDuration?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

// ── Style badge labels ────────────────────────────────────────────────────────

const STYLE_LABEL: Record<string, string> = {
  вопрос: 'Вопрос',
  факт: 'Факт',
  провокация: 'Провокация',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-primary uppercase mb-3">
      {icon}
      {text}
    </div>
  );
}

function HookCards({
  hooks,
  selected,
  onSelect,
}: {
  hooks: HookVariant[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="space-y-2.5">
      {hooks.map((hook, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * i }}
          onClick={() => onSelect(i)}
          className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all active:scale-[0.99] ${
            selected === i
              ? 'bg-primary/15 border-primary/60 shadow-[0_0_16px_hsl(var(--primary)/0.2)]'
              : 'bg-card/60 border-border/50 hover:border-border'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className={`text-sm font-semibold leading-snug ${selected === i ? 'text-foreground' : 'text-foreground/80'}`}>
              «{hook.text}»
            </p>
            <span
              className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                selected === i
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-muted/40 border-border/40 text-muted-foreground'
              }`}
            >
              {STYLE_LABEL[hook.style] ?? hook.style}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

function ShotCard({ shot, index }: { shot: Shot; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index }}
      className="rounded-xl border border-border/50 bg-card/50 overflow-hidden"
    >
      {/* Shot header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-b border-border/30">
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
          {shot.section}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
          <Clock className="w-3 h-3" />
          {shot.timing}
        </div>
      </div>

      <div className="px-4 py-3.5 space-y-3">
        {/* Visual */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Camera className="w-3 h-3" /> Кадр
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">{shot.visual}</p>
        </div>

        {/* Voiceover */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Mic className="w-3 h-3" /> Текст / Закадр
          </div>
          <p className="text-sm font-medium text-foreground leading-relaxed">«{shot.voiceover}»</p>
        </div>

        {/* Overlay + SFX row */}
        {(shot.overlay || shot.sfx) && (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {shot.overlay && (
              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1 text-xs text-primary font-medium">
                <Layers className="w-3 h-3 shrink-0" />
                {shot.overlay}
              </div>
            )}
            {shot.sfx && (
              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/40 rounded-lg px-2.5 py-1 text-xs text-muted-foreground">
                🔊 {shot.sfx}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [niche, setNiche] = useState('');
  const [idea, setIdea] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [script, setScript] = useState<RichScript | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedHookIdx, setSelectedHookIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const isFormValid = niche.trim().length > 0 && idea.trim().length > 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!isFormValid) return;
    setStatus('loading');
    setScript(null);
    setErrorMsg('');
    setSaved(false);
    setSelectedHookIdx(0);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim(), idea: idea.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Что-то пошло не так. Попробуйте ещё раз.');
      }

      // Guard: ensure expected shape
      if (!Array.isArray(data.hooks) || !Array.isArray(data.shots)) {
        throw new Error('Неожиданный ответ от AI. Попробуйте ещё раз.');
      }

      setScript(data as RichScript);
      setStatus('success');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Что-то пошло не так. Попробуйте ещё раз.');
      setStatus('error');
    }
  };

  const handleSave = async () => {
    if (!script || saving || saved) return;
    setSaving(true);
    try {
      const selectedHook = script.hooks[selectedHookIdx]?.text ?? script.hooks[0]?.text ?? '';
      const bodyLines = (script.shots ?? [])
        .map(s => `[${s.timing}] ${s.voiceover ?? ''}`)
        .join('\n');
      const ctaShot = script.shots[script.shots.length - 1];
      const cta = ctaShot?.voiceover ?? '';

      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: niche.trim(),
          idea: idea.trim(),
          hook: selectedHook,
          body: bodyLines || '—',
          cta: cta || '—',
          rawData: script,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const buildCopyText = (): string => {
    if (!script) return '';
    const hook = script.hooks[selectedHookIdx]?.text ?? script.hooks[0]?.text ?? '';
    const shots = (script.shots ?? [])
      .map(s =>
        [
          `[${s.timing}] ${s.section.toUpperCase()}`,
          `📷 ${s.visual ?? ''}`,
          `🎤 «${s.voiceover ?? ''}»`,
          s.overlay ? `📝 ${s.overlay}` : '',
          s.sfx ? `🔊 ${s.sfx}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      )
      .join('\n\n');
    return `🎬 КРЮЧОК\n«${hook}»\n\n📋 ПОКАДРОВЫЙ ПЛАН\n${shots}\n\n🎵 МУЗЫКА\n${script.music ?? ''}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStatus('idle');
    setScript(null);
    setIdea('');
    setErrorMsg('');
    setSaved(false);
    setSelectedHookIdx(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-background text-foreground overflow-x-hidden selection:bg-primary/30 relative z-0">
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background opacity-80" />

      <div className="w-full max-w-[480px] p-6 sm:p-8 flex flex-col relative pb-32">

        {/* Header */}
        <header className="pt-8 pb-10 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-card border border-border/50 text-primary flex items-center justify-center mb-5 shadow-[0_0_30px_hsl(var(--primary)/0.25)] relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />
            <Sparkles className="w-7 h-7 relative z-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Scenarii<span className="text-primary">.ai</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Профессиональные сценарии для коротких видео</p>
        </header>

        {/* Form */}
        <main className="flex-1 flex flex-col gap-6">
          <div className="space-y-5">
            <div className="space-y-2.5">
              <label htmlFor="niche" className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
                <PenTool className="w-4 h-4 text-primary" />
                Твоя ниша
              </label>
              <input
                id="niche"
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && document.getElementById('idea')?.focus()}
                placeholder="например: бушкрафт, сад, авто, DIY"
                className="w-full bg-input/40 border border-border rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50 shadow-inner"
              />
            </div>

            <div className="space-y-2.5">
              <label htmlFor="idea" className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
                <Type className="w-4 h-4 text-primary" />
                Идея для видео
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Краткая идея для видео..."
                rows={4}
                className="w-full bg-input/40 border border-border rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none placeholder:text-muted-foreground/50 shadow-inner"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!isFormValid || status === 'loading'}
            className="group relative w-full rounded-xl bg-primary text-primary-foreground font-bold text-lg py-4 shadow-[0_0_30px_hsl(var(--primary)/0.35)] disabled:opacity-50 disabled:shadow-none hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all overflow-hidden flex items-center justify-center gap-2.5 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            {status === 'loading'
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            {status === 'loading' ? 'Создаю сценарий...' : 'Сгенерировать сценарий'}
          </button>

          {/* Error */}
          <AnimatePresence>
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3.5 text-sm text-destructive"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {status === 'success' && script && (
              <motion.div
                ref={resultRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 flex flex-col gap-6 scroll-mt-6"
              >

                {/* ── Hooks ── */}
                <section className="rounded-2xl bg-card border border-border/60 shadow-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
                  <div className="p-5 sm:p-6">
                    <SectionLabel icon={<span>🎬</span>} text="Варианты начала (Hook)" />
                    <p className="text-xs text-muted-foreground mb-3">Выбери один — нажми, чтобы отметить</p>
                    {Array.isArray(script.hooks) && script.hooks.length > 0 ? (
                      <HookCards
                        hooks={script.hooks}
                        selected={selectedHookIdx}
                        onSelect={setSelectedHookIdx}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">Варианты начала не сформированы.</p>
                    )}
                  </div>
                </section>

                {/* ── Shots ── */}
                <section className="rounded-2xl bg-card border border-border/60 shadow-xl overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <SectionLabel icon={<span>📋</span>} text="Покадровый план" />
                    {Array.isArray(script.shots) && script.shots.length > 0 ? (
                      <div className="space-y-3">
                        {script.shots.map((shot, i) => (
                          <ShotCard key={shot.id ?? i} shot={shot} index={i} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Шоты не сформированы.</p>
                    )}
                  </div>
                </section>

                {/* ── Music ── */}
                {script.music && (
                  <section className="rounded-2xl bg-card border border-border/60 shadow-xl overflow-hidden">
                    <div className="p-5 sm:p-6">
                      <SectionLabel icon={<Music className="w-3.5 h-3.5" />} text="Рекомендации по звуку" />
                      <p className="text-sm text-foreground/85 leading-relaxed">{script.music}</p>
                    </div>
                  </section>
                )}

                {/* ── Actions ── */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 bg-card hover:bg-muted/80 border border-border py-3.5 px-4 rounded-xl font-semibold text-sm transition-all text-foreground active:scale-[0.98]"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Скопировано!' : 'Скопировать'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] border disabled:cursor-not-allowed ${
                      saved
                        ? 'bg-green-500/10 border-green-500/30 text-green-500'
                        : 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary'
                    }`}
                  >
                    {saving
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : saved
                        ? <BookmarkCheck className="w-4 h-4" />
                        : <Bookmark className="w-4 h-4" />}
                    {saved ? 'Сохранено!' : 'Сохранить'}
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-input/40 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all text-muted-foreground hover:text-foreground active:scale-[0.98]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Сгенерировать ещё раз
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div className="w-full max-w-[480px] px-4 pb-5">
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 flex gap-1.5 shadow-2xl">
            <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/15 text-primary text-sm font-semibold">
              <PenTool className="w-4 h-4" />
              Генератор
            </div>
            <button
              onClick={() => navigate('/my-scripts')}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Мои сценарии
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
