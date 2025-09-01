// /* eslint-disable react-hooks/exhaustive-deps */
// 'use client';

// import { useState, useEffect, FC } from 'react';
// import Image from 'next/image';
// import { useTheme } from 'next-themes';
// import { Nunito } from 'next/font/google';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Gift as GiftIcon, X, Sun, Moon, Link as LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react';
// import { v4 as uuidv4 } from 'uuid';

// const nunito = Nunito({ subsets: ['latin'], weight:['400','600','700'] });

// // --- Interfaces & Types ---
// interface Gift { id: string; name: string; description: string; estimatedPrice?: string; tags?: string[]; links?: string[]; images?: string[]; }

// // --- Reusable Components ---
// const Background = () => (
//   <div className="absolute inset-0 z-0 overflow-hidden bg-emerald-50 dark:bg-gray-900">
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-lime-200/50 via-transparent to-transparent dark:from-lime-900/30 rounded-full blur-3xl" />
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-teal-200/50 via-transparent to-transparent dark:from-teal-900/30 rounded-full blur-3xl" />
//   </div>
// );

// const ImageWithFallback: FC<{ src: string; alt: string; className?: string; }> = ({ src, alt, ...props }) => {
//   const [hasError, setHasError] = useState(false);
//   useEffect(() => { setHasError(false); }, [src]);

//   if (hasError || !src) {
//     return (
//       <div className={`w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 ${props.className}`}>
//         <GiftIcon className="w-1/4 h-1/4 opacity-50" />
//       </div>
//     );
//   }

//   return <Image src={src} alt={alt} unoptimized onError={() => setHasError(true)} {...props} layout="fill" objectFit="cover" />;
// };

// // --- Main Component ---
// export default function Home() {
//   const [step, setStep] = useState(0);
//   const [form, setForm] = useState({ recipient: '', occasion: '', vibe: [] as string[] });
//   const [generatedGifts, setGeneratedGifts] = useState<Gift[]>([]);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [showResults, setShowResults] = useState(false);
//   const [noResults, setNoResults] = useState(false);
//   const [activeGift, setActiveGift] = useState<Gift | null>(null);
//   const [loadingText, setLoadingText] = useState("Planting seeds of inspiration... 🌱");
//   const [loadingIndex, setLoadingIndex] = useState(0);

//   const { theme, setTheme } = useTheme();

//   const steps = [
//     { key: 'recipient', question: "Who are we celebrating?", options: (process.env.NEXT_PUBLIC_GIFT_RECIPIENTS?.split(',').map(item => item.split(':')[0]) || []) },
//     { key: 'occasion', question: "What's the special occasion?", options: (process.env.NEXT_PUBLIC_GIFT_OCCASIONS?.split(',').map(item => item.split(':')[0]) || []) },
//     { key: 'vibe', question: "What the vibe?", options: (process.env.NEXT_PUBLIC_GIFT_VIBES?.split(',').map(item => item.split(':')[0]) || []) },
//   ];

//   const gardenLoadingTexts = [
//     "Planting seeds...",
//     "Watering ideas...",
//     "Waiting to bloom...",
//     "Harvesting surprises...",
//   ];

//   // Rotate loading text every 2 seconds
//   useEffect(() => {
//     if (!isGenerating) return;
    
//     const interval = setInterval(() => {
//       setLoadingIndex(prev => (prev + 1) % gardenLoadingTexts.length);
//     }, 2000);

//     return () => clearInterval(interval);
//   }, [isGenerating, gardenLoadingTexts.length]);

//   // Update loading text when index changes
//   useEffect(() => {
//     if (isGenerating) {
//       setLoadingText(gardenLoadingTexts[loadingIndex]);
//     }
//   }, [loadingIndex, isGenerating, gardenLoadingTexts]);

//   const handleSelect = (key: keyof typeof form, value: string) => {
//     if (key === 'vibe') {
//       setForm(prev => ({ ...prev, vibe: prev.vibe.includes(value) ? prev.vibe.filter(v => v !== value) : [...prev.vibe, value] }));
//     } else {
//       setForm(prev => ({ ...prev, [key]: value }));
//       // Auto-advance to next step for non-multi-select fields
//       setTimeout(() => {
//         if (step < steps.length - 1) {
//           setStep(s => s + 1);
//         }
//       }, 500);
//     }
//   };

