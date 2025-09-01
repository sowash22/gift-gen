// "use client"

// import { useState, useEffect, useRef } from "react"
// import Image from "next/image"
// import { useTheme } from "next-themes"
// import Confetti from "react-confetti"
// import { Moon, Sun, Mic, Sparkles, RotateCcw, Plus, Copy, LinkIcon, Heart } from "lucide-react"
// import { analytics } from "@/lib/analytics"
// import FeedbackModal from "@/components/FeedbackModal"
// import { v4 as uuidv4 } from "uuid"
// import { motion } from "framer-motion"

// interface SpeechRecognitionEvent extends Event {
//   results: {
//     item(index: number): {
//       item(index: number): {
//         transcript: string
//       }
//     }
//     length: number
//   }
// }

// interface SpeechRecognitionErrorEvent extends Event {
//   error: string
// }

// interface SpeechRecognitionInstance extends EventTarget {
//   continuous: boolean
//   interimResults: boolean
//   onstart: (event: Event) => void
//   onresult: (event: SpeechRecognitionEvent) => void
//   onerror: (event: SpeechRecognitionErrorEvent) => void
//   onend: (event: Event) => void
//   start: () => void
//   stop: () => void
// }

// interface SpeechRecognitionConstructor {
//   new (): SpeechRecognitionInstance
// }

// declare global {
//   interface Window {
//     webkitSpeechRecognition: SpeechRecognitionConstructor
//     SpeechRecognition: SpeechRecognitionConstructor
//   }
// }

// interface Gift {
//   id: string
//   name: string
//   description: string
//   estimatedPrice?: string
//   tags?: string[]
//   links?: string[]
//   images?: string[]
//   feedback: "love" | "like" | "dislike" | null
// }

// export default function Home() {
//   const [recipient, setRecipient] = useState("")
//   const [occasion, setOccasion] = useState("")
//   const [vibe, setVibe] = useState<string[]>([])
//   const [budget, setBudget] = useState<string[]>([])
//   const [description, setDescription] = useState("")
//   const [generatedGifts, setGeneratedGifts] = useState<Gift[]>([])
//   const [isGenerating, setIsGenerating] = useState(false)
//   const [isListening, setIsListening] = useState(false)
//   const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
//   const { theme, setTheme, resolvedTheme } = useTheme()
//   const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
//   const resultsRef = useRef<HTMLDivElement>(null)
//   const [showConfetti, setShowConfetti] = useState(false)
//   const [showFeedbackModal, setShowFeedbackModal] = useState(false)
//   const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
//   const [currentStep, setCurrentStep] = useState(0)
//   const [isImageLoading, setIsImageLoading] = useState<{ [key: string]: boolean }>({})
//   const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})

//   const recipients = process.env.NEXT_PUBLIC_GIFT_RECIPIENTS?.split(",").map((item) => item.split(":")) || []
//   const occasions = process.env.NEXT_PUBLIC_GIFT_OCCASIONS?.split(",").map((item) => item.split(":")) || []
//   const vibes = process.env.NEXT_PUBLIC_GIFT_VIBES?.split(",").map((item) => item.split(":")) || []
//   const budgets = process.env.NEXT_PUBLIC_GIFT_BUDGETS?.split(",").map((item) => item.split(":")) || []

//   useEffect(() => {
//     const handleResize = () => {
//       setWindowSize({
//         width: window.innerWidth,
//         height: window.innerHeight,
//       })
//     }

//     if (typeof window !== "undefined") {
//       handleResize()
//       window.addEventListener("resize", handleResize)
//       return () => window.removeEventListener("resize", handleResize)
//     }
//   }, [])

//   useEffect(() => {
//     const currentStepData = steps[currentStep]
//     if (currentStepData && currentStepData.completed && currentStep < steps.length - 1) {
//       const timer = setTimeout(() => {
//         setCurrentStep(currentStep + 1)
//       }, 800)
//       return () => clearTimeout(timer)
//     }
//   }, [recipient, occasion, vibe, budget, currentStep])

