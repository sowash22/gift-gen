'use client';

import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import Image from 'next/image';
import { Nunito, Playfair_Display } from 'next/font/google';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Gift as GiftIcon,
  Link as LinkIcon,
  Moon,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const bodyFont = Nunito({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const headingFont = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] });

interface Gift {
  id: string;
  name: string;
  description: string;
  estimatedPrice?: string;
  tags?: string[];
  links?: string[];
  images?: string[];
}

type FormState = {
  recipient: string;
  occasion: string;
  vibe: string[];
};

const fadeAnim = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const parseOptions = (input: string | undefined) =>
  (input?.split(',').map((item) => item.split(':')[0].trim()).filter(Boolean) ?? []);

const Background = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#ecfeff_0,#f8fafc_45%,#fefce8_100%)] dark:bg-[radial-gradient(circle_at_20%_20%,#0f172a_0,#111827_45%,#020617_100%)]" />
    <div className="absolute -left-40 top-24 h-96 w-96 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-600/15" />
    <div className="absolute -right-36 bottom-10 h-96 w-96 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />
    <div className="absolute inset-0 opacity-[0.2] dark:opacity-[0.1] bg-[linear-gradient(to_right,#0f172a14_1px,transparent_1px),linear-gradient(to_bottom,#0f172a14_1px,transparent_1px)] bg-[size:56px_56px]" />
  </div>
);