//   const generateGifts = async () => {
//     if (isGenerating || !form.recipient || !form.occasion) return;
//     setIsGenerating(true);
//     setNoResults(false);
//     setLoadingIndex(0);
//     setLoadingText(gardenLoadingTexts[0]);
    
//     try {
//       const response = await fetch('/api/generate-gifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, description: '' }) });
//       if (!response.ok) throw new Error('API Error');
//       const data = await response.json();
//       if (data.gifts && data.gifts.length > 0) {
//         setGeneratedGifts(data.gifts.map((g: Gift) => ({ ...g, id: g.id || uuidv4() })));
//       } else {
//         setNoResults(true);
//       }
//       setShowResults(true);
//     } catch (error) { console.error("Failed to generate gifts:", error); setNoResults(true); setShowResults(true); }
//     finally { setIsGenerating(false); }
//   };

//   const nextStep = () => setStep(s => s < steps.length - 1 ? s + 1 : s);
//   const prevStep = () => setStep(s => s > 0 ? s - 1 : 0);

//   const restart = () => {
//     setStep(0); setForm({ recipient: '', occasion: '', vibe: [] }); setGeneratedGifts([]); setShowResults(false); setActiveGift(null); setNoResults(false);
//   };

//   const currentStep = steps[step];
//   const isFinalStep = step === steps.length - 1;
//   const canProceed = form.recipient && (step > 0 ? form.occasion : true);

//   return (
//     <div className={`min-h-screen w-full bg-emerald-50 dark:bg-gray-900 text-stone-800 dark:text-gray-200 transition-colors duration-300 ${nunito.className}`}>
//       <Background />
//       <header className="fixed top-0 left-0 right-0 p-4 px-8 flex justify-between items-center z-30">
//         <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={restart}>
//           <span className="text-green-600">GiftGarden</span>
//         </div>
//         <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-emerald-100/50 dark:hover:bg-gray-700/50 backdrop-blur-sm transition-colors">
//           <div className="relative w-5 h-5 flex items-center justify-center">
//             <Sun className="absolute text-stone-800 dark:text-transparent scale-100 dark:scale-0 transition-all duration-300" />
//             <Moon className="absolute text-transparent dark:text-gray-200 scale-0 dark:scale-100 transition-all duration-300" />
//           </div>
//         </button>
//       </header>

//       <div className="relative z-10 w-full h-screen flex flex-col items-center justify-center p-4">
//         <AnimatePresence mode="wait">
//           {isGenerating ? (
//             <motion.div key="generating" {...fadeAnim} className="text-center">
//               <h2 className="text-2xl font-bold dark:text-white">{loadingText}</h2>
//             </motion.div>
//           ) : showResults ? (
//             <motion.div key="results" {...fadeAnim} className="w-full h-full flex flex-col items-center">
//               {noResults ? (
//                 <div className="text-center m-auto">
//                   <h2 className="text-3xl font-bold mb-4">Nothing Sprouted</h2>
//                   <p className="text-gray-600 dark:text-gray-400 mb-8">Let&rsquo;s plant again!</p>
//                   <div className="flex items-center justify-center gap-4">
//                     <button onClick={restart} className="px-6 py-3 font-bold rounded-full bg-green-500 text-white hover:scale-105 transition-transform">
//                       Try Again
//                     </button>
//                     <button onClick={restart} className="px-6 py-3 font-bold rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
//                       Home
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   <h2 className="text-center text-3xl font-bold pt-20 pb-8">Your garden bloomed!</h2>
//                   <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                     {generatedGifts.map(gift => <GiftCard key={gift.id} gift={gift} onClick={() => setActiveGift(gift)} />)}
//                   </div>
//                   <button onClick={restart} className="mt-12 px-6 py-3 font-bold rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Start Over</button>
//                 </>
//               )}
//             </motion.div>
//           ) : (
//             <motion.div key="form" {...fadeAnim} className="w-full max-w-3xl text-center">
//               <div className="relative h-24">
//                 <AnimatePresence mode="wait">
//                   <motion.h2 key={step} {...fadeAnim} className="text-3xl md:text-4xl font-bold">
//                     {currentStep.question}
//                   </motion.h2>
//                 </AnimatePresence>
//               </div>

