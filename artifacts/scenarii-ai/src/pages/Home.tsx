import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Copy, Check, RotateCcw, PenTool, Type,
  Loader2, AlertCircle, BookOpen, Bookmark, BookmarkCheck,
  Camera, Mic, Layers, Music, Clock, Flame, TrendingUp, ChevronRight,
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

interface TrendingResult {
  trending_ideas: string[];
  best_idea_index: number;
  best_script: RichScript;
}

type Mode = 'generate' | 'trending';
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
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Camera className="w-3 h-3" /> Кадр
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">{shot.visual}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Mic className="w-3 h-3" /> Текст / Закадр
          </div>
          <p className="text-sm font-medium text-foreground leading-relaxed">«{shot.voiceover}»</p>
        </div>
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

// Idea card for trending mode
function IdeaCard({
  idea,
  index,
  isSelected,
  isBest,
  isLoadingScript,
  onClick,
}: {
  idea: string;
  index: number;
  isSelected: boolean;
  isBest: boolean;
  isLoadingScript: boolean;
  onClick: () => void;
}) {
  // Split "Format Name: description" for nicer display
  const colonIdx = idea.indexOf(':');
  const title = colonIdx > 0 ? idea.slice(0, colonIdx).trim() : null;
  const desc = colonIdx > 0 ? idea.slice(colonIdx + 1).trim() : idea;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index }}
      onClick={onClick}
      disabled={isLoadingScript && !isSelected}
      className={`w-full text-left rounded-xl border px-4 py-4 transition-all active:scale-[0.99] ${
        isSelected
          ? 'bg-primary/15 border-primary/60 shadow-[0_0_20px_hsl(var(--primary)/0.2)]'
          : 'bg-card/60 border-border/50 hover:border-border hover:bg-card/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold tracking-wide ${isSelected ? 'text-primary' : 'text-foreground/60'}`}>
              #{index + 1}
            </span>
            {isBest && (
              <span className="text-[9px] font-bold tracking-widest uppercase bg-orange-500/15 text-orange-400 border border-orange-500/25 px-1.5 py-0.5 rounded-full">
                🔥 Лучшая
              </span>
            )}
            {title && (
              <span className={`text-xs font-bold ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                {title}
              </span>
            )}
          </div>
          <p className={`text-sm leading-relaxed ${isSelected ? 'text-foreground/90' : 'text-muted-foreground'}`}>
            {desc}
          </p>
        </div>
        <div className="shrink-0 mt-0.5">
          {isLoadingScript && isSelected
            ? <Loader2 className="w-4 h-4 animate-spin text-primary" />
            : <ChevronRight className={`w-4 h-4 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/50'}`} />}
        </div>
      </div>
    </motion.button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  // Form
  const [niche, setNiche] = useState('');
  const [idea, setIdea] = useState('');

  // Mode toggle
  const [mode, setMode] = useState<Mode>('generate');

  // Generate-mode state
  const [genStatus, setGenStatus] = useState<Status>('idle');
  const [script, setScript] = useState<RichScript | null>(null);
  const [genError, setGenError] = useState('');

  // Trending-mode state
  const [trendStatus, setTrendStatus] = useState<Status>('idle');
  const [trendResult, setTrendResult] = useState<TrendingResult | null>(null);
  const [trendError, setTrendError] = useState('');
  const [selectedIdeaIdx, setSelectedIdeaIdx] = useState<number | null>(null);
  const [ideaScriptStatus, setIdeaScriptStatus] = useState<Status>('idle');

  // Shared result state
  const [selectedHookIdx, setSelectedHookIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const isNicheValid = niche.trim().length > 0;
  const isFormValid = isNicheValid && idea.trim().length > 0;

  // The currently displayed script (generate or trending flow)
  const activeScript = script;
  const isLoading = mode === 'generate' ? genStatus === 'loading' : trendStatus === 'loading';

  // The idea text to use for saving in trending mode
  const activeTrendingIdea =
    trendResult && selectedIdeaIdx !== null
      ? trendResult.trending_ideas[selectedIdeaIdx] ?? ''
      : '';

  // ── Scroll helper ──────────────────────────────────────────────────────────

  const scrollToResult = () => {
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  // ── Mode switch ────────────────────────────────────────────────────────────

  const switchMode = (m: Mode) => {
    setMode(m);
    setGenStatus('idle');
    setTrendStatus('idle');
    setScript(null);
    setTrendResult(null);
    setTrendError('');
    setGenError('');
    setSelectedIdeaIdx(null);
    setSaved(false);
    setSelectedHookIdx(0);
  };

  // ── Generate handler (regular mode) ───────────────────────────────────────

  const handleGenerate = async () => {
    if (!isFormValid) return;
    setGenStatus('loading');
    setScript(null);
    setGenError('');
    setSaved(false);
    setSelectedHookIdx(0);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim(), idea: idea.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Что-то пошло не так.');
      if (!Array.isArray(data.hooks) || !Array.isArray(data.shots))
        throw new Error('Неожиданный ответ от AI. Попробуйте ещё раз.');
      setScript(data as RichScript);
      setGenStatus('success');
      scrollToResult();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Что-то пошло не так.');
      setGenStatus('error');
    }
  };

  // ── Trending handler ───────────────────────────────────────────────────────

  const handleFindTrends = async () => {
    if (!isNicheValid) return;
    setTrendStatus('loading');
    setTrendResult(null);
    setScript(null);
    setTrendError('');
    setSaved(false);
    setSelectedHookIdx(0);
    setSelectedIdeaIdx(null);

    try {
      const res = await fetch('/api/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Что-то пошло не так.');
      if (!Array.isArray(data.trending_ideas) || !data.best_script)
        throw new Error('Неожиданный ответ от AI. Попробуйте ещё раз.');

      const result = data as TrendingResult;
      const bestIdx = result.best_idea_index ?? 0;
      setTrendResult(result);
      setSelectedIdeaIdx(bestIdx);
      setScript(result.best_script);
      setSelectedHookIdx(0);
      setTrendStatus('success');
      scrollToResult();
    } catch (err) {
      setTrendError(err instanceof Error ? err.message : 'Что-то пошло не так.');
      setTrendStatus('error');
    }
  };

  // ── Select a trending idea (may need to generate its script) ──────────────

  const handleSelectIdea = async (idx: number) => {
    if (!trendResult || selectedIdeaIdx === idx) return;
    setSaved(false);
    setSelectedHookIdx(0);

    // If this is the best idea, use pre-loaded script
    if (idx === trendResult.best_idea_index) {
      setSelectedIdeaIdx(idx);
      setScript(trendResult.best_script);
      scrollToResult();
      return;
    }

    // Otherwise generate a script for this idea on-the-fly
    setSelectedIdeaIdx(idx);
    setScript(null);
    setIdeaScriptStatus('loading');

    try {
      const ideaText = trendResult.trending_ideas[idx] ?? '';
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim(), idea: ideaText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Что-то пошло не так.');
      if (!Array.isArray(data.hooks) || !Array.isArray(data.shots))
        throw new Error('Неожиданный ответ от AI.');
      setScript(data as RichScript);
      setIdeaScriptStatus('success');
      scrollToResult();
    } catch {
      setIdeaScriptStatus('error');
    }
  };

  // ── Save handler ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!activeScript || saving || saved) return;
    setSaving(true);

    const ideaText = mode === 'trending' ? activeTrendingIdea : idea.trim();
    const selectedHook = activeScript.hooks[selectedHookIdx]?.text ?? activeScript.hooks[0]?.text ?? '';
    const bodyLines = (activeScript.shots ?? []).map(s => `[${s.timing}] ${s.voiceover ?? ''}`).join('\n');
    const cta = activeScript.shots[activeScript.shots.length - 1]?.voiceover ?? '';

    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: niche.trim(),
          idea: ideaText || '—',
          hook: selectedHook,
          body: bodyLines || '—',
          cta: cta || '—',
          rawData: activeScript,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  // ── Copy handler ───────────────────────────────────────────────────────────

  const buildCopyText = (): string => {
    if (!activeScript) return '';
    const hook = activeScript.hooks[selectedHookIdx]?.text ?? activeScript.hooks[0]?.text ?? '';
    const shots = (activeScript.shots ?? [])
      .map(s =>
        [
          `[${s.timing}] ${s.section.toUpperCase()}`,
          `📷 ${s.visual ?? ''}`,
          `🎤 «${s.voiceover ?? ''}»`,
          s.overlay ? `📝 ${s.overlay}` : '',
          s.sfx ? `🔊 ${s.sfx}` : '',
        ].filter(Boolean).join('\n')
      ).join('\n\n');
    return `🎬 КРЮЧОК\n«${hook}»\n\n📋 ПОКАДРОВЫЙ ПЛАН\n${shots}\n\n🎵 МУЗЫКА\n${activeScript.music ?? ''}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGenStatus('idle');
    setTrendStatus('idle');
    setScript(null);
    setTrendResult(null);
    setIdea('');
    setGenError('');
    setTrendError('');
    setSaved(false);
    setSelectedHookIdx(0);
    setSelectedIdeaIdx(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Derived UI flags ───────────────────────────────────────────────────────

  const showGenResult = mode === 'generate' && genStatus === 'success' && activeScript;
  const showTrendResult = mode === 'trending' && trendStatus === 'success' && trendResult;
  const showScript = !!(activeScript && (showGenResult || (showTrendResult && selectedIdeaIdx !== null)));
  const scriptLoading = mode === 'trending' && ideaScriptStatus === 'loading' && !activeScript;

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

        {/* Mode toggle */}
        <div className="bg-card/60 border border-border/50 rounded-2xl p-1.5 flex gap-1.5 mb-6">
          <button
            onClick={() => switchMode('generate')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              mode === 'generate'
                ? 'bg-primary/15 text-primary shadow-inner'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <PenTool className="w-4 h-4" />
            По идее
          </button>
          <button
            onClick={() => switchMode('trending')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              mode === 'trending'
                ? 'bg-orange-500/15 text-orange-400 shadow-inner'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Flame className="w-4 h-4" />
            Тренды
          </button>
        </div>

        {/* Form */}
        <main className="flex-1 flex flex-col gap-6">
          <div className="space-y-5">

            {/* Niche — always visible */}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (mode === 'generate') document.getElementById('idea')?.focus();
                    else handleFindTrends();
                  }
                }}
                placeholder="например: бушкрафт, сад, авто, DIY"
                className="w-full bg-input/40 border border-border rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50 shadow-inner"
              />
            </div>

            {/* Idea textarea — only in generate mode */}
            <AnimatePresence initial={false}>
              {mode === 'generate' && (
                <motion.div
                  key="idea-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5 pt-0.5">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA button */}
          {mode === 'generate' ? (
            <button
              onClick={handleGenerate}
              disabled={!isFormValid || genStatus === 'loading'}
              className="group relative w-full rounded-xl bg-primary text-primary-foreground font-bold text-lg py-4 shadow-[0_0_30px_hsl(var(--primary)/0.35)] disabled:opacity-50 disabled:shadow-none hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all overflow-hidden flex items-center justify-center gap-2.5 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {genStatus === 'loading'
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              {genStatus === 'loading' ? 'Создаю сценарий...' : 'Сгенерировать сценарий'}
            </button>
          ) : (
            <button
              onClick={handleFindTrends}
              disabled={!isNicheValid || trendStatus === 'loading'}
              className="group relative w-full rounded-xl bg-gradient-to-r from-orange-600 to-rose-600 text-white font-bold text-lg py-4 shadow-[0_0_30px_rgba(234,88,12,0.4)] disabled:opacity-50 disabled:shadow-none hover:shadow-[0_0_50px_rgba(234,88,12,0.55)] transition-all overflow-hidden flex items-center justify-center gap-2.5 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {trendStatus === 'loading'
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Flame className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              {trendStatus === 'loading' ? 'Ищу тренды...' : '🔥 Найти трендовую идею'}
            </button>
          )}

          {/* Error — generate mode */}
          <AnimatePresence>
            {mode === 'generate' && genStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3.5 text-sm text-destructive"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{genError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error — trending mode */}
          <AnimatePresence>
            {mode === 'trending' && trendStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3.5 text-sm text-destructive"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{trendError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Trending ideas cards ── */}
          <AnimatePresence>
            {showTrendResult && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl bg-card border border-orange-500/25 shadow-xl overflow-hidden"
              >
                <div className="p-5 sm:p-6">
                  <SectionLabel
                    icon={<TrendingUp className="w-3.5 h-3.5 text-orange-400" />}
                    text="Трендовые идеи"
                  />
                  <p className="text-xs text-muted-foreground mb-3">
                    Нажми на идею — увидишь готовый сценарий
                  </p>
                  <div className="space-y-2.5">
                    {trendResult!.trending_ideas.map((idea, i) => (
                      <IdeaCard
                        key={i}
                        idea={idea}
                        index={i}
                        isSelected={selectedIdeaIdx === i}
                        isBest={i === trendResult!.best_idea_index}
                        isLoadingScript={ideaScriptStatus === 'loading' && selectedIdeaIdx === i}
                        onClick={() => handleSelectIdea(i)}
                      />
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Script loading (non-best idea) ── */}
          <AnimatePresence>
            {scriptLoading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-10 text-muted-foreground"
              >
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <p className="text-sm">Генерирую сценарий для этой идеи...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Script result (both modes) ── */}
          <AnimatePresence>
            {showScript && (
              <motion.div
                ref={resultRef}
                key="script-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-6 scroll-mt-6"
              >

                {/* Selected idea label (trending mode) */}
                {mode === 'trending' && selectedIdeaIdx !== null && trendResult && (
                  <div className="flex items-start gap-2.5 bg-orange-500/8 border border-orange-500/20 rounded-xl px-4 py-3">
                    <Flame className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      <span className="font-semibold text-orange-400">Идея #{selectedIdeaIdx + 1}:</span>{' '}
                      {trendResult.trending_ideas[selectedIdeaIdx]}
                    </p>
                  </div>
                )}

                {/* Hooks */}
                <section className="rounded-2xl bg-card border border-border/60 shadow-xl overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <SectionLabel icon={<span>🎬</span>} text="Варианты начала (Hook)" />
                    <p className="text-xs text-muted-foreground mb-3">Выбери один — нажми, чтобы отметить</p>
                    {Array.isArray(activeScript!.hooks) && activeScript!.hooks.length > 0 ? (
                      <HookCards
                        hooks={activeScript!.hooks}
                        selected={selectedHookIdx}
                        onSelect={setSelectedHookIdx}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">Варианты начала не сформированы.</p>
                    )}
                  </div>
                </section>

                {/* Shots */}
                <section className="rounded-2xl bg-card border border-border/60 shadow-xl overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <SectionLabel icon={<span>📋</span>} text="Покадровый план" />
                    {Array.isArray(activeScript!.shots) && activeScript!.shots.length > 0 ? (
                      <div className="space-y-3">
                        {activeScript!.shots.map((shot, i) => (
                          <ShotCard key={shot.id ?? i} shot={shot} index={i} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Шоты не сформированы.</p>
                    )}
                  </div>
                </section>

                {/* Music */}
                {activeScript!.music && (
                  <section className="rounded-2xl bg-card border border-border/60 shadow-xl overflow-hidden">
                    <div className="p-5 sm:p-6">
                      <SectionLabel icon={<Music className="w-3.5 h-3.5" />} text="Рекомендации по звуку" />
                      <p className="text-sm text-foreground/85 leading-relaxed">{activeScript!.music}</p>
                    </div>
                  </section>
                )}

                {/* Actions */}
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
                  Начать заново
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