//   const startListening = () => {
//     if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
//       const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
//       const recognition = new SpeechRecognition()
//       recognition.continuous = true
//       recognition.interimResults = true

//       recognition.onstart = () => setIsListening(true)

//       recognition.onresult = (event: SpeechRecognitionEvent) => {
//         const results = Array.from(
//           { length: event.results.length },
//           (_, i) => event.results.item(i).item(0).transcript,
//         ).join("")
//         setDescription(results)
//       }

//       recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
//         console.error("Speech recognition error:", event.error)
//         setToast({ message: "Error with speech recognition", type: "error" })
//         setIsListening(false)
//       }

//       recognition.onend = () => setIsListening(false)

//       recognitionRef.current = recognition
//       recognition.start()
//     } else {
//       setToast({ message: "Speech recognition not supported", type: "error" })
//     }
//   }

//   const stopListening = () => {
//     if (recognitionRef.current) {
//       recognitionRef.current.stop()
//       setIsListening(false)
//     }
//   }

//   const toggleTheme = () => {
//     setTheme(theme === "light" ? "dark" : "light")
//     analytics.trackButtonClick("toggle_theme", "header")
//   }

//   const validateImage = async (url: string): Promise<boolean> => {
//     return new Promise((resolve) => {
//       const img = new Image()
//       img.src = url
//       img.onload = () => resolve(true)
//       img.onerror = () => resolve(false)
//     })
//   }

//   const generateGifts = async () => {
//     setIsGenerating(true)

//     try {
//       const requestBody = {
//         recipient,
//         occasion,
//         vibe,
//         budget,
//         description: description.trim(),
//         previouslyGeneratedGifts: generatedGifts.map((gift) => gift.name),
//       }

//       const response = await fetch("/api/generate-gifts", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestBody),
//       })

//       if (!response.ok) throw new Error("Failed to generate gifts")

//       const data = await response.json()

//       const validatedGifts = await Promise.all(
//         data.gifts.map(async (gift: any) => {
//           let images: string[] = []
//           if (Array.isArray(gift.images) && gift.images.length > 0) {
//             for (const url of gift.images) {
//               const isValid = await validateImage(url)
//               if (isValid) {
//                 images.push(url)
//               }
//             }
//           }
//           return {
//             id: gift.id || uuidv4(),
//             name: gift.name,
//             description: gift.description,
//             estimatedPrice: gift.estimatedPrice,
//             tags: Array.isArray(gift.tags) ? gift.tags : [],
//             links: Array.isArray(gift.links) ? gift.links : [],
//             images,
//             feedback: null,
//           }
//         })
//       )

//       setGeneratedGifts((prev) => [...prev, ...validatedGifts])

//       const initialLoading: { [key: string]: boolean } = {}
//       const initialErrors: { [key: string]: boolean } = {}
//       validatedGifts.forEach((gift) => {
//         if (gift.images.length > 0) {
//           initialLoading[gift.id] = true
//           initialErrors[gift.id] = false
//         }
//       })
//       setIsImageLoading((prev) => ({ ...prev, ...initialLoading }))
//       setImageErrors((prev) => ({ ...prev, ...initialErrors }))

//       if (process.env.NEXT_PUBLIC_SHOW_CONFETTI === "true" && !sessionStorage.getItem("confetti_shown")) {
//         setShowConfetti(true)
//         sessionStorage.setItem("confetti_shown", "true")
//         setTimeout(() => setShowConfetti(false), 5000)
//       }

//       setTimeout(() => {
//         resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
//       }, 100)
//     } catch (error) {
//       console.error("Error generating gifts:", error)
//       setToast({ message: "Failed to generate gifts. Please try again.", type: "error" })
//       setTimeout(() => setToast(null), 2000)
//     } finally {
//       setIsGenerating(false)
//     }
//   }

