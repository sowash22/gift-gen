'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import Confetti from 'react-confetti';
import { Moon, Sun, Mic, Sparkles, RotateCcw, Plus, Copy, Edit, Link as LinkIcon } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import FeedbackModal from '@/components/FeedbackModal';
import { v4 as uuidv4 } from 'uuid';

interface SpeechRecognitionEvent extends Event {
  results: {
    item(index: number): {
      item(index: number): {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

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

export default function Home() {
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const recipients = process.env.NEXT_PUBLIC_GIFT_RECIPIENTS?.split(',').map(item => item.split(':')) || [];
  const occasions = process.env.NEXT_PUBLIC_GIFT_OCCASIONS?.split(',').map(item => item.split(':')) || [];
  const vibes = process.env.NEXT_PUBLIC_GIFT_VIBES?.split(',').map(item => item.split(':')) || [];
  const budgets = process.env.NEXT_PUBLIC_GIFT_BUDGETS?.split(',').map(item => item.split(':')) || [];

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
    };
    
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from({ length: event.results.length }, (_, i) => 
          event.results.item(i).item(0).transcript
        ).join('');
        setDescription(results);
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setToast({ message: 'Error with speech recognition', type: 'error' });
        setIsListening(false);
      };
      
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
      recognition.start();
    } else {
      setToast({ message: 'Speech recognition not supported', type: 'error' });
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    analytics.trackButtonClick('toggle_theme', 'header');
  };

  const generateGifts = async () => {
    setIsGenerating(true);
    
    try {
      const requestBody = {
        recipient,
        occasion,
        vibe,
        budget,
        description: description.trim(),
        previouslyGeneratedGifts: generatedGifts.map(gift => gift.name)
      };
      
      const response = await fetch('/api/generate-gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) throw new Error('Failed to generate gifts');
      
      const data = await response.json();
      
      const newGifts = data.gifts.map((gift: any) => ({
        id: gift.id || uuidv4(),
        name: gift.name,
        description: gift.description,
        estimatedPrice: gift.estimatedPrice,
        tags: Array.isArray(gift.tags) ? gift.tags : [],
        links: Array.isArray(gift.links) ? gift.links : [],
        images: Array.isArray(gift.images) ? gift.images : [],
        feedback: null
      }));
      
      setGeneratedGifts(newGifts);

      if (process.env.NEXT_PUBLIC_SHOW_CONFETTI === 'true' && !sessionStorage.getItem('confetti_shown')) {
        setShowConfetti(true);
        sessionStorage.setItem('confetti_shown', 'true');
        setTimeout(() => setShowConfetti(false), 5000);
      }
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('Error generating gifts:', error);
      setToast({ message: 'Failed to generate gifts. Please try again.', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: 'Copied to clipboard!', type: 'success' });
    setTimeout(() => setToast(null), 2000);
  };

  const restart = () => {
    setRecipient('');
    setOccasion('');
    setVibe([]);
    setBudget([]);
    setDescription('');
    setGeneratedGifts([]);
    analytics.trackButtonClick('restart', 'results');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-rose-50/30 via-orange-50/20 to-amber-50/40 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950">
      {showConfetti && windowSize.width > 0 && windowSize.height > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={200} recycle={false} gravity={0.3} colors={['#ff69b4', '#ff1493', '#ffc0cb', '#ff6347', '#ffa500', '#9370db']} />
        </div>
      )}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-pink-300/10 to-rose-300/10 dark:from-pink-500/5 dark:to-rose-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-300/10 to-amber-300/10 dark:from-orange-500/5 dark:to-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-r from-yellow-300/10 to-orange-300/10 dark:from-yellow-500/5 dark:to-orange-500/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {toast && (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-sm font-medium shadow-2xl backdrop-blur-md transition-all duration-500 border ${toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400/20 shadow-emerald-500/25' : 'bg-red-500/90 text-white border-red-400/20 shadow-red-500/25'}`}>
          <div className="flex items-center justify-between gap-2">
            <span>{toast.type === 'success' ? '✨' : '⚠️'}</span>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-4 font-bold hover:text-gray-200">✕</button>
          </div>
        </div>      
      )}
      
      <div className="max-w-lg mx-auto px-6 py-12 relative z-10">
        <div className="absolute top-6 right-6">
          <button onClick={toggleTheme} className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-amber-600 dark:text-amber-400 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20 transform hover:scale-110 border border-white/20 dark:border-slate-700/50" aria-label="Toggle theme">
            {resolvedTheme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 rounded-3xl shadow-2xl shadow-pink-500/25 mb-8 transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <span className="text-3xl transform -rotate-6">🎁</span>
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 dark:from-rose-300 dark:via-pink-300 dark:to-purple-300 bg-clip-text text-transparent mb-4 leading-tight">Gift Generator</h1>
          <p className="text-lg text-slate-600/80 dark:text-slate-300/80 max-w-md mx-auto leading-relaxed font-medium">Find the perfect gift for any occasion</p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-8">
            <ToggleButtonGroup label="Who is this for?" value={recipient} onChange={setRecipient} options={recipients} />
            <ToggleButtonGroup label="Occasion" value={occasion} onChange={setOccasion} options={occasions} />
            <MultiSelectToggleButtonGroup label="Vibe" values={vibe} onChange={setVibe} options={vibes} />
            <MultiSelectToggleButtonGroup label="Budget" values={budget} onChange={setBudget} options={budgets} />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-lg font-bold text-slate-800 dark:text-slate-100">Describe the person or occasion</label>
              <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 text-amber-700 dark:text-amber-300 rounded-full shadow-sm">Optional</span>
            </div>
            <div className="relative group">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., 'My friend who loves hiking and reading...'" className="w-full px-6 py-6 pb-16 border-0 rounded-3xl outline-none focus:ring-4 focus:ring-pink-500/20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 resize-none min-h-[140px] text-base leading-relaxed transition-all duration-300 shadow-xl shadow-pink-500/5 hover:shadow-2xl hover:shadow-pink-500/10 group-focus-within:shadow-2xl group-focus-within:shadow-pink-500/15 border border-white/20 dark:border-slate-700/50" rows={4} />
              <button onClick={isListening ? stopListening : startListening} className={`absolute right-4 bottom-4 p-3 rounded-2xl transition-all duration-300 shadow-lg transform hover:scale-110 ${isListening ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/30 animate-pulse' : 'bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-600 dark:text-slate-300 hover:from-pink-200 hover:to-rose-200 dark:hover:from-pink-800 dark:hover:to-rose-800'}`} title={isListening ? 'Stop listening' : 'Start voice input'}>
                <Mic className="w-4 h-4" />
              </button>
              {isListening && <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-4 py-2 text-sm font-bold bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300 rounded-2xl border border-purple-200 dark:border-purple-800/50 shadow-xl backdrop-blur-md"><span>Listening...</span></div>}
            </div>
          </div>

          <button onClick={generateGifts} disabled={isGenerating} className={`group w-full py-6 px-8 rounded-3xl font-bold text-xl transition-all duration-500 transform hover:scale-105 ${isGenerating ? 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-2xl shadow-pink-500/30 hover:shadow-3xl hover:shadow-pink-500/40'}`}>
            {isGenerating ? <div className="flex items-center justify-center gap-4"><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div><span>Finding perfect gifts...</span></div> : <span className="flex items-center justify-center gap-3 group-hover:gap-4 transition-all duration-300"><Sparkles className="w-6 h-6 group-hover:animate-pulse" />Generate Gifts</span>}
          </button>
        </div>

        <div ref={resultsRef}></div>

        {generatedGifts.length > 0 && (
          <div className="space-y-10 mt-16">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-3xl shadow-2xl shadow-emerald-500/25 mb-4 animate-bounce"><span className="text-2xl">🎉</span></div>
              <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent mb-4">Here are some great gift ideas!</h2>
            </div>
            <div className="space-y-6">
              {generatedGifts.map((gift) => (
                <div key={gift.id} className="group bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/30 dark:border-slate-700/50 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
                  {gift.images && gift.images.length > 0 && (
                    <div className="mb-4 overflow-hidden rounded-2xl">
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
                    </div>
                  )}
                  <h3 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-indigo-700 to-purple-700 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent mb-2 leading-tight">{gift.name}</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">{gift.description}</p>
                  
                  {gift.tags && gift.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {gift.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {gift.estimatedPrice && (
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{gift.estimatedPrice}</div>
                  )}
                  
                  {gift.links && gift.links.length > 0 && (
                    <div className="mt-4 mb-4">
                      <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Where to buy:</h4>
                      <div className="flex flex-col gap-2">
                        {gift.links.map((link, index) => (
                          <a 
                            key={index} 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                          >
                            <LinkIcon className="w-4 h-4 mr-2 shrink-0" />
                            <span className="truncate">{link}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-center mt-6">
                    <button onClick={() => copyToClipboard(gift.name)} className="group/btn inline-flex items-center px-3 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110">
                      <Copy className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />Copy
                    </button>
                    <button onClick={() => setShowFeedbackModal(true)} className="group/btn inline-flex items-center px-3 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110">
                      <Edit className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />Feedback
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center pt-12 flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={restart} className="group px-8 py-4 bg-gradient-to-r from-slate-500 to-gray-500 text-white rounded-2xl transition-all duration-500 transform hover:scale-105 font-bold shadow-2xl shadow-slate-500/30 hover:shadow-3xl hover:shadow-slate-500/40 border border-white/20">
                <span className="flex items-center justify-center gap-3 group-hover:gap-4 transition-all duration-300"><RotateCcw className="w-5 h-5 group-hover:animate-spin" />Restart</span>
              </button>
              <button onClick={generateGifts} disabled={isGenerating} className={`group px-8 py-4 rounded-2xl font-bold transition-all duration-500 transform hover:scale-105 ${isGenerating ? 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-2xl shadow-pink-500/30 hover:shadow-3xl hover:shadow-pink-500/40'}`}>
                {isGenerating ? <div className="flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Finding More...</span></div> : <span className="flex items-center justify-center gap-3 group-hover:gap-4 transition-all duration-300"><Plus className="w-5 h-5 group-hover:animate-pulse" />Show More!</span>}
              </button>
            </div>
          </div>
        )}
      </div>
      <FeedbackModal isOpen={showFeedbackModal} onClose={({ feedbackSubmitted = true }: { feedbackSubmitted?: boolean } = {}) => { setShowFeedbackModal(false); if (feedbackSubmitted) { setToast({ message: 'Thanks for the feedback ❤️', type: 'success' }); setTimeout(() => setToast(null), 2000); } }} />
    </div>
  );
}

function ToggleButtonGroup({ label, value, onChange, options }: { label: string, value: string, onChange: (value: string) => void, options: string[][] }) {
  return (
    <div>
      <label className="block text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{label}</label>
      <div className="flex flex-wrap gap-3">
        {options.map(([optionValue, emoji]) => (
          <button
            key={optionValue}
            onClick={() => onChange(optionValue)}
            className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold border-2 transition-all duration-300 transform hover:scale-105 ${
              value === optionValue
                ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white border-transparent shadow-lg shadow-pink-500/20'
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>{emoji}</span>
            <span>{optionValue.charAt(0).toUpperCase() + optionValue.slice(1)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelectToggleButtonGroup({ label, values, onChange, options }: { label: string, values: string[], onChange: (values: string[]) => void, options: string[][] }) {
  const handleToggle = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter((v) => v !== optionValue));
    } else {
      onChange([...values, optionValue]);
    }
  };

  return (
    <div>
      <label className="block text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{label}</label>
      <div className="flex flex-wrap gap-3">
        {options.map(([optionValue, emoji]) => (
          <button
            key={optionValue}
            onClick={() => handleToggle(optionValue)}
            className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold border-2 transition-all duration-300 transform hover:scale-105 ${
              values.includes(optionValue)
                ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white border-transparent shadow-lg shadow-pink-500/20'
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>{emoji}</span>
            <span>{optionValue.charAt(0).toUpperCase() + optionValue.slice(1)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}