//               <div className="min-h-[300px] flex flex-col justify-center">
//                 <div className="flex flex-wrap justify-center gap-3">
//                   {currentStep.options?.map(value => <OptionPill key={value} label={value} isSelected={Array.isArray(form[currentStep.key as keyof typeof form]) ? form[currentStep.key as keyof typeof form].includes(value) : form[currentStep.key as keyof typeof form] === value} onClick={() => handleSelect(currentStep.key as keyof typeof form, value)} />)}
//                 </div>
//               </div>

//               <div className="h-20 flex items-center justify-center gap-4">
//                 <button onClick={prevStep} disabled={step === 0} className="flex items-center justify-center w-12 h-12 rounded-full font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
//                   <ChevronLeft className="w-5 h-5" />
//                 </button>
//                 {isFinalStep ? (
//                   <button onClick={generateGifts} disabled={isGenerating || !canProceed} className="px-6 py-3 rounded-full font-bold bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg hover:scale-105 disabled:opacity-50 transition-all">
//                     Grow Gifts
//                   </button>
//                 ) : (
//                   <button onClick={nextStep} disabled={!canProceed} className="flex items-center justify-center w-12 h-12 rounded-full font-semibold bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 disabled:opacity-50 transition-colors">
//                     <ChevronRight className="w-5 h-5" />
//                   </button>
//                 )}
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         <AnimatePresence>{activeGift && <GiftDetailModal gift={activeGift} onClose={() => setActiveGift(null)} />}</AnimatePresence>
//       </div>
//     </div>
//   );
// }

// // --- Helper & Modal Components ---
// const fadeAnim = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

// const OptionPill: FC<{ label: string; isSelected: boolean; onClick: () => void; }> = ({ label, isSelected, onClick }) => (
//   <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} className={`px-5 py-3 text-lg font-semibold rounded-full border-2 transition-all duration-200 ${isSelected ? 'bg-green-500 border-green-500 text-white shadow-lg' : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-400'}`}>
//     {label.charAt(0).toUpperCase() + label.slice(1)}
//   </motion.button>
// );

// const GiftCard: FC<{ gift: Gift; onClick: () => void; }> = ({ gift, onClick }) => (
//   <motion.div onClick={onClick} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring' }} className="cursor-pointer w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
//     <div className="relative w-full aspect-square"><ImageWithFallback src={gift.images?.[0] || ''} alt={gift.name} /></div>
//     <div className="p-4">
//       <h3 className="font-bold text-lg truncate">{gift.name}</h3>
//       <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{gift.description}</p>
//     </div>
//   </motion.div>
// );

// const GiftDetailModal: FC<{ gift: Gift; onClose: () => void; }> = ({ gift, onClose }) => (
//   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
//     <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="relative w-full max-w-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
//       <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1 rounded-full bg-gray-100/50 dark:bg-gray-900/50 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"><X /></button>
//       <div className="relative w-full aspect-video"><ImageWithFallback src={gift.images?.[0] || ''} alt={gift.name} /></div>
//       <div className="p-6">
//         <h3 className="text-2xl font-bold mb-2">{gift.name}</h3>
//         <div className="flex flex-wrap gap-2 mb-4">
//           {gift.tags?.map(tag => <span key={tag} className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-full">{tag}</span>)}
//         </div>
//         <p className="text-gray-600 dark:text-gray-400 mb-4">{gift.description}</p>
//         {gift.links?.[0] && <a href={gift.links[0]} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full p-3 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"><LinkIcon className="w-4 h-4" /> View Product</a>}
//       </div>
//     </motion.div>
//   </motion.div>
// );