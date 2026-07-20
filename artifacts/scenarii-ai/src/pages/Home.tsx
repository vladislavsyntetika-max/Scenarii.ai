import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Check, RotateCcw, PenTool, Type, Loader2 } from 'lucide-react';

export default function Home() {
  const [niche, setNiche] = useState('');
  const [idea, setIdea] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const isFormValid = niche.trim().length > 0 && idea.trim().length > 0;

  const handleGenerate = () => {
    if (!isFormValid) return;
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 1500);
  };

  const handleCopy = () => {
    const script = `🎬 HOOK (0-3 sec)
"Did you know most people are doing this completely wrong?"

📖 BODY (4-45 sec)
Here's what the pros don't tell you about ${niche}...
Start with the basics — break it down simply.
Then level up with a counter-intuitive trick.
The secret most beginners miss? Consistency over intensity.

📣 CALL TO ACTION
"Follow for more ${niche} tips. Drop a comment — what should I cover next?"`;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStatus('idle');
    setIdea('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-background text-foreground overflow-x-hidden selection:bg-primary/30 relative z-0">
      {/* Background glow effect */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background opacity-80" />
      
      <div className="w-full max-w-[480px] p-6 sm:p-8 flex flex-col relative pb-24">
        
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
                data-testid="input-niche"
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
                data-testid="input-idea"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!isFormValid || status === 'loading'}
            className="group relative w-full rounded-xl bg-primary text-primary-foreground font-bold text-lg py-4.5 shadow-[0_0_30px_hsl(var(--primary)/0.35)] disabled:opacity-50 disabled:shadow-none hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all overflow-hidden flex items-center justify-center gap-2.5 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
            data-testid="button-generate"
          >
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {status === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            {status === 'loading' ? 'Crafting magic...' : 'Generate Script'}
          </button>

          {/* Result Area */}
          <AnimatePresence>
            {status === 'success' && (
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
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-primary uppercase">
                        <span className="text-sm">🎬</span> Hook (0-3 sec)
                      </div>
                      <p className="text-xl font-bold leading-snug">
                        "Did you know most people are doing this completely wrong?"
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-primary uppercase">
                        <span className="text-sm">📖</span> Body (4-45 sec)
                      </div>
                      <div className="text-muted-foreground space-y-3 leading-relaxed text-[15px]">
                        <p>Here's what the pros don't tell you about <span className="text-foreground font-semibold">{niche}</span>...</p>
                        <p>Start with the basics — break it down simply.</p>
                        <p>Then level up with a counter-intuitive trick.</p>
                        <p>The secret most beginners miss? Consistency over intensity.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-primary uppercase">
                        <span className="text-sm">📣</span> Call to action
                      </div>
                      <p className="font-semibold italic text-foreground/90 text-lg">
                        "Follow for more {niche} tips. Drop a comment — what should I cover next?"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 bg-card hover:bg-muted/80 border border-border py-3.5 px-4 rounded-xl font-semibold transition-all text-foreground active:scale-[0.98]"
                    data-testid="button-copy"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Script'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 bg-transparent hover:bg-input/40 py-3.5 px-4 rounded-xl font-semibold transition-all text-muted-foreground hover:text-foreground active:scale-[0.98]"
                    data-testid="button-reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Generate Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}