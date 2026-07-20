import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Check, RotateCcw, PenTool, Type, Loader2, AlertCircle, BookOpen, Bookmark, BookmarkCheck } from 'lucide-react';
import { useLocation } from 'wouter';

interface ScriptResult {
  hook: string;
  body: string;
  cta: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Home() {
  const [niche, setNiche] = useState('');
  const [idea, setIdea] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [script, setScript] = useState<ScriptResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const isFormValid = niche.trim().length > 0 && idea.trim().length > 0;

  const handleGenerate = async () => {
    if (!isFormValid) return;
    setStatus('loading');
    setScript(null);
    setErrorMsg('');
    setSaved(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim(), idea: idea.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.');
      }

      setScript(data as ScriptResult);
      setStatus('success');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleSave = async () => {
    if (!script || saving || saved) return;
    setSaving(true);
    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: niche.trim(),
          idea: idea.trim(),
          hook: script.hook,
          body: script.body,
          cta: script.cta,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const fullScriptText = script
    ? `🎬 HOOK (0-3 sec)\n"${script.hook}"\n\n📖 BODY (4-45 sec)\n${script.body}\n\n📣 CALL TO ACTION\n"${script.cta}"`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(fullScriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStatus('idle');
    setScript(null);
    setIdea('');
    setErrorMsg('');
    setSaved(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-background text-foreground overflow-x-hidden selection:bg-primary/30 relative z-0">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background opacity-80" />

      <div className="w-full max-w-[480px] p-6 sm:p-8 flex flex-col relative pb-32">

        {/* Header */}
        <header className="pt-8 pb-10 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-card border border-border/50 text-primary flex items-center justify-center mb-5 shadow-[0_0_30px_hsl(var(--primary)/0.25)] relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />
            <Sparkles className="w-7 h-7 relative z-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Scenarii<span className="text-primary">.ai</span></h1>
          <p className="text-muted-foreground text-base font-medium">Scripts that hit. Every time.</p>
        </header>

        {/* Form */}
        <main className="flex-1 flex flex-col gap-6">
          <div className="space-y-5">
            <div className="space-y-2.5">
              <label htmlFor="niche" className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
                <PenTool className="w-4 h-4 text-primary" />
                Your niche
              </label>
              <input
                id="niche"
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., DIY, gardening, travel, automotive"
                className="w-full bg-input/40 border border-border rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50 shadow-inner"
              />
            </div>

            <div className="space-y-2.5">
              <label htmlFor="idea" className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
                <Type className="w-4 h-4 text-primary" />
                Your video idea
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g., 3 mistakes beginners make when starting out..."
                rows={4}
                className="w-full bg-input/40 border border-border rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none placeholder:text-muted-foreground/50 shadow-inner"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!isFormValid || status === 'loading'}
            className="group relative w-full rounded-xl bg-primary text-primary-foreground font-bold text-lg py-4.5 shadow-[0_0_30px_hsl(var(--primary)/0.35)] disabled:opacity-50 disabled:shadow-none hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all overflow-hidden flex items-center justify-center gap-2.5 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            {status === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            {status === 'loading' ? 'Crafting magic...' : 'Generate Script'}
          </button>

          {/* Error state */}
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

          {/* Result area */}
          <AnimatePresence>
            {status === 'success' && script && (
              <motion.div
                ref={resultRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-col gap-4 scroll-mt-6"
              >
                <div className="relative rounded-2xl bg-card border border-border/60 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

                  <div className="p-5 sm:p-7 space-y-7">
                    {/* Hook */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-primary uppercase">
                        <span className="text-sm">🎬</span> Hook (0-3 sec)
                      </div>
                      <p className="text-xl font-bold leading-snug">"{script.hook}"</p>
                    </motion.div>

                    {/* Body */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-primary uppercase">
                        <span className="text-sm">📖</span> Body (4-45 sec)
                      </div>
                      <div className="text-muted-foreground space-y-2 leading-relaxed text-[15px]">
                        {script.body.split('\n').filter(Boolean).map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-primary uppercase">
                        <span className="text-sm">📣</span> Call to action
                      </div>
                      <p className="font-semibold italic text-foreground/90 text-lg">"{script.cta}"</p>
                    </motion.div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 bg-card hover:bg-muted/80 border border-border py-3.5 px-4 rounded-xl font-semibold transition-all text-foreground active:scale-[0.98]"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all active:scale-[0.98] border ${
                      saved
                        ? 'bg-green-500/10 border-green-500/30 text-green-500'
                        : 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary'
                    } disabled:cursor-not-allowed`}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                    {saved ? 'Saved!' : 'Save'}
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-input/40 py-3.5 px-4 rounded-xl font-semibold transition-all text-muted-foreground hover:text-foreground active:scale-[0.98]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Generate Another
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
              Generator
            </div>
            <button
              onClick={() => navigate('/my-scripts')}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
            >
              <BookOpen className="w-4 h-4" />
              My Scripts
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
