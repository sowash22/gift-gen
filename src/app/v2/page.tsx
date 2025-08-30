'use client';

import { useState, useEffect, useRef, FC } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Inter } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Mic, Sparkles, RotateCcw, Plus, Copy, Edit, Link as LinkIcon, ArrowLeft, Gift as GiftIcon, Heart, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import FeedbackModal from '@/components/FeedbackModal';
import { v4 as uuidv4 } from 'uuid';

const inter = Inter({ subsets: ['latin'] });

// Interfaces
interface SpeechRecognitionEvent extends Event {
  results: { item(index: number): { item(index: number): { transcript: string } }[]; length: number };
}
interface SpeechRecognitionErrorEvent extends Event { error: string; }
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean; interimResults: boolean; onstart: (event: Event) => void; onresult: (event: SpeechRecognitionEvent) => void; onerror: (event: SpeechRecognitionErrorEvent) => void; onend: (event: Event) => void; start: () => void; stop: () => void;
}
interface SpeechRecognitionConstructor { new(): SpeechRecognitionInstance; }
declare global {
  interface Window {
    webkitSpeechRecognition: SpeechRecognitionConstructor;
    SpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface Gift {
  id: string;
  name: string;
  description: string;
  estimatedPrice?: string;
  tags?: string[];
  links?: string[];
  images?: string[];
  feedback: 'love' | 'like' | 'dislike' | null;
}

// Main Component
export default function Home() {
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [occasion, setOccasion] = useState('');
  const [vibe, setVibe] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [generatedGifts, setGeneratedGifts] = useState<Gift[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const recipients = process.env.NEXT_PUBLIC_GIFT_RECIPIENTS?.split(',').map(item => item.split(':')) || [];
  const occasions = process.env.NEXT_PUBLIC_GIFT_OCCASIONS?.split(',').map(item => item.split(':')) || [];
  const vibes = process.env.NEXT_PUBLIC_GIFT_VIBES?.split(',').map(item => item.split(':')) || [];
  const budgets = process.env.NEXT_PUBLIC_GIFT_BUDGETS?.split(',').map(item => item.split(':')) || [];

  const steps = [
    { key: 'recipient', question: "Who's the lucky one?", state: recipient, setState: setRecipient, options: recipients, type: 'single' },
    { key: 'occasion', question: "What's the special occasion?", state: occasion, setState: setOccasion, options: occasions, type: 'single' },
    { key: 'vibe', question: "What's the vibe?", state: vibe, setState: setVibe, options: vibes, type: 'multi' },
    { key: 'budget', question: "What's your budget?", state: budget, setState: setBudget, options: budgets, type: 'multi' },
    { key: 'description', question: "Anything else to add?", state: description, setState: setDescription, type: 'textarea' }
  ];

  const nextStep = () => setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
  const prevStep = () => setStep(prev => (prev > 0 ? prev - 1 : prev));

  const handleSingleSelect = (value: string, setState: (value: string) => void) => {
    setState(value);
    setTimeout(nextStep, 300);
  };

  const handleMultiSelect = (value: string, state: string[], setState: (value: string[]) => void) => {
    const newState = state.includes(value) ? state.filter(v => v !== value) : [...state, value];
    setState(newState);
  };

  const startListening = () => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results).map(result => result[0].transcript).join('');
        setDescription(transcript);
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => console.error('Speech recognition error:', event.error);
      recognition.onend = () => setIsListening(false);
      recognition.start();
      recognitionRef.current = recognition;
    } else {
      setToast({ message: 'Speech recognition not supported', type: 'error' });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const generateGifts = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, occasion, vibe, budget, description: description.trim(), previouslyGeneratedGifts: generatedGifts.map(g => g.name) }),
      });
      if (!response.ok) throw new Error('Failed to generate gifts');
      const data = await response.json();
      const newGifts = data.gifts.map((gift: any) => ({
        ...gift, id: gift.id || uuidv4(), feedback: null,
        tags: Array.isArray(gift.tags) ? gift.tags : [],
        links: Array.isArray(gift.links) ? gift.links : [],
        images: Array.isArray(gift.images) ? gift.images : [],
      }));
      setGeneratedGifts(newGifts);
      setStep(steps.length); // Move to results view
    } catch (error) {
      console.error('Error generating gifts:', error);
      setToast({ message: 'Failed to generate gifts. Please try again.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const restart = () => {
    setRecipient(''); setOccasion(''); setVibe([]); setBudget([]); setDescription(''); setGeneratedGifts([]); setStep(0);
    analytics.trackButtonClick('restart', 'results');
  };

  const progress = (step / (steps.length - 1)) * 100;

  return (
    <main className={`relative min-h-screen w-full overflow-hidden bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center justify-center p-4 sm:p-6 ${inter.className}`}>
      <div className="absolute inset-0 z-0 opacity-50">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-rose-100 to-transparent dark:from-rose-900/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-sky-100 to-transparent dark:from-sky-900/50 rounded-full blur-3xl"></div>
      </div>

      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={restart}>
          <GiftIcon className="w-6 h-6 text-rose-500" />
          <span className="font-bold text-lg">GiftFinder</span>
        </div>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {resolvedTheme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </header>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div key="generating" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center flex flex-col items-center z-10">
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-24 h-24 bg-gradient-to-br from-rose-400 to-sky-400 rounded-full flex items-center justify-center shadow-lg mb-6">
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Finding the perfect gifts...</h2>
            <p className="text-gray-500 dark:text-gray-400">Our AI is working its magic!</p>
          </motion.div>
        ) : generatedGifts.length > 0 ? (
          <ResultsScreen key="results" gifts={generatedGifts} onRestart={restart} />
        ) : (
          <motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="w-full max-w-2xl z-10">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-rose-500">Step {step + 1} of {steps.length}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div className="bg-gradient-to-r from-rose-400 to-sky-400 h-2 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">{steps[step].question}</h2>

            <div className="min-h-[200px]">
              {steps[step].type === 'textarea' ? (
                <div className="relative">
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., 'Loves hiking, sci-fi movies, and spicy food...'" className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-rose-400 outline-none resize-none min-h-[120px]" rows={4} />
                  <button onClick={isListening ? stopListening : startListening} className={`absolute right-3 bottom-3 p-2 rounded-full transition-colors ${isListening ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {steps[step].options.map(([value, emoji]) => {
                    const isSelected = steps[step].type === 'single' ? steps[step].state === value : (steps[step].state as string[]).includes(value);
                    return (
                      <motion.button
                        key={value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => steps[step].type === 'single' ? handleSingleSelect(value, steps[step].setState as (v: string) => void) : handleMultiSelect(value, steps[step].state as string[], steps[step].setState as (v: string[]) => void)}
                        className={`p-4 rounded-xl text-center font-semibold border-2 transition-all duration-200 ${isSelected ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-rose-400 dark:hover:border-rose-400'}`}>
                        <span className="text-3xl mb-2 block">{emoji}</span>
                        <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-12">
              <button onClick={prevStep} disabled={step === 0} className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors">
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              {steps[step].type !== 'single' && (
                <button onClick={step === steps.length - 1 ? generateGifts : nextStep} className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg hover:scale-105 transition-transform">
                  {step === steps.length - 1 ? 'Find Gifts' : 'Next'} <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// Results Screen Component
const ResultsScreen: FC<{ gifts: Gift[], onRestart: () => void }> = ({ gifts, onRestart }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextGift = () => setCurrentIndex(prev => (prev + 1) % gifts.length);
  const prevGift = () => setCurrentIndex(prev => (prev - 1 + gifts.length) % gifts.length);

  return (
    <motion.div key="results-screen" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl flex flex-col items-center z-10">
      <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-center">We found some gifts for you!</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Swipe through or use the arrows to see your personalized gift ideas.</p>
      
      <div className="w-full flex items-center justify-center gap-2 sm:gap-4">
        <button onClick={prevGift} className="p-2 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-md">
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="relative w-full max-w-sm h-[450px] overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -300, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -100) nextGift();
                else if (info.offset.x > 100) prevGift();
              }}
              className="absolute w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
              <GiftCard gift={gifts[currentIndex]} />
            </motion.div>
          </AnimatePresence>
        </div>

        <button onClick={nextGift} className="p-2 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-md">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-8">
        <button onClick={onRestart} className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          <RotateCcw className="w-5 h-5" /> Start Over
        </button>
      </div>
    </motion.div>
  );
};

// Gift Card Component
const GiftCard: FC<{ gift: Gift }> = ({ gift }) => {
  return (
    <>
      <div className="w-full h-1/2 relative">
        {gift.images && gift.images.length > 0 ? (
        //  <Image src={gift.images[0]} alt={gift.name} layout="fill" objectFit="cover" className="bg-gray-100 dark:bg-gray-700" />
            <Image 
                src={gift.images[0]} 
                alt={gift.name} 
                width={500} 
                height={300} 
                unoptimized
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <GiftIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-xl mb-1">{gift.name}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-3">{gift.description}</p>
          {gift.estimatedPrice && <div className="font-semibold text-lg mb-3">{gift.estimatedPrice}</div>}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {gift.tags?.map(tag => <span key={tag} className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-full">{tag}</span>)}
        </div>
        {gift.links && gift.links.length > 0 && (
          <a href={gift.links[0]} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full p-3 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors">
            <LinkIcon className="w-4 h-4" /> View Product
          </a>
        )}
      </div>
    </>
  );
};
