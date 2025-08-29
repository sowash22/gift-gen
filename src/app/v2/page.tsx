'use client';

import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Mic, Sparkles, RotateCcw, Plus, Copy, Heart, Share2, Zap, ChevronDown, X } from 'lucide-react';

interface Gift {
  id: string;
  name: string;
  description: string;
  estimatedPrice?: string;
  tags?: string[];
  links?: string[];
  feedback: 'love' | 'like' | 'dislike' | null;
}

export default function ModernGiftGenerator() {
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [occasion, setOccasion] = useState('');
  const [vibe, setVibe] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [generatedGifts, setGeneratedGifts] = useState<Gift[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentGiftIndex, setCurrentGiftIndex] = useState(0);
  const recognitionRef = useRef<any>(null);

  // Mock data - replace with your environment variables
  const recipients = [
    ['mom', '👩‍💼'], ['dad', '👨‍💼'], ['partner', '💕'], ['friend', '🤝'], 
    ['sibling', '👫'], ['colleague', '💼'], ['child', '🧒'], ['grandparent', '👴']
  ];
  const occasions = [
    ['birthday', '🎂'], ['anniversary', '💍'], ['wedding', '👰'], ['graduation', '🎓'],
    ['holiday', '🎄'], ['thank you', '🙏'], ['apology', '😅'], ['just because', '✨']
  ];
  const vibes = [
    ['thoughtful', '💭'], ['fun', '🎉'], ['luxury', '✨'], ['practical', '🔧'],
    ['creative', '🎨'], ['tech', '📱'], ['wellness', '🧘'], ['adventure', '🏔️']
  ];
  const budgets = [
    ['under $25', '💵'], ['$25-50', '💰'], ['$50-100', '💳'], ['$100+', '💎']
  ];

  const startListening = () => {
    setIsListening(true);
    setTimeout(() => setIsListening(false), 3000); // Mock listening
  };

  const generateMockGifts = () => {
    return [
      {
        id: '1',
        name: 'Personalized Star Map',
        description: 'A custom star map showing the night sky from a special date and location, beautifully framed in minimalist design.',
        estimatedPrice: '$45-65',
        tags: ['Personalized', 'Romantic', 'Art'],
        links: ['https://example.com/star-map'],
        feedback: null
      },
      {
        id: '2',
        name: 'Artisanal Coffee Subscription',
        description: 'Monthly delivery of small-batch, ethically sourced coffee beans from around the world with tasting notes.',
        estimatedPrice: '$25-40/month',
        tags: ['Subscription', 'Gourmet', 'Experience'],
        links: ['https://example.com/coffee-sub'],
        feedback: null
      },
      {
        id: '3',
        name: 'Smart Plant Monitor',
        description: 'Elegant device that monitors soil moisture, light, and temperature to keep plants thriving with app notifications.',
        estimatedPrice: '$35-50',
        tags: ['Tech', 'Plants', 'Smart Home'],
        links: ['https://example.com/plant-monitor'],
        feedback: null
      }
    ];
  };

  const generateGifts = async () => {
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockGifts = generateMockGifts();
      setGeneratedGifts(mockGifts);
      setIsGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 2000);
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const restart = () => {
    setStep(1);
    setRecipient('');
    setOccasion('');
    setVibe([]);
    setBudget([]);
    setDescription('');
    setGeneratedGifts([]);
    setCurrentGiftIndex(0);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return recipient !== '';
      case 2: return occasion !== '';
      case 3: return vibe.length > 0;
      case 4: return budget.length > 0;
      case 5: return true;
      default: return false;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' 
        : 'bg-gradient-to-br from-white via-gray-50 to-white'
    }`}>
      
      {/* Floating orbs for visual interest */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-2xl opacity-20 transition-colors duration-700 ${
          theme === 'dark' ? 'bg-purple-500' : 'bg-pink-400'
        }`} />
        <div className={`absolute top-3/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-15 transition-colors duration-700 ${
          theme === 'dark' ? 'bg-blue-500' : 'bg-orange-400'
        }`} />
      </div>

      {/* Success animation */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-ping">
            <div className={`w-32 h-32 rounded-full ${
              theme === 'dark' ? 'bg-green-400' : 'bg-green-500'
            } opacity-75`} />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              G
            </div>
            <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              GiftGen
            </span>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-full transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-black/10 hover:bg-black/20 text-black'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="pt-20 pb-8 px-6">
        <div className="max-w-md mx-auto">
          
          {/* Progress indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  i <= step 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white scale-110' 
                    : theme === 'dark'
                    ? 'bg-gray-800 text-gray-500'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {i}
                </div>
              ))}
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-700 ease-out"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[60vh] flex flex-col justify-between">
            
            {/* Step 1: Who */}
            {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="text-center space-y-4">
                  <h1 className={`text-4xl font-black leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Who's the lucky person?
                  </h1>
                  <p className={`text-lg opacity-70 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Let's start with the basics
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {recipients.map(([value, emoji]) => (
                    <button
                      key={value}
                      onClick={() => setRecipient(value)}
                      className={`p-4 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 ${
                        recipient === value
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                          : theme === 'dark'
                          ? 'bg-gray-800/50 hover:bg-gray-800 text-white border border-gray-700'
                          : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="text-2xl mb-2">{emoji}</div>
                      <div className="font-semibold capitalize">{value}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Occasion */}
            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="text-center space-y-4">
                  <h1 className={`text-4xl font-black leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    What's the occasion?
                  </h1>
                  <p className={`text-lg opacity-70 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Every gift tells a story
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {occasions.map(([value, emoji]) => (
                    <button
                      key={value}
                      onClick={() => setOccasion(value)}
                      className={`p-4 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 ${
                        occasion === value
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                          : theme === 'dark'
                          ? 'bg-gray-800/50 hover:bg-gray-800 text-white border border-gray-700'
                          : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="text-2xl mb-2">{emoji}</div>
                      <div className="font-semibold capitalize">{value}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Vibe */}
            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="text-center space-y-4">
                  <h1 className={`text-4xl font-black leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    What's the vibe?
                  </h1>
                  <p className={`text-lg opacity-70 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Pick all that feel right
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {vibes.map(([value, emoji]) => (
                    <button
                      key={value}
                      onClick={() => {
                        if (vibe.includes(value)) {
                          setVibe(vibe.filter(v => v !== value));
                        } else {
                          setVibe([...vibe, value]);
                        }
                      }}
                      className={`p-4 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 ${
                        vibe.includes(value)
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                          : theme === 'dark'
                          ? 'bg-gray-800/50 hover:bg-gray-800 text-white border border-gray-700'
                          : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="text-2xl mb-2">{emoji}</div>
                      <div className="font-semibold capitalize">{value}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Budget */}
            {step === 4 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="text-center space-y-4">
                  <h1 className={`text-4xl font-black leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    What's your budget?
                  </h1>
                  <p className={`text-lg opacity-70 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Great gifts come in all ranges
                  </p>
                </div>
                
                <div className="space-y-3">
                  {budgets.map(([value, emoji]) => (
                    <button
                      key={value}
                      onClick={() => {
                        if (budget.includes(value)) {
                          setBudget(budget.filter(b => b !== value));
                        } else {
                          setBudget([...budget, value]);
                        }
                      }}
                      className={`w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all duration-300 transform hover:scale-105 ${
                        budget.includes(value)
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                          : theme === 'dark'
                          ? 'bg-gray-800/50 hover:bg-gray-800 text-white border border-gray-700'
                          : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="text-2xl">{emoji}</div>
                      <div className="font-semibold">{value}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Personal Touch */}
            {step === 5 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="text-center space-y-4">
                  <h1 className={`text-4xl font-black leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Tell us more
                  </h1>
                  <p className={`text-lg opacity-70 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Any special details? (optional)
                  </p>
                </div>
                
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Their hobbies, interests, or anything special about them..."
                    className={`w-full p-6 rounded-2xl resize-none h-32 transition-all duration-300 ${
                      theme === 'dark'
                        ? 'bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:bg-gray-800'
                        : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-gray-50'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  />
                  <button
                    onClick={startListening}
                    className={`absolute bottom-4 right-4 p-2 rounded-full transition-all duration-300 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8">
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Back
                </button>
              ) : <div />}

              {step < 5 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`px-8 py-4 rounded-full font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${
                    canProceed()
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                      : theme === 'dark'
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </button>
              ) : (
                <button
                  onClick={generateGifts}
                  disabled={isGenerating}
                  className={`px-8 py-4 rounded-full font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${
                    isGenerating
                      ? theme === 'dark'
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Finding gifts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Gifts
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {generatedGifts.length > 0 && (
            <div className="mt-16 space-y-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-2xl animate-bounce">
                  🎉
                </div>
                <h2 className={`text-3xl font-black ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Perfect matches found!
                </h2>
              </div>

              {/* Gift Cards */}
              <div className="space-y-6">
                {generatedGifts.map((gift, index) => (
                  <div
                    key={gift.id}
                    className={`p-6 rounded-3xl transition-all duration-500 transform hover:scale-105 ${
                      theme === 'dark'
                        ? 'bg-gray-800/50 border border-gray-700 backdrop-blur-sm'
                        : 'bg-white border border-gray-200 shadow-lg backdrop-blur-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className={`text-xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {gift.name}
                      </h3>
                      {gift.estimatedPrice && (
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                          theme === 'dark'
                            ? 'bg-gray-700 text-green-400'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {gift.estimatedPrice}
                        </span>
                      )}
                    </div>
                    
                    <p className={`mb-4 leading-relaxed ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {gift.description}
                    </p>
                    
                    {gift.tags && gift.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {gift.tags.map(tag => (
                          <span
                            key={tag}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              theme === 'dark'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyToClipboard(gift.name)}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          theme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        <Copy className="w-4 h-4 inline mr-2" />
                        Copy
                      </button>
                      <button className={`p-3 rounded-xl transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                          : 'bg-red-50 hover:bg-red-100 text-red-500'
                      }`}>
                        <Heart className="w-4 h-4" />
                      </button>
                      <button className={`p-3 rounded-xl transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-500'
                      }`}>
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-8">
                <button
                  onClick={restart}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </button>
                <button
                  onClick={generateGifts}
                  disabled={isGenerating}
                  className="flex-1 py-4 rounded-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  More Ideas
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}