const ImageWithFallback: FC<{ src: string; alt: string; fallbackSrc?: string; className?: string }> = ({
  src,
  alt,
  fallbackSrc,
  className,
}) => {
  const [useFallback, setUseFallback] = useState(false);
  const [hasFallbackError, setHasFallbackError] = useState(false);

  useEffect(() => {
    setUseFallback(false);
    setHasFallbackError(false);
  }, [src, fallbackSrc]);

  if (!src || (useFallback && !fallbackSrc) || hasFallbackError) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-cyan-100 text-slate-500 dark:from-slate-800 dark:to-slate-700 dark:text-slate-400 ${className ?? ''}`}
      >
        <GiftIcon className="h-12 w-12" />
      </div>
    );
  }

  if (useFallback && fallbackSrc) {
    return (
      <Image
        src={fallbackSrc}
        alt={`${alt} fallback`}
        fill
        unoptimized
        className={`object-cover ${className ?? ''}`}
        onError={() => setHasFallbackError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      className={`object-cover ${className ?? ''}`}
      onError={() => setUseFallback(true)}
    />
  );
};

export default function Home() {
  const reducedMotion = useReducedMotion();
  const { theme, setTheme } = useTheme();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({ recipient: '', occasion: '', vibe: [] });
  const [description, setDescription] = useState('');
  const [giftPages, setGiftPages] = useState<Gift[][]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [activeGift, setActiveGift] = useState<Gift | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);

  const isInitialLoad = useRef(true);

  const steps = useMemo(
    () => [
      {
        key: 'recipient',
        question: 'Who are we celebrating?',
        helper: 'Choose the person first so the ideas feel personal.',
        options: parseOptions(process.env.NEXT_PUBLIC_GIFT_RECIPIENTS),
      },
      {
        key: 'occasion',
        question: "What's the occasion?",
        helper: 'Occasion helps tune the gift intent and tone.',
        options: parseOptions(process.env.NEXT_PUBLIC_GIFT_OCCASIONS),
      },
      {
        key: 'vibe',
        question: 'What vibe should it have?',
        helper: 'Pick one or more moods to shape recommendations.',
        options: parseOptions(process.env.NEXT_PUBLIC_GIFT_VIBES),
      },
    ],
    []
  );

  const loadingTexts = ['Searching curated picks', 'Matching gift intent', 'Preparing final recommendations'];

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isGenerating, loadingTexts.length]);

  const currentStepData = steps[step];
  const isFinalStep = step === steps.length - 1;
  const canProceed = !!form.recipient && (step > 0 ? !!form.occasion : true);

  const handleSelect = (key: keyof FormState, value: string) => {
    if (key === 'vibe') {
      setForm((prev) => ({
        ...prev,
        vibe: prev.vibe.includes(value) ? prev.vibe.filter((v) => v !== value) : [...prev.vibe, value],
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
    if (step < steps.length - 1 && !hasNavigatedBack) {
      setTimeout(() => setStep((s) => s + 1), 300);
    }
  };

  const restart = () => {
    setStep(0);
    setForm({ recipient: '', occasion: '', vibe: [] });
    setDescription('');
    setGiftPages([]);
    setCurrentPage(0);
    setShowResults(false);
    setNoResults(false);
    setActiveGift(null);
    setHasNavigatedBack(false);
    isInitialLoad.current = true;
  };

  const generateGifts = async (discoverMore = false) => {
    if (isGenerating || !form.recipient || !form.occasion) return;

    setIsGenerating(true);
    setNoResults(false);
    setLoadingIndex(0);

    const previouslyGeneratedGifts = discoverMore ? giftPages.flat().map((gift) => gift.name) : [];

    try {
      const response = await fetch('/api/generate-gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          description: description.trim(),
          previouslyGeneratedGifts,
        }),
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      if (data.gifts?.length) {
        const newGifts = data.gifts.map((gift: Gift) => ({ ...gift, id: gift.id || uuidv4() }));

        if (discoverMore) {
          const nextIndex = giftPages.length;
          setGiftPages((prev) => [...prev, newGifts]);
          setCurrentPage(nextIndex);
        } else {
          setGiftPages([newGifts]);
          setCurrentPage(0);
          isInitialLoad.current = false;
        }
      } else if (!discoverMore) {
        setNoResults(true);
      }

      setShowResults(true);
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    } catch {
      if (!discoverMore) {
        setNoResults(true);
        setShowResults(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className={`relative min-h-screen overflow-x-hidden px-4 pb-12 pt-32 text-slate-900 dark:text-slate-100 sm:px-6 ${bodyFont.className}`}>
      <Background />

      <header className="fixed left-3 right-3 top-3 z-40 rounded-2xl border border-slate-200/75 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 sm:left-6 sm:right-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={restart}
            className="group inline-flex min-h-11 items-center gap-3 rounded-xl px-2 text-left transition-colors hover:text-cyan-700 dark:hover:text-cyan-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm">
              <GiftIcon className="h-5 w-5" />
            </span>
            <span>
              <span className={`${headingFont.className} block text-lg leading-none`}>GiftGarden</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Curated gift discovery</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[75vh] w-full max-w-6xl items-center justify-center">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div key="loading" {...fadeAnim} transition={{ duration: reducedMotion ? 0 : 0.35 }} className="w-full max-w-xl rounded-3xl border border-cyan-200/70 bg-white/85 p-10 text-center shadow-xl backdrop-blur-md dark:border-cyan-900/40 dark:bg-slate-900/75">
              <motion.div
                animate={reducedMotion ? {} : { rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white"
              >
                <Sparkles className="h-7 w-7" />
              </motion.div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Creating suggestions</p>
              <h2 className={`mt-3 text-2xl ${headingFont.className}`}>{loadingTexts[loadingIndex]}</h2>
            </motion.div>
          ) : showResults ? (
            <motion.div key="results" {...fadeAnim} transition={{ duration: reducedMotion ? 0 : 0.35 }} className="w-full">
              {noResults ? (
                <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white/90 p-8 text-center shadow-lg dark:border-amber-900/40 dark:bg-slate-900/75">
                  <h2 className={`text-3xl ${headingFont.className}`}>No matches yet</h2>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">Try again with the same inputs or restart and adjust your selections.</p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => generateGifts(false)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-teal-600"
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      onClick={restart}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      Restart
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-7 flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-5 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/60 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Results</p>
                      <h2 className={`mt-1 text-3xl sm:text-4xl ${headingFont.className}`}>Curated gift shortlist</h2>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Page {currentPage + 1} of {giftPages.length}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage((value) => value - 1)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </button>
                      <button
                        type="button"
                        disabled={currentPage >= giftPages.length - 1}
                        onClick={() => setCurrentPage((value) => value + 1)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => generateGifts(true)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-teal-600"
                      >
                        <Sparkles className="h-4 w-4" />
                        Discover more
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {giftPages[currentPage]?.map((gift, index) => (
                      <motion.div
                        key={gift.id}
                        initial={reducedMotion ? {} : { opacity: 0, y: 12 }}
                        animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                        transition={{ delay: reducedMotion ? 0 : index * 0.05, duration: 0.25 }}
                      >
                        <GiftCard gift={gift} onClick={() => setActiveGift(gift)} />
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-7 flex justify-center">
                    <button
                      type="button"
                      onClick={restart}
                      className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      Start over
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" {...fadeAnim} transition={{ duration: reducedMotion ? 0 : 0.35 }} className="w-full max-w-4xl">
              <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/75 sm:p-9">
                <div className="mb-8">
                  <div className="mb-4 flex items-center gap-2">
                    {steps.map((item, index) => {
                      const isActive = index === step;
                      const isDone = index < step;

                      return (
                        <div key={item.key} className={`h-2 flex-1 rounded-full ${isActive ? 'bg-cyan-500' : isDone ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      );
                    })}
                  </div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Step {step + 1} of {steps.length}</p>
                  <h1 className={`mt-3 text-3xl sm:text-4xl ${headingFont.className}`}>{currentStepData.question}</h1>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{currentStepData.helper}</p>
                </div>

                <div className="flex min-h-[220px] flex-wrap gap-3">
                  {currentStepData.options.map((value, index) => {
                    const selectedValue = form[currentStepData.key as keyof FormState];
                    const isSelected = Array.isArray(selectedValue)
                      ? selectedValue.includes(value)
                      : selectedValue === value;

                    return (
                      <motion.button
                        key={value}
                        type="button"
                        onClick={() => handleSelect(currentStepData.key as keyof FormState, value)}
                        initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                        animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                        transition={{ delay: reducedMotion ? 0 : index * 0.03, duration: 0.2 }}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                          isSelected
                            ? 'border-cyan-500 bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? <Check className="h-4 w-4" /> : null}
                        <span>{value}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-5 min-h-[130px]">
                  {isFinalStep ? (
                    <label className="block text-left">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Extra context (optional)</span>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Personality, interests, budget clues, or details about the occasion"
                        rows={4}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-cyan-900"
                      />
                    </label>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHasNavigatedBack(true);
                      setStep((value) => Math.max(0, value - 1));
                    }}
                    disabled={step === 0}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {isFinalStep ? (
                    <button
                      type="button"
                      onClick={() => generateGifts(false)}
                      disabled={isGenerating || !canProceed}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Sparkles className="h-4 w-4" />
                      Find gifts
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : hasNavigatedBack ? (
                    <button
                      type="button"
                      onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
                      disabled={!canProceed}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                      aria-label="Next step"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  ) : (
                    <span className="h-11 w-11" aria-hidden="true" />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {activeGift ? <GiftDetailModal gift={activeGift} onClose={() => setActiveGift(null)} headingFontClass={headingFont.className} /> : null}
      </AnimatePresence>
    </main>
  );
}

const GiftCard: FC<{ gift: Gift; onClick: () => void }> = ({ gift, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group block w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900"
  >
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
      <ImageWithFallback
        src={String(gift.images?.[0] ?? '')}
        fallbackSrc={gift.links?.[0] ? String(gift.links[0]) : undefined}
        alt={gift.name}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
    </div>
    <div className="p-4">
      <h3 className="line-clamp-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{gift.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{gift.description}</p>
      {gift.estimatedPrice ? (
        <p className="mt-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
          {gift.estimatedPrice}
        </p>
      ) : null}
    </div>
  </button>
);

const GiftDetailModal: FC<{ gift: Gift; onClose: () => void; headingFontClass: string }> = ({
  gift,
  onClose,
  headingFontClass,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={(event) => event.stopPropagation()}
      className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800">
        <ImageWithFallback src={String(gift.images?.[0] ?? '')} alt={gift.name} />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6">
        <h3 className={`text-3xl ${headingFontClass}`}>{gift.name}</h3>

        {gift.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {gift.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-slate-700 dark:text-slate-300">{gift.description}</p>

        {gift.estimatedPrice ? (
          <p className="mt-4 inline-flex rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200">
            Estimated price: {gift.estimatedPrice}
          </p>
        ) : null}

        {gift.links?.[0] ? (
          <a
            href={String(gift.links[0])}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 font-semibold text-white transition hover:from-cyan-600 hover:to-teal-600"
          >
            <LinkIcon className="h-4 w-4" />
            View product
          </a>
        ) : null}
      </div>
    </motion.div>
  </motion.div>
);