//   const copyToClipboard = (text: string) => {
//     navigator.clipboard.writeText(text)
//     setToast({ message: "Copied to clipboard!", type: "success" })
//     setTimeout(() => setToast(null), 2000)
//   }

//   const restart = () => {
//     setRecipient("")
//     setOccasion("")
//     setVibe([])
//     setBudget([])
//     setDescription("")
//     setGeneratedGifts([])
//     setCurrentStep(0)
//     setImageErrors({})
//     setIsImageLoading({})
//     analytics.trackButtonClick("restart", "results")
//   }

//   const handleImageLoad = (giftId: string) => {
//     setIsImageLoading((prev) => ({ ...prev, [giftId]: false }))
//   }

//   const handleImageError = (giftId: string) => {
//     setIsImageLoading((prev) => ({ ...prev, [giftId]: false }))
//     setImageErrors((prev) => ({ ...prev, [giftId]: true }))
//   }

//   const steps = [
//     { key: "recipient", label: "Who is this for?", completed: !!recipient },
//     { key: "occasion", label: "What's the occasion?", completed: !!occasion },
//     { key: "vibe", label: "What's the vibe?", completed: vibe.length > 0 },
//     { key: "budget", label: "What's your budget?", completed: budget.length > 0 },
//     { key: "description", label: "Tell us more", completed: true },
//   ]

//   return (
//     <div className="relative min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-orange-50 dark:from-slate-900 dark:via-violet-950 dark:to-indigo-950">
//       {showConfetti && windowSize.width > 0 && windowSize.height > 0 && (
//         <div className="fixed inset-0 pointer-events-none z-50">
//           <Confetti
//             width={windowSize.width}
//             height={windowSize.height}
//             numberOfPieces={200}
//             recycle={false}
//             gravity={0.3}
//             colors={["#ff69b4", "#ff1493", "#ffc0cb", "#ff6347", "#ffa500", "#9370db"]}
//           />
//         </div>
//       )}

//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-400/20 to-purple-400/20 dark:from-violet-500/10 dark:to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/20 to-rose-400/20 dark:from-pink-500/10 dark:to-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
//         <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-r from-orange-400/20 to-amber-400/20 dark:from-orange-500/10 dark:to-amber-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
//       </div>

//       {toast && (
//         <div
//           className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-sm font-medium shadow-2xl backdrop-blur-md transition-all duration-500 border ${toast.type === "success" ? "bg-emerald-500/90 text-white border-emerald-400/20 shadow-emerald-500/25" : "bg-red-500/90 text-white border-red-400/20 shadow-red-500/25"}`}
//         >
//           <div className="flex items-center justify-between gap-2">
//             <span>{toast.type === "success" ? "✨" : "⚠️"}</span>
//             <span>{toast.message}</span>
//             <button onClick={() => setToast(null)} className="ml-4 font-bold hover:text-gray-200">
//               ✕
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="max-w-2xl mx-auto px-6 py-8 relative z-10">
//         <div className="absolute top-6 right-6">
//           <button
//             onClick={toggleTheme}
//             className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-violet-600 dark:text-violet-400 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-violet-500/10 hover:shadow-2xl hover:shadow-violet-500/20 transform hover:scale-110 border border-white/20 dark:border-slate-700/50"
//             aria-label="Toggle theme"
//           >
//             {resolvedTheme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
//           </button>
//         </div>

//         <motion.div 
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.8 }}
//           className="text-center mb-16"
//         >
//           <motion.div 
//             className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl shadow-purple-500/30 mb-8"
//             whileHover={{ rotate: 12, scale: 1.1 }}
//             transition={{ duration: 0.7 }}
//           >
//             <span className="text-4xl">🎁</span>
//           </motion.div>
//           <h1 className="text-6xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 dark:from-violet-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent mb-6 leading-tight text-balance">
//             Perfect Gift Finder
//           </h1>
//           <p className="text-xl text-slate-600/90 dark:text-slate-300/90 max-w-lg mx-auto leading-relaxed font-medium text-pretty">
//             Discover thoughtful gifts that will make someone's day special ✨
//           </p>
//         </motion.div>

