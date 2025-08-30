'use client';

import { useState, useEffect, useRef, FC, useCallback } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Nunito } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Link as LinkIcon, Gift as GiftIcon, X, Check, ArrowLeft, Sun, Moon, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const nunito = Nunito({ subsets: ['latin'] });

// --- Interfaces & Types ---
interface Gift { id: string; name: string; description: string; estimatedPrice?: string; tags?: string[]; links?: string[]; images?: string[]; }

// --- Reusable Components ---
const Background = () => (
  <div className="absolute inset-0 z-0 overflow-hidden bg-white dark:bg-gray-900">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-sky-100 via-transparent to-transparent dark:from-sky-900/30" />
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-tl from-rose-100 via-transparent to-transparent dark:from-rose-900/30" />
  </div>
);

const ImageWithFallback: FC<{ src: string; alt: string; className?: string; }> = ({ src, alt, ...props }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [src]);

  if (hasError || !src) {
    return (
      <div className={`w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 ${props.className}`}>
        <GiftIcon className="w-1/4 h-1/4 opacity-50" />
      </div>
    );
  }

  return <Image src={src} alt={alt} unoptimized onError={() => setHasError(true)} {...props} layout="fill" objectFit="cover" />;
  // return <Image 
  //     src={gift.images[0]} 
  //     alt={gift.name} 
  //     width={500} 
  //     height={300} 
  //     unoptimized
  //     className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
  //     onError={(e) => {
  //       e.currentTarget.style.display = 'none';
  //     }}
  //   />
};

