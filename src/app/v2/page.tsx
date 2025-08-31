'use client';

import { useState, useEffect, useRef, FC, useCallback } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Nunito } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift as GiftIcon, X, Sun, Moon, Link as LinkIcon, ChevronLeft, ChevronRight, Sparkles, ArrowRight, Check, Heart, Star } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const nunito = Nunito({ subsets: ['latin'], weight:['400','500','600','700'] });

// --- Interfaces & Types ---
interface Gift { id: string; name: string; description: string; estimatedPrice?: string; tags?: string[]; links?: string[]; images?: string[]; }

// --- Reusable Components ---
const Background = () => (
  <div className="absolute inset-0 z-0">
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-200/20 dark:bg-green-500/10 rounded-full blur-3xl" />
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 0.5 }} className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-200/15 dark:bg-blue-500/10 rounded-full blur-2xl" />
  </div>
);

const ImageWithFallback: FC<{ src: string; alt: string; className?: string; }> = ({ src, alt, ...props }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [src]);

  if (hasError || !src) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-green-400 dark:text-green-500 ${props.className}`}>
        <GiftIcon className="w-12 h-12 opacity-60" />
      </div>
    );
  }

  return <Image src={src} alt={alt} unoptimized onError={() => setHasError(true)} {...props} layout="fill" objectFit="cover" />;
};

// --- Main Component ---
export default function Home() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ recipient: '', occasion: '', vibe: [] as string[] });
  const [description, setDescription] = useState('');
  const [giftPages, setGiftPages] = useState<Gift[][]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [activeGift, setActiveGift] = useState<Gift | null>(null);
  const [loadingText, setLoadingText] = useState("Finding perfect gifts...");
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const { theme, setTheme } = useTheme();

  const steps = [
    { key: 'recipient', question: "Who are we celebrating?", options: (process.env.NEXT_PUBLIC_GIFT_RECIPIENTS?.split(',').map(item => item.split(':')[0]) || []) },
    { key: 'occasion', question: "What's the special occasion?", options: (process.env.NEXT_PUBLIC_GIFT_OCCASIONS?.split(',').map(item => item.split(':')[0]) || []) },
    { key: 'vibe', question: "What's the vibe?", options: (process.env.NEXT_PUBLIC_GIFT_VIBES?.split(',').map(item => item.split(':')[0]) || []) },
  ];

  const loadingTexts = ["Finding amazing gifts... 🎁", "Curating perfect matches... ✨", "Almost there... 🌟"];

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setLoadingIndex(prev => (prev + 1) % loadingTexts.length), 2500);
    return () => clearInterval(interval);
  }, [isGenerating, loadingTexts.length]);

  useEffect(() => {
    if (isGenerating) setLoadingText(loadingTexts[loadingIndex]);
  }, [loadingIndex, isGenerating, loadingTexts]);

  useEffect(() => {
    if (isInitialLoad.current || showResults === false) return;
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage, showResults]);

  const handleSelect = (key: keyof typeof form, value: string) => {
    if (key === 'vibe') {
      setForm(prev => ({ ...prev, vibe: prev.vibe.includes(value) ? prev.vibe.filter(v => v !== value) : [...prev.vibe, value] }));
    } else {
      setForm(prev => ({ ...prev, [key]: value }));
      if (step < steps.length - 1 && !hasNavigatedBack) {
        setTimeout(() => setStep(s => s + 1), 600);
      }
    }
  };

  const generateGifts = async (discoverMore = false) => {
    if (isGenerating || !form.recipient || !form.occasion) return;
    setIsGenerating(true);
    setNoResults(false);
    setLoadingIndex(0);

    const previouslyGeneratedGifts = discoverMore ? giftPages.flat().map(g => g.name) : [];

    try {
      const response = await fetch('/api/generate-gifts', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...form, description: description.trim(), previouslyGeneratedGifts })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      if (data.gifts && data.gifts.length > 0) {
        const newGifts = data.gifts.map((g: Gift) => ({ ...g, id: g.id || uuidv4() }));
        if (discoverMore) {
          const newPageIndex = giftPages.length;
          setGiftPages(prev => [...prev, newGifts]);
          setCurrentPage(newPageIndex);
        } else {
          setGiftPages([newGifts]);
          setCurrentPage(0);
          isInitialLoad.current = false;
        }
      } else {
        if (!discoverMore) setNoResults(true);
      }
      setShowResults(true);
    } catch (error) { 
      console.error("Failed to generate gifts:", error); 
      if (!discoverMore) { setNoResults(true); setShowResults(true); }
    }
    finally { setIsGenerating(false); }
  };

  const nextStep = () => setStep(s => s < steps.length - 1 ? s + 1 : s);
  const prevStep = () => { setHasNavigatedBack(true); setStep(s => s > 0 ? s - 1 : 0); };

  const restart = () => {
    setStep(0); setForm({ recipient: '', occasion: '', vibe: [] }); setDescription(''); setGiftPages([]); setCurrentPage(0); setShowResults(false); setActiveGift(null); setNoResults(false); isInitialLoad.current = true; setHasNavigatedBack(false);
  };

  const currentStepData = steps[step];
  const isFinalStep = step === steps.length - 1;
  const canProceed = form.recipient && (step > 0 ? form.occasion : true);

  return (
    <div className={`min-h-screen w-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 ${nunito.className}`}>
      <Background />
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-30 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40">
        <motion.div className="flex items-center gap-3 font-bold text-xl cursor-pointer text-green-600 dark:text-green-400" onClick={restart} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg"><GiftIcon className="w-6 h-6" /></div>
          GiftGarden
        </motion.div>
        <motion.button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-700/90 transition-all shadow-sm">
          <div className="relative w-5 h-5">
            <Sun className="absolute inset-0 text-amber-500 dark:opacity-0 dark:scale-0 transition-all duration-300" />
            <Moon className="absolute inset-0 text-blue-400 opacity-0 scale-0 dark:opacity-100 dark:scale-100 transition-all duration-300" />
          </div>
        </motion.button>
      </header>

      {!showResults && !isGenerating && (
        <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex gap-3">{steps.map((_, i) => <motion.div key={i} className={`h-3 rounded-full transition-all duration-500 ${i === step ? 'bg-green-500 w-8 shadow-lg' : i < step ? 'bg-green-300 w-3' : 'bg-gray-300 dark:bg-gray-600 w-3'}`} layoutId={`step-${i}`} />)}</div>
        </div>
      )}

      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-6 pt-40">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div key="generating" {...fadeAnim} className="text-center">
              <div className="mb-8"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"><Sparkles className="w-10 h-10 text-white" /></motion.div><motion.div key={loadingText} {...fadeAnim}><h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{loadingText}</h2></motion.div></div>
            </motion.div>
          ) : showResults ? (
            <motion.div ref={resultsRef} key="results" {...fadeAnim} className="w-full max-w-7xl">
              {noResults ? (
                <div className="text-center"><div className="w-24 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"><Heart className="w-12 h-12 text-white" /></div><h2 className="text-3xl font-bold mb-4 text-gray-700 dark:text-gray-200">Oops! Nothing found</h2><p className="text-gray-600 dark:text-gray-400 mb-8">Let's try different preferences and find something amazing!</p><button onClick={restart} className="px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full font-semibold hover:from-green-500 hover:to-emerald-600 transition-all shadow-lg">Try Again 🌟</button></div>
              ) : (
                <>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4"><h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Perfect gifts found!</h2></div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Page {currentPage + 1} of {giftPages.length} ✨</p>
                  </motion.div>
                  <motion.div key={currentPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {giftPages[currentPage]?.map((gift, index) => <motion.div key={gift.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.4 }}><GiftCard gift={gift} onClick={() => setActiveGift(gift)} /></motion.div>)}
                  </motion.div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-row justify-center gap-4 mt-12">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"><ChevronLeft/> Back</button>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= giftPages.length - 1} className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">Next <ChevronRight/></button>
                    <button onClick={restart} className="px-8 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">Restart</button>
                    <button onClick={() => generateGifts(true)} disabled={isGenerating} className="px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full font-semibold hover:from-green-500 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"><Sparkles className="w-5 h-5" />Discover More</button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" {...fadeAnim} className="w-full max-w-4xl text-center">
              <motion.div className="mb-12 h-12 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.h1 key={step} {...fadeAnim} transition={{ duration: 0.4 }} className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100">
                    {currentStepData.question}
                  </motion.h1>
                </AnimatePresence>
              </motion.div>
              
              <div className="min-h-[250px] flex flex-col justify-center">
                <motion.div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  {currentStepData.options?.map((value, index) => <motion.div key={value} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05, duration: 0.3 }}><OptionPill label={value} isSelected={Array.isArray(form[currentStepData.key as keyof typeof form]) ? form[currentStepData.key as keyof typeof form].includes(value) : form[currentStepData.key as keyof typeof form] === value} onClick={() => handleSelect(currentStepData.key as keyof typeof form, value)} /></motion.div>)}
                </motion.div>
              </div>

              <div className="h-40">
                {isFinalStep && (
                  <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.4}} className="mt-8 w-full max-w-lg mx-auto text-left">
                    <label className="font-semibold text-gray-700 dark:text-gray-300">Tell us more?</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell me more about the person and occasion, anything special?"
                      className="mt-2 w-full p-4 text-base bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-green-500 dark:focus:border-green-500 outline-none transition-colors resize-none"
                      rows={3}
                    />
                  </motion.div>
                )}
              </div>

              <div className="h-20 flex items-center justify-center gap-6">
                <motion.button onClick={prevStep} disabled={step === 0} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm ${step > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}><ChevronLeft className="w-6 h-6" /></motion.button>
                {isFinalStep ? <motion.button onClick={() => generateGifts()} disabled={isGenerating || !canProceed} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative px-10 py-4 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50 transition-all overflow-hidden"><motion.div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.8 }} /><div className="relative flex items-center gap-3"><Sparkles className="w-6 h-6" />Find Perfect Gifts<ArrowRight className="w-6 h-6" /></div></motion.button> : (hasNavigatedBack && <motion.button onClick={nextStep} disabled={!canProceed} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 dark:from-gray-200 dark:to-gray-300 text-white dark:text-gray-800 disabled:opacity-30 hover:from-gray-600 hover:to-gray-700 dark:hover:from-gray-300 dark:hover:to-gray-400 transition-all shadow-lg"><ChevronRight className="w-6 h-6" /></motion.button>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>{activeGift && <GiftDetailModal gift={activeGift} onClose={() => setActiveGift(null)} />}</AnimatePresence>
      </div>
    </div>
  );
}

// --- Animation & Component Definitions ---
const fadeAnim = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

const OptionPill: FC<{ label: string; isSelected: boolean; onClick: () => void; }> = ({ label, isSelected, onClick }) => (
  <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={onClick} className={`group relative px-6 py-4 text-lg font-medium rounded-full border-2 transition-all duration-200 shadow-sm hover:shadow-lg ${isSelected ? 'bg-gradient-to-r from-green-400 to-emerald-500 border-green-500 text-white shadow-green-200 dark:shadow-green-900/50' : 'bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-gray-700 backdrop-blur-sm'}`}>
    <div className="flex items-center gap-2"><AnimatePresence>{isSelected && <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.2 }} className="text-white"><Check className="w-4 h-4" /></motion.div>}</AnimatePresence>{label.charAt(0).toUpperCase() + label.slice(1)}</div>
  </motion.button>
);

const GiftCard: FC<{ gift: Gift; onClick: () => void; }> = ({ gift, onClick }) => (
  <motion.div onClick={onClick} whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="group cursor-pointer bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
    <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"><ImageWithFallback src={gift.images?.[0] || ''} alt={gift.name} /><div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" /><motion.div className="absolute top-4 right-4 w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm shadow-sm" initial={{ scale: 0 }} whileHover={{ scale: 1 }} transition={{ duration: 0.2 }}><ArrowRight className="w-4 h-4 text-green-500" /></motion.div></div>
    <div className="p-5"><h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-1">{gift.name}</h3><p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">{gift.description}</p>{gift.estimatedPrice && <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">{gift.estimatedPrice}</div>}</div>
  </motion.div>
);

const GiftDetailModal: FC<{ gift: Gift; onClose: () => void; }> = ({ gift, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} onClick={e => e.stopPropagation()} className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
      <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-lg"><X className="w-5 h-5 hover:text-red-500 transition-colors" /></motion.button>
      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"><ImageWithFallback src={gift.images?.[0] || ''} alt={gift.name} /></div>
      <div className="p-6"><h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2"><Heart className="w-6 h-6 text-red-500" />{gift.name}</h3>{gift.tags && gift.tags.length > 0 && <div className="flex flex-wrap gap-2 mb-5">{gift.tags.map((tag, index) => <motion.span key={tag} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">{tag}</motion.span>)}</div>}<p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{gift.description}</p>{gift.estimatedPrice && <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800"><p className="text-green-700 dark:text-green-400 font-semibold flex items-center gap-2"><Star className="w-4 h-4" />Estimated Price: {gift.estimatedPrice}</p></div>}{gift.links?.[0] && <motion.a href={gift.links[0]} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center justify-center gap-3 w-full p-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl font-semibold hover:from-green-500 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"><LinkIcon className="w-5 h-5" />View Product<ArrowRight className="w-5 h-5" /></motion.a>}</div>
    </motion.div>
  </motion.div>
);