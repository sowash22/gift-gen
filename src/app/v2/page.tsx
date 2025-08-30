'use client';

import { useState, useEffect, useRef, FC, useCallback } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Nunito } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift as GiftIcon, X, Sun, Moon, Link as LinkIcon, ChevronLeft, ChevronRight, Sparkles, ArrowRight, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const nunito = Nunito({ subsets: ['latin'], weight:['400','500','600','700'] });

// --- Interfaces & Types ---
interface Gift { id: string; name: string; description: string; estimatedPrice?: string; tags?: string[]; links?: string[]; images?: string[]; }

// --- Clean Background ---
const Background = () => (
  <div className="absolute inset-0 z-0">
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 2 }}
      className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-200/20 dark:bg-green-500/10 rounded-full blur-3xl" 
    />
  </div>
);

const ImageWithFallback: FC<{ src: string; alt: string; className?: string; }> = ({ src, alt, ...props }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [src]);

  if (hasError || !src) {
    return (
      <div className={`w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 ${props.className}`}>
        <GiftIcon className="w-8 h-8 opacity-40" />
      </div>
    );
  }

  return <Image src={src} alt={alt} unoptimized onError={() => setHasError(true)} {...props} layout="fill" objectFit="cover" />;
};

// --- Main Component ---
export default function Home() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ recipient: '', occasion: '', vibe: [] as string[] });
  const [generatedGifts, setGeneratedGifts] = useState<Gift[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [activeGift, setActiveGift] = useState<Gift | null>(null);
  const [loadingText, setLoadingText] = useState("Finding perfect gifts...");
  const [loadingIndex, setLoadingIndex] = useState(0);

  const { theme, setTheme } = useTheme();

  const steps = [
    { key: 'recipient', question: "Who is this gift for?", options: (process.env.NEXT_PUBLIC_GIFT_RECIPIENTS?.split(',').map(item => item.split(':')[0]) || []) },
    { key: 'occasion', question: "What's the occasion?", options: (process.env.NEXT_PUBLIC_GIFT_OCCASIONS?.split(',').map(item => item.split(':')[0]) || []) },
    { key: 'vibe', question: "What style do they love?", options: (process.env.NEXT_PUBLIC_GIFT_VIBES?.split(',').map(item => item.split(':')[0]) || []) },
  ];

  const loadingTexts = [
    "Finding perfect gifts...",
    "Curating recommendations...",
    "Almost ready...",
    "Finalizing selection...",
  ];

  // Rotate loading text every 3 seconds
  useEffect(() => {
    if (!isGenerating) return;
    
    const interval = setInterval(() => {
      setLoadingIndex(prev => (prev + 1) % loadingTexts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isGenerating, loadingTexts.length]);

  // Update loading text when index changes
  useEffect(() => {
    if (isGenerating) {
      setLoadingText(loadingTexts[loadingIndex]);
    }
  }, [loadingIndex, isGenerating, loadingTexts]);

  const handleSelect = (key: keyof typeof form, value: string) => {
    if (key === 'vibe') {
      setForm(prev => ({ ...prev, vibe: prev.vibe.includes(value) ? prev.vibe.filter(v => v !== value) : [...prev.vibe, value] }));
    } else {
      setForm(prev => ({ ...prev, [key]: value }));
      // Auto-advance for single-select fields
      setTimeout(() => {
        if (step < steps.length - 1) {
          setStep(s => s + 1);
        }
      }, 400);
    }
  };

  const generateGifts = async () => {
    if (isGenerating || !form.recipient || !form.occasion) return;
    setIsGenerating(true);
    setNoResults(false);
    setLoadingIndex(0);
    setLoadingText(loadingTexts[0]);
    
    try {
      const response = await fetch('/api/generate-gifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, description: '' }) });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      if (data.gifts && data.gifts.length > 0) {
        setGeneratedGifts(data.gifts.map((g: any) => ({ ...g, id: g.id || uuidv4() })));
      } else {
        setNoResults(true);
      }
      setShowResults(true);
    } catch (error) { console.error("Failed to generate gifts:", error); setNoResults(true); setShowResults(true); }
    finally { setIsGenerating(false); }
  };

  const nextStep = () => setStep(s => s < steps.length - 1 ? s + 1 : s);
  const prevStep = () => setStep(s => s > 0 ? s - 1 : 0);

  const restart = () => {
    setStep(0); setForm({ recipient: '', occasion: '', vibe: [] }); setGeneratedGifts([]); setShowResults(false); setActiveGift(null); setNoResults(false);
  };

  const currentStep = steps[step];
  const isFinalStep = step === steps.length - 1;
  const canProceed = form.recipient && (step > 0 ? form.occasion : true);

  return (
    <div className={`min-h-screen w-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 ${nunito.className}`}>
      <Background />
      
      {/* Clean Header */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-30 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30">
        <motion.div 
          className="flex items-center gap-3 font-bold text-xl cursor-pointer text-green-700 dark:text-green-400" 
          onClick={restart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <GiftIcon className="w-5 h-5" />
          </div>
          GiftGarden
        </motion.div>
        
        <motion.button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-11 h-11 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all shadow-sm"
        >
          <Sun className="w-5 h-5 text-amber-500 dark:opacity-0 dark:scale-0 transition-all duration-300" />
          <Moon className="w-5 h-5 text-blue-400 absolute opacity-0 scale-0 dark:opacity-100 dark:scale-100 transition-all duration-300" />
        </motion.button>
      </header>

      {/* Progress Indicator */}
      {!showResults && !isGenerating && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-green-500 w-6' : i < step ? 'bg-green-300' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                layoutId={`step-${i}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-6 pt-32">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div 
              key="generating" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="mb-8 relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-4"
                >
                  <div className="w-full h-full rounded-full border-4 border-green-200 dark:border-green-800 border-t-green-500 dark:border-t-green-400" />
                </motion.div>
                <motion.div
                  key={loadingText}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{loadingText}</h2>
                </motion.div>
              </div>
            </motion.div>
          ) : showResults ? (
            <motion.div 
              key="results" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="w-full max-w-7xl"
            >
              {noResults ? (
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4 text-gray-700 dark:text-gray-200">No gifts found</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">Let's try different preferences</p>
                  <button 
                    onClick={restart} 
                    className="px-8 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors shadow-lg"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                  >
                    <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                      Perfect gifts for you
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {generatedGifts.length} thoughtfully curated recommendations
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {generatedGifts.map((gift, index) => (
                      <motion.div
                        key={gift.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                      >
                        <GiftCard gift={gift} onClick={() => setActiveGift(gift)} />
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <button 
                      onClick={restart} 
                      className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    >
                      Find Different Gifts
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="form" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="w-full max-w-4xl text-center"
            >
              <motion.div className="mb-16">
                <AnimatePresence mode="wait">
                  <motion.h1 
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl md:text-5xl font-bold mb-4 text-gray-800 dark:text-gray-100"
                  >
                    {currentStep.question}
                  </motion.h1>
                </AnimatePresence>
                
                {/* {step === 0 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-gray-600 dark:text-gray-400"
                  >
                    Let's find the perfect gift together
                  </motion.p>
                )} */}
              </motion.div>

              <div className="mb-16">
                <motion.div 
                  className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {currentStep.options?.map((value, index) => (
                    <motion.div
                      key={value}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <OptionPill 
                        label={value} 
                        isSelected={
                          Array.isArray(form[currentStep.key as keyof typeof form]) 
                            ? form[currentStep.key as keyof typeof form].includes(value) 
                            : form[currentStep.key as keyof typeof form] === value
                        } 
                        onClick={() => handleSelect(currentStep.key as keyof typeof form, value)} 
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-6">
                <motion.button 
                  onClick={prevStep} 
                  disabled={step === 0}
                  whileHover={step > 0 ? { scale: 1.05 } : {}}
                  whileTap={step > 0 ? { scale: 0.95 } : {}}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>

                {isFinalStep ? (
                  <motion.button 
                    onClick={generateGifts} 
                    disabled={isGenerating || !canProceed}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5" />
                      Find My Gifts
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </motion.button>
                ) : (
                  <motion.button 
                    onClick={nextStep} 
                    disabled={!canProceed}
                    whileHover={canProceed ? { scale: 1.05 } : {}}
                    whileTap={canProceed ? { scale: 0.95 } : {}}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 disabled:opacity-30 hover:bg-gray-700 dark:hover:bg-gray-300 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{activeGift && <GiftDetailModal gift={activeGift} onClose={() => setActiveGift(null)} />}</AnimatePresence>
      </div>
    </div>
  );
}

// --- Refined Components ---
const OptionPill: FC<{ label: string; isSelected: boolean; onClick: () => void; }> = ({ label, isSelected, onClick }) => (
  <motion.button 
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.98 }} 
    onClick={onClick} 
    className={`relative px-6 py-4 text-lg font-medium rounded-2xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
      isSelected 
        ? 'bg-green-500 border-green-500 text-white shadow-green-200 dark:shadow-green-900/50' 
        : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 backdrop-blur-sm'
    }`}
  >
    <div className="flex items-center gap-2">
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Check className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </div>
  </motion.button>
);

const GiftCard: FC<{ gift: Gift; onClick: () => void; }> = ({ gift, onClick }) => (
  <motion.div 
    onClick={onClick} 
    whileHover={{ y: -4, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300"
  >
    <div className="relative w-full aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900">
      <ImageWithFallback src={gift.images?.[0] || ''} alt={gift.name} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
    
    <div className="p-5">
      <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-1">
        {gift.name}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
        {gift.description}
      </p>
      {gift.estimatedPrice && (
        <p className="text-green-600 dark:text-green-400 font-semibold mt-2">
          {gift.estimatedPrice}
        </p>
      )}
    </div>
  </motion.div>
);

const GiftDetailModal: FC<{ gift: Gift; onClose: () => void; }> = ({ gift, onClose }) => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }} 
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
    onClick={onClose}
  >
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      exit={{ scale: 0.9, opacity: 0 }} 
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={e => e.stopPropagation()} 
      className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700"
    >
      <motion.button 
        onClick={onClose} 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
      >
        <X className="w-5 h-5" />
      </motion.button>
      
      <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-900">
        <ImageWithFallback src={gift.images?.[0] || ''} alt={gift.name} />
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">
          {gift.name}
        </h3>
        
        {gift.tags && gift.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {gift.tags.map((tag, index) => (
              <motion.span 
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        )}
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {gift.description}
        </p>
        
        {gift.estimatedPrice && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p className="text-green-700 dark:text-green-400 font-semibold">
              Estimated Price: {gift.estimatedPrice}
            </p>
          </div>
        )}
        
        {gift.links?.[0] && (
          <motion.a 
            href={gift.links[0]} 
            target="_blank" 
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-3 w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
          >
            <LinkIcon className="w-5 h-5" />
            View Product
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        )}
      </div>
    </motion.div>
  </motion.div>
);