//         <div className="mb-12">
//           <div className="flex justify-center mb-8">
//             <div className="flex items-center gap-2">
//               {steps.map((step, index) => (
//                 <div key={step.key} className="flex items-center">
//                   <div
//                     className={`w-3 h-3 rounded-full transition-all duration-500 ${
//                       index <= currentStep
//                         ? step.completed
//                           ? "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30"
//                           : "bg-gradient-to-r from-violet-400 to-purple-500 shadow-lg shadow-purple-500/30"
//                         : "bg-slate-300 dark:bg-slate-600"
//                     }`}
//                   ></div>
//                   {index < steps.length - 1 && (
//                     <div
//                       className={`w-8 h-0.5 mx-1 transition-all duration-500 ${
//                         index < currentStep
//                           ? "bg-gradient-to-r from-emerald-400 to-teal-500"
//                           : "bg-slate-300 dark:bg-slate-600"
//                       }`}
//                     ></div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         <div className="space-y-12">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={currentStep >= 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
//             transition={{ duration: 0.7 }}
//           >
//             <EnhancedToggleButtonGroup
//               label="Who is this for?"
//               emoji="👤"
//               value={recipient}
//               onChange={setRecipient}
//               options={recipients}
//               isActive={currentStep >= 0}
//             />
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={currentStep >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
//             transition={{ duration: 0.7 }}
//           >
//             <EnhancedToggleButtonGroup
//               label="What's the occasion?"
//               emoji="🎉"
//               value={occasion}
//               onChange={setOccasion}
//               options={occasions}
//               isActive={currentStep >= 1}
//             />
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={currentStep >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
//             transition={{ duration: 0.7 }}
//           >
//             <EnhancedMultiSelectToggleButtonGroup
//               label="What's the vibe?"
//               emoji="✨"
//               values={vibe}
//               onChange={setVibe}
//               options={vibes}
//               isActive={currentStep >= 2}
//             />
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={currentStep >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
//             transition={{ duration: 0.7 }}
//           >
//             <EnhancedMultiSelectToggleButtonGroup
//               label="What's your budget?"
//               emoji="💰"
//               values={budget}
//               onChange={setBudget}
//               options={budgets}
//               isActive={currentStep >= 3}
//             />
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={currentStep >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
//             transition={{ duration: 0.7 }}
//           >
//             <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/30 dark:border-slate-700/30 shadow-2xl">
//               <div className="flex items-center gap-4 mb-6">
//                 <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
//                   💭
//                 </div>
//                 <div>
//                   <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tell us more</h3>
//                   <p className="text-slate-600 dark:text-slate-400">Help us find the perfect match</p>
//                 </div>
//                 <span className="ml-auto px-4 py-2 text-sm font-bold bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 text-amber-700 dark:text-amber-300 rounded-full shadow-sm">
//                   Optional
//                 </span>
//               </div>
//               <div className="relative group">
//                 <textarea
//                   value={description}
//                   onChange={(e) => setDescription(e.target.value)}
//                   placeholder="e.g., 'My friend who loves hiking and reading mystery novels...'"
//                   className="w-full px-6 py-6 pb-16 border-0 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 resize-none min-h-[140px] text-base leading-relaxed transition-all duration-300 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 group-focus-within:shadow-2xl group-focus-within:shadow-purple-500/15 border border-white/20 dark:border-slate-700/50"
//                   rows={4}
//                 />
//                 <button
//                   onClick={isListening ? stopListening : startListening}
//                   className={`absolute right-4 bottom-4 p-3 rounded-2xl transition-all duration-300 shadow-lg transform hover:scale-110 ${
//                     isListening
//                       ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/30 animate-pulse"
//                       : "bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-600 dark:text-slate-300 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800 dark:hover:to-pink-800"
//                   }`}
//                   title={isListening ? "Stop listening" : "Start voice input"}
//                 >
//                   <Mic className="w-4 h-4" />
//                 </button>
//                 {isListening && (
//                   <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-4 py-2 text-sm font-bold bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300 rounded-2xl border border-purple-200 dark:border-purple-800/50 shadow-xl backdrop-blur-md">
//                     <span>Listening...</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={currentStep >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
//             transition={{ duration: 0.7 }}
//           >
//             <button
//               onClick={generateGifts}
//               disabled={isGenerating || !recipient || !occasion}
//               className={`group w-full py-8 px-8 rounded-3xl font-bold text-2xl transition-all duration-500 transform hover:scale-105 ${
//                 isGenerating || !recipient || !occasion
//                   ? "bg-slate-200/80 dark:bg-slate-700/80 text-slate-400 dark:text-slate-500 cursor-not-allowed"
//                   : "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-600 text-white shadow-2xl shadow-purple-500/30 hover:shadow-3xl hover:shadow-purple-500/40 hover:from-violet-600 hover:via-purple-600 hover:to-pink-700"
//               }`}
//             >
//               {isGenerating ? (
//                 <div className="flex items-center justify-center gap-4">
//                   <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
//                   <span>Finding perfect gifts...</span>
//                 </div>
//               ) : (
//                 <span className="flex items-center justify-center gap-4 group-hover:gap-6 transition-all duration-300">
//                   <Sparkles className="w-8 h-8 group-hover:animate-pulse" />
//                   Generate Perfect Gifts
//                   <Sparkles className="w-8 h-8 group-hover:animate-pulse" />
//                 </span>
//               )}
//             </button>
//           </motion.div>
//         </div>

//         <div ref={resultsRef}></div>

//         {generatedGifts.length > 0 && (
//           <motion.div 
//             initial={{ opacity: 0, y: 50 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             className="space-y-12 mt-20"
//           >
//             <div className="text-center space-y-6">
//               <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-3xl shadow-2xl shadow-emerald-500/25 mb-6 animate-bounce">
//                 <span className="text-3xl">🎉</span>
//               </div>
//               <h2 className="text-5xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent mb-6 text-balance">
//                 Perfect Gifts Found!
//               </h2>
//               <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto text-pretty">
//                 Here are some thoughtful gift ideas tailored just for you
//               </p>
//             </div>

//             <div className="grid gap-8 md:grid-cols-2">
//               {generatedGifts.map((gift, index) => (
//                 <motion.div
//                   key={gift.id}
//                   initial={{ opacity: 0, scale: 0.9 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   transition={{ duration: 0.5, delay: index * 0.1 }}
//                   whileHover={{ scale: 1.05, y: -12 }}
//                   whileTap={{ scale: 0.95 }}
//                   className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/30 dark:border-slate-700/50 transition-all duration-700"
//                 >
//                   {gift.images && gift.images.length > 0 && (
//                     <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
//                       {!imageErrors[gift.id] ? (
//                         <>
//                           {isImageLoading[gift.id] && (
//                             <div className="absolute inset-0 flex items-center justify-center">
//                               <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
//                             </div>
//                           )}
//                           <Image 
//                             src={gift.images[0]} 
//                             alt={gift.name} 
//                             width={500} 
//                             height={300} 
//                             unoptimized
//                             className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
//                             onLoad={() => handleImageLoad(gift.id)}
//                             onError={() => handleImageError(gift.id)}
//                           />
//                         </>
//                       ) : (
//                         <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
//                           <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-2xl flex items-center justify-center mb-3">
//                             <span className="text-2xl">🖼️</span>
//                           </div>
//                           <p className="text-sm font-medium">Image unavailable</p>
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   <div className="p-8">
//                     <h3 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-purple-700 to-pink-700 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3 leading-tight text-balance">
//                       {gift.name}
//                     </h3>
//                     <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-pretty">
//                       {gift.description}
//                     </p>

//                     {gift.tags && gift.tags.length > 0 && (
//                       <div className="flex flex-wrap gap-2 mb-6">
//                         {gift.tags.map((tag) => (
//                           <span
//                             key={tag}
//                             className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800/50"
//                           >
//                             {tag}
//                           </span>
//                         ))}
//                       </div>
//                     )}

//                     {gift.estimatedPrice && (
//                       <div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-6">
//                         {gift.estimatedPrice}
//                       </div>
//                     )}

//                     {gift.links && gift.links.length > 0 && (
//                       <div className="mb-6">
//                         <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Where to buy:</h4>
//                         <div className="space-y-2">
//                           {gift.links.slice(0, 2).map((link, index) => (
//                             <a
//                               key={index}
//                               href={link}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 rounded-2xl transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 group/link"
//                             >
//                               <LinkIcon className="w-4 h-4 mr-3 shrink-0 group-hover/link:animate-pulse" />
//                               <span className="truncate text-sm font-medium">{new URL(link).hostname}</span>
//                             </a>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     <div className="flex gap-3 justify-center">
//                       <button
//                         onClick={() => copyToClipboard(gift.name)}
//                         className="group/btn flex-1 inline-flex items-center justify-center px-4 py-3 text-sm font-bold bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
//                       >
//                         <Copy className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
//                         Copy
//                       </button>
//                       <button
//                         onClick={() => setShowFeedbackModal(true)}
//                         className="group/btn flex-1 inline-flex items-center justify-center px-4 py-3 text-sm font-bold bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
//                       >
//                         <Heart className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
//                         Feedback
//                       </button>
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>

//             <div className="text-center pt-12 flex flex-col sm:flex-row justify-center gap-6">
//               <button
//                 onClick={restart}
//                 className="group px-8 py-4 bg-gradient-to-r from-slate-500 to-gray-600 text-white rounded-2xl transition-all duration-500 transform hover:scale-105 font-bold shadow-2xl shadow-slate-500/30 hover:shadow-3xl hover:shadow-slate-500/40 border border-white/20"
//               >
//                 <span className="flex items-center justify-center gap-3 group-hover:gap-4 transition-all duration-300">
//                   <RotateCcw className="w-5 h-5 group-hover:animate-spin" />
//                   Start Over
//                 </span>
//               </button>
//               <button
//                 onClick={generateGifts}
//                 disabled={isGenerating}
//                 className={`group px-8 py-4 rounded-2xl font-bold transition-all duration-500 transform hover:scale-105 ${
//                   isGenerating
//                     ? "bg-slate-200/80 dark:bg-slate-700/80 text-slate-400 dark:text-slate-500 cursor-not-allowed"
//                     : "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-600 text-white shadow-2xl shadow-purple-500/30 hover:shadow-3xl hover:shadow-purple-500/40"
//                 }`}
//               >
//                 {isGenerating ? (
//                   <div className="flex items-center justify-center gap-3">
//                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                     <span>Finding More...</span>
//                   </div>
//                 ) : (
//                   <span className="flex items-center justify-center gap-3 group-hover:gap-4 transition-all duration-300">
//                     <Plus className="w-5 h-5 group-hover:animate-pulse" />
//                     Regenerate
//                   </span>
//                 )}
//               </button>
//             </div>
//           </motion.div>
//         )}
//       </div>
//       <FeedbackModal
//         isOpen={showFeedbackModal}
//         onClose={({ feedbackSubmitted = true }: { feedbackSubmitted?: boolean } = {}) => {
//           setShowFeedbackModal(false)
//           if (feedbackSubmitted) {
//             setToast({ message: "Thanks for the feedback ❤️", type: "success" })
//             setTimeout(() => setToast(null), 2000)
//           }
//         }}
//       />
//     </div>
//   )
// }

// function EnhancedToggleButtonGroup({
//   label,
//   emoji,
//   value,
//   onChange,
//   options,
//   isActive,
// }: {
//   label: string
//   emoji: string
//   value: string
//   onChange: (value: string) => void
//   options: string[][]
//   isActive: boolean
// }) {
//   return (
//     <motion.div
//       className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/30 dark:border-slate-700/30 shadow-2xl transition-all duration-500 ${isActive ? "opacity-100" : "opacity-50"}`}
//       whileHover={{ scale: 1.02 }}
//       transition={{ duration: 0.3 }}
//     >
//       <div className="flex items-center gap-4 mb-6">
//         <div className="w-12 h-12 bg-gradient-to-r from-violet-400 to-purple-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
//           {emoji}
//         </div>
//         <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{label}</h3>
//       </div>
//       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
//         {options.map(([optionValue, optionEmoji], index) => (
//           <motion.button
//             key={optionValue}
//             onClick={() => onChange(optionValue)}
//             className={`flex flex-col items-center gap-3 p-6 rounded-2xl text-sm font-bold border-2 transition-all duration-300 ${
//               value === optionValue
//                 ? "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-600 text-white border-transparent shadow-lg shadow-purple-500/20"
//                 : "bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-purple-300 dark:hover:border-purple-600"
//             }`}
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3, delay: index * 0.05 }}
//           >
//             <span className="text-2xl">{optionEmoji}</span>
//             <span className="text-center leading-tight">
//               {optionValue.charAt(0).toUpperCase() + optionValue.slice(1)}
//             </span>
//           </motion.button>
//         ))}
//       </div>
//     </motion.div>
//   )
// }

// function EnhancedMultiSelectToggleButtonGroup({
//   label,
//   emoji,
//   values,
//   onChange,
//   options,
//   isActive,
// }: {
//   label: string
//   emoji: string
//   values: string[]
//   onChange: (values: string[]) => void
//   options: string[][]
//   isActive: boolean
// }) {
//   const handleToggle = (optionValue: string) => {
//     if (values.includes(optionValue)) {
//       onChange(values.filter((v) => v !== optionValue))
//     } else {
//       onChange([...values, optionValue])
//     }
//   }

//   return (
//     <motion.div
//       className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/30 dark:border-slate-700/30 shadow-2xl transition-all duration-500 ${isActive ? "opacity-100" : "opacity-50"}`}
//       whileHover={{ scale: 1.02 }}
//       transition={{ duration: 0.3 }}
//     >
//       <div className="flex items-center gap-4 mb-6">
//         <div className="w-12 h-12 bg-gradient-to-r from-violet-400 to-purple-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
//           {emoji}
//         </div>
//         <div>
//           <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{label}</h3>
//           <p className="text-sm text-slate-600 dark:text-slate-400">Select all that apply</p>
//         </div>
//       </div>
//       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
//         {options.map(([optionValue, optionEmoji], index) => (
//           <motion.button
//             key={optionValue}
//             onClick={() => handleToggle(optionValue)}
//             className={`flex flex-col items-center gap-3 p-6 rounded-2xl text-sm font-bold border-2 transition-all duration-300 ${
//               values.includes(optionValue)
//                 ? "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-600 text-white border-transparent shadow-lg shadow-purple-500/20"
//                 : "bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-purple-300 dark:hover:border-purple-600"
//             }`}
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3, delay: index * 0.05 }}
//           >
//             <span className="text-2xl">{optionEmoji}</span>
//             <span className="text-center leading-tight">
//               {optionValue.charAt(0).toUpperCase() + optionValue.slice(1)}
//             </span>
//           </motion.button>
//         ))}
//       </div>
//     </motion.div>
//   )
// }