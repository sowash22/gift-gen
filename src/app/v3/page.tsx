'use client';

import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Mic, Sparkles, RotateCcw, Plus, Copy, Heart, Share2, Zap, MicOff } from 'lucide-react';

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const recognitionRef = useRef<any>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    setTimeout(() => {
      setIsListening(false);
      setDescription('My partner loves hiking and artisan coffee. They collect vintage books and enjoy weekend farmers markets.');
    }, 3000);
  };

  const generateMockGifts = () => {
    const giftOptions = [
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
      },
      {
        id: '4',
        name: 'Handcrafted Leather Journal',
        description: 'Premium leather-bound journal with recycled paper, perfect for thoughts, sketches, and daily reflections.',
        estimatedPrice: '$45-70',
        tags: ['Handmade', 'Writing', 'Sustainable'],
        links: ['https://example.com/journal'],
        feedback: null
      },
      {
        id: '5',
        name: 'Wireless Charging Pad',
        description: 'Sleek bamboo wireless charger that blends seamlessly with any desk or nightstand setup.',
        estimatedPrice: '$30-45',
        tags: ['Tech', 'Sustainable', 'Minimal'],
        links: ['https://example.com/charger'],
        feedback: null
      }
    ];

    // Return 3 random gifts
    return giftOptions.sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  const generateGifts = async () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const mockGifts = generateMockGifts();
      setGeneratedGifts(mockGifts);
      setIsGenerating(false);
      setShowSuccess(true);
      setToast({ message: '✨ Perfect gifts found!', type: 'success' });
      setTimeout(() => {
        setShowSuccess(false);
        setToast(null);
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 2000);
    }, 2500);
  };

  const restart = () => {
    setRecipient('');
    setOccasion('');
    setVibe([]);
    setBudget([]);
    setDescription('');
    setGeneratedGifts([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canGenerate = () => {
    return recipient !== '' && occasion !== '';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: 'Copied to clipboard!', type: 'success' });
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' 
        : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'
    }`}>
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse transition-colors duration-700 ${
          theme === 'dark' ? 'bg-purple-500' : 'bg-pink-400'
        }`} />
        <div className={`absolute top-3/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 animate-pulse transition-colors duration-700 ${
          theme === 'dark' ? 'bg-blue-500' : 'bg-orange-400'
        }`} style={{ animationDelay: '2s' }} />
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-10 animate-pulse transition-colors duration-700 ${
          theme === 'dark' ? 'bg-green-500' : 'bg-purple-400'
        }`} style={{ animationDelay: '4s' }} />
      </div>

      {/* Success celebration */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-6xl animate-bounce">✨</div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl font-medium shadow-xl backdrop-blur-md transition-all duration-500 ${
          toast.type === 'success' 
            ? 'bg-green-500/90 text-white' 
            : 'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
              G
            </div>
            <div>
              <div className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Gift Generator
              </div>
              <div className={`text-xs opacity-60 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Find the perfect gift
              </div>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
              theme === 'dark' 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-black/10 hover:bg-black/20 text-black'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-3xl transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
            🎁
          </div>
          <h1 className={`text-6xl sm:text-7xl font-black mb-6 leading-none ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent' 
              : 'bg-gradient-to-r from-gray-900 via-purple-700 to-pink-700 bg-clip-text text-transparent'
          }`}>
            Perfect
            <br />
            Gifts
          </h1>
          <p className={`text-xl sm:text-2xl mb-8 max-w-md mx-auto leading-relaxed ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Discover thoughtful gifts that create lasting memories
          </p>
        </div>

        {/* Main Form */}
        <div className="space-y-12">
          
          {/* Who is this for? */}
          <div className="space-y-6">
            <h2 className={`text-3xl font-black ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Who's the lucky person? ✨
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recipients.map(([value, emoji]) => (
                <button
                  key={value}
                  onClick={() => setRecipient(value)}
                  className={`p-4 rounded-2xl text-center transition-all duration-300 transform hover:scale-105 group ${
                    recipient === value
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xl scale-105'
                      : theme === 'dark'
                      ? 'bg-gray-800/50 hover:bg-gray-800 text-white border border-gray-700/50'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="text-2xl mb-2 group-hover:animate-bounce">{emoji}</div>
                  <div className="font-semibold text-sm capitalize">{value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* What's the occasion? */}
          <div className="space-y-6">
            <h2 className={`text-3xl font-black ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              What's the celebration? 🎉
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {occasions.map(([value, emoji]) => (
                <button
                  key={value}
                  onClick={() => setOccasion(value)}
                  className={`p-4 rounded-2xl text-center transition-all duration-300 transform hover:scale-105 group ${
                    occasion === value
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xl scale-105'
                      : theme === 'dark'
                      ? 'bg-gray-800/50 hover:bg-gray-800 text-white border border-gray-700/50'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="text-2xl mb-2 group-hover:animate-bounce">{emoji}</div>
                  <div className="font-semibold text-sm capitalize">{value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* What's the vibe? */}
          <div className="space-y-6">
            <h2 className={`text-3xl font-black ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              What's the vibe? 
              <span className={`text-base font-normal ml-3 opacity-70 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                (pick any that feel right)
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  className={`p-4 rounded-2xl text-center transition-all duration-300 transform hover:scale-105 group ${
                    vibe.includes(value)
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xl scale-105'
                      : theme === 'dark'
                      ? 'bg-gray-800/50 hover:bg-gray-800 text-white border border-gray-700/50'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="text-2xl mb-2 group-hover:animate-bounce">{emoji}</div>
                  <div className="font-semibold text-sm capitalize">{value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-6">
            <h2 className={`text-3xl font-black ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              What's your budget? 💰
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className={`p-4 rounded-2xl text-left flex items-center gap-4 transition-all duration-300 transform hover:scale-105 ${
                    budget.includes(value)
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xl scale-105'
                      : theme === 'dark'
                      ? 'bg-gray-800/50 hover:bg-gray-800 text-white border border-gray-700/50'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="text-2xl">{emoji}</div>
                  <div className="font-semibold">{value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tell us more */}
          <div className="space-y-6">
            <h2 className={`text-3xl font-black ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Tell us more about them 
              <span className={`text-base font-normal ml-3 opacity-70 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                (optional but helpful)
              </span>
            </h2>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Their hobbies, interests, personality, or anything special about them..."
                className={`w-full p-6 rounded-3xl resize-none h-32 text-lg transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-400 focus:bg-gray-800 focus:border-purple-500'
                    : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              />
              <button
                onClick={isListening ? () => setIsListening(false) : startListening}
                className={`absolute bottom-4 right-4 p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              {isListening && (
                <div className="absolute bottom-4 left-6 flex items-center gap-2 text-sm font-medium text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  Listening...
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center pt-8">
            <button
              onClick={generateGifts}
              disabled={isGenerating || !canGenerate()}
              className={`px-12 py-6 rounded-3xl font-black text-xl transition-all duration-500 transform hover:scale-105 flex items-center gap-4 mx-auto ${
                isGenerating
                  ? theme === 'dark'
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : canGenerate()
                  ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-2xl hover:shadow-3xl hover:shadow-purple-500/30'
                  : theme === 'dark'
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  Finding perfect gifts...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate Amazing Gifts
                </>
              )}
            </button>
            {!canGenerate() && (
              <p className={`mt-4 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Please select who this is for and the occasion
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        {generatedGifts.length > 0 && (
          <div ref={resultsRef} className="mt-24 space-y-12">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 flex items-center justify-center text-4xl animate-bounce shadow-2xl">
                🎉
              </div>
              <h2 className={`text-5xl font-black ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                Perfect matches!
              </h2>
              <p className={`text-xl ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Here are some thoughtful gift ideas we found
              </p>
            </div>

            {/* Gift Cards */}
            <div className="space-y-8">
              {generatedGifts.map((gift, index) => (
                <div
                  key={gift.id}
                  className={`p-8 rounded-3xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-2 ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm shadow-2xl hover:shadow-purple-500/10'
                      : 'bg-white border border-gray-100 shadow-xl hover:shadow-2xl backdrop-blur-sm'
                  }`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <h3 className={`text-2xl font-black ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
                    }`}>
                      {gift.name}
                    </h3>
                    {gift.estimatedPrice && (
                      <span className={`text-lg font-bold px-4 py-2 rounded-2xl ${
                        theme === 'dark'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {gift.estimatedPrice}
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-lg mb-6 leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {gift.description}
                  </p>
                  
                  {gift.tags && gift.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {gift.tags.map(tag => (
                        <span
                          key={tag}
                          className={`px-3 py-1 text-sm font-medium rounded-full ${
                            theme === 'dark'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => copyToClipboard(gift.name)}
                      className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                        theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      <Copy className="w-5 h-5 inline mr-2" />
                      Copy Gift Idea
                    </button>
                    <button className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                      theme === 'dark'
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        : 'bg-red-50 hover:bg-red-100 text-red-500'
                    }`}>
                      <Heart className="w-5 h-5" />
                    </button>
                    <button className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                      theme === 'dark'
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-500'
                    }`}>
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-12">
              <button
                onClick={restart}
                className={`flex-1 py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 ${
                  theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-lg'
                }`}
              >
                <RotateCcw className="w-5 h-5" />
                Start Over
              </button>
              <button
                onClick={generateGifts}
                disabled={isGenerating}
                className="flex-1 py-5 rounded-2xl font-bold text-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl"
              >
                <Plus className="w-5 h-5" />
                Show More Ideas
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}