// --- Main Component ---
export default function Home() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ recipient: '', occasion: '', vibe: [] as string[] });
  const [generatedGifts, setGeneratedGifts] = useState<Gift[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [activeGift, setActiveGift] = useState<Gift | null>(null);
  const holdTimeout = useRef<NodeJS.Timeout | null>(null);

  const { theme, setTheme } = useTheme();

  const steps = [
    { key: 'recipient', question: "Who are we celebrating?", options: (process.env.NEXT_PUBLIC_GIFT_RECIPIENTS?.split(',').map(item => item.split(':')[0]) || []) },
    { key: 'occasion', question: "What's the special day?", options: (process.env.NEXT_PUBLIC_GIFT_OCCASIONS?.split(',').map(item => item.split(':')[0]) || []) },
    { key: 'vibe', question: "What's the vibe?", options: (process.env.NEXT_PUBLIC_GIFT_VIBES?.split(',').map(item => item.split(':')[0]) || []) },
  ];

  const handleSelect = (key: keyof typeof form, value: string) => {
    if (key === 'vibe') {
      setForm(prev => ({ ...prev, vibe: prev.vibe.includes(value) ? prev.vibe.filter(v => v !== value) : [...prev.vibe, value] }));
    } else {
      setForm(prev => ({ ...prev, [key]: value }));
      setTimeout(() => setStep(s => s + 1), 300);
    }
  };

  const generateGifts = useCallback(async () => {
    setIsGenerating(true);
    setIsHolding(false);
    setNoResults(false);
    try {
      const response = await fetch('/api/generate-gifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, description: '' }) });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      if (data.gifts && data.gifts.length > 0) {
        setGeneratedGifts(data.gifts.map((g: any) => ({ ...g, id: g.id || uuidv4() })));
        setShowResults(true);
      } else {
        setNoResults(true);
        setShowResults(true);
      }
    } catch (error) { console.error("Failed to generate gifts:", error); setNoResults(true); setShowResults(true); }
    finally { setIsGenerating(false); }
  }, [form]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (isHolding) timeoutId = setTimeout(generateGifts, 1500);
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [isHolding, generateGifts]);

  const startHold = () => { if (step === steps.length - 1) setIsHolding(true); };
  const endHold = () => setIsHolding(false);
  const prevStep = () => setStep(s => s > 0 ? s - 1 : 0);

  const restart = () => {
    setStep(0); setForm({ recipient: '', occasion: '', vibe: [] }); setGeneratedGifts([]); setShowResults(false); setActiveGift(null); setNoResults(false);
  };

  const currentStep = steps[step];
  const isFinalStep = step === steps.length - 1;

  return (
    <div className={`min-h-screen w-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 ${nunito.className}`}>
      <Background />
      <header className="fixed top-0 left-0 right-0 p-4 px-8 flex justify-between items-center z-30">
        <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={restart}>
          <GiftIcon className="text-rose-500" />
          <span className="dark:text-white">GiftGarden</span>
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 backdrop-blur-sm transition-colors">
          <Sun className="h-5 w-5 text-gray-800 dark:text-transparent scale-100 dark:scale-0 transition-all" />
          <Moon className="h-5 w-5 text-transparent dark:text-gray-200 absolute scale-0 dark:scale-100 transition-all" />
        </button>
      </header>

      <div className="relative z-10 w-full h-screen flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div key="generating" {...fadeAnim} className="text-center">
              <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="w-20 h-20 bg-gradient-to-br from-rose-400 to-sky-400 rounded-full flex items-center justify-center shadow-lg mb-6 mx-auto">
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold dark:text-white">Growing your ideas...</h2>
            </motion.div>
          ) : showResults ? (
            <motion.div key="results" {...fadeAnim} className="w-full h-full flex flex-col items-center">
              {noResults ? (
                <div className="text-center m-auto">
                  <h2 className="text-3xl font-bold mb-4">Oops!</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">We couldn't find any gifts with these options. <br/>Please try a different combination.</p>
                  <button onClick={restart} className="px-6 py-3 font-bold rounded-full bg-rose-500 text-white hover:scale-105 transition-transform">Try Again</button>
                </div>
              ) : (
                <>
                  <h2 className="text-center text-3xl font-bold pt-20 pb-8">Here's what we found...</h2>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {generatedGifts.map(gift => <GiftCard key={gift.id} gift={gift} onClick={() => setActiveGift(gift)} />)}
                  </div>
                  <button onClick={restart} className="mt-12 px-6 py-3 font-bold rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Start Over</button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" {...fadeAnim} className="w-full max-w-3xl text-center">
              <div className="relative h-24">
                <AnimatePresence mode="wait">
                  <motion.h2 key={step} {...fadeAnim} className="text-3xl md:text-4xl font-bold">
                    {currentStep.question}
                  </motion.h2>
                </AnimatePresence>
              </div>

              <div className="min-h-[300px] flex flex-col justify-center">
                <div className="flex flex-wrap justify-center gap-3">
                  {currentStep.options?.map(opt => <OptionPill key={opt} label={opt} isSelected={Array.isArray(form[currentStep.key as keyof typeof form]) ? form[currentStep.key as keyof typeof form].includes(opt) : form[currentStep.key as keyof typeof form] === opt} onClick={() => handleSelect(currentStep.key as keyof typeof form, opt)} />)}
                </div>
              </div>

              <div className="h-20">
                {isFinalStep ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">All set? Let's grow some ideas!</p>
                    <div onMouseDown={startHold} onMouseUp={endHold} onTouchStart={startHold} onTouchEnd={endHold} className="relative w-24 h-24 mx-auto cursor-pointer">
                      <AnimatePresence>{isHolding && <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="absolute inset-0 border-4 border-rose-400 rounded-full" />}</AnimatePresence>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-full h-full bg-gradient-to-br from-rose-400 to-sky-400 rounded-full flex items-center justify-center shadow-lg">
                        <Sparkles className="w-10 h-10 text-white" />
                      </motion.div>
                    </div>
                  </motion.div>
                ) : step > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button onClick={prevStep} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                  </motion.div>
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

// --- Helper & Modal Components ---
const fadeAnim = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

const OptionPill: FC<{ label: string; isSelected: boolean; onClick: () => void; }> = ({ label, isSelected, onClick }) => (
  <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} className={`px-5 py-3 text-lg font-semibold rounded-full border-2 transition-all duration-200 ${isSelected ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-rose-400 dark:hover:border-rose-400'}`}>
    {label}
  </motion.button>
);

const GiftCard: FC<{ gift: Gift; onClick: () => void; }> = ({ gift, onClick }) => (
  <motion.div onClick={onClick} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring' }} className="cursor-pointer w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
    <div className="relative w-full aspect-square"><ImageWithFallback src={gift.images?.[0] || ''} alt={gift.name} /></div>
    <div className="p-4">
      <h3 className="font-bold text-lg truncate">{gift.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{gift.estimatedPrice || ''}</p>
    </div>
  </motion.div>
);

const GiftDetailModal: FC<{ gift: Gift; onClose: () => void; }> = ({ gift, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="relative w-full max-w-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
      <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1 rounded-full bg-gray-100/50 dark:bg-gray-900/50 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"><X /></button>
      <div className="relative w-full aspect-video"><ImageWithFallback src={gift.images?.[0] || ''} alt={gift.name} /></div>
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2">{gift.name}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {gift.tags?.map(tag => <span key={tag} className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-full">{tag}</span>)}
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{gift.description}</p>
        {gift.estimatedPrice && <div className="font-semibold text-xl mb-4">{gift.estimatedPrice}</div>}
        {gift.links?.[0] && <a href={gift.links[0]} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full p-3 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors"><LinkIcon className="w-4 h-4" /> View Product</a>}
      </div>
    </motion.div>
  </motion.div>
);
