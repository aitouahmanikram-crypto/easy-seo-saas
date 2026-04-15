'use client';

import React, { useState } from 'react';
import { Logo } from '@/components/Logo';
import { Play, Search, Zap, CreditCard, Clock, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';

export default function LandingPage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();

  const validateUrl = (input: string) => {
    if (!input) return 'Please enter a URL';
    try {
      // Add https if missing for validation
      const testUrl = input.startsWith('http') ? input : `https://${input}`;
      new URL(testUrl);
      return null;
    } catch (e) {
      return 'Please enter a valid website address (e.g., example.com)';
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    // Small delay for better UX feel
    setTimeout(() => {
      router.push(`/analyze?url=${encodeURIComponent(url)}`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-brand-500/30 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Logo className="text-white" />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors font-medium">
                Dashboard
              </Link>
              <button 
                onClick={signOut}
                className="text-gray-400 hover:text-white transition-colors font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors font-medium">
              Login
            </Link>
          )}
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 transition-all">
            <Play size={18} className="text-brand-400" fill="currentColor" />
            Watch Demo
          </button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 px-4 py-1.5 rounded-full text-brand-400 text-sm font-medium mb-8"
        >
          <Zap size={14} className="animate-pulse" />
          Try It Now - No Account Needed!
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]"
        >
          Analyze Your Website <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-400">in Seconds</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Get a professional SEO audit, identify critical issues, and boost your search rankings with AI-powered insights.
        </motion.p>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <form onSubmit={handleAnalyze} className="relative group">
            <div className={cn(
              "flex items-center bg-white rounded-[24px] p-2 shadow-2xl transition-all duration-500 border-4",
              error ? "border-red-500/50 shadow-red-500/10" : "border-white/5 group-focus-within:border-brand-500/30 group-focus-within:shadow-brand-500/20"
            )}>
              <div className="pl-6 text-gray-400">
                <Search size={24} />
              </div>
              <input
                type="text"
                placeholder="Enter your website URL (e.g. example.com)"
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 px-4 py-5 text-xl placeholder:text-gray-300"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="relative overflow-hidden bg-brand-500 hover:bg-brand-600 text-white px-10 py-5 rounded-[18px] font-bold text-xl transition-all flex items-center gap-3 disabled:opacity-70 group/btn"
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="animate-spin" size={24} />
                      <span>Analyzing...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <span>Analyze Now</span>
                      <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -bottom-10 left-6 flex items-center gap-2 text-red-400 text-sm font-medium"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Features Row */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-10 text-gray-400 text-sm font-medium"
        >
          <Tooltip content="We provide 5 comprehensive analyses per day for free users.">
            <div className="flex items-center gap-2 group cursor-help">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-brand-500/10 transition-colors">
                <Zap size={16} className="text-brand-400" />
              </div>
              <span>5 free analyses</span>
            </div>
          </Tooltip>
          
          <Tooltip content="No payment information required to start your analysis.">
            <div className="flex items-center gap-2 group cursor-help">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-brand-500/10 transition-colors">
                <CreditCard size={16} className="text-brand-400" />
              </div>
              <span>No credit card</span>
            </div>
          </Tooltip>

          <Tooltip content="Our engine crawls and analyzes your site in real-time.">
            <div className="flex items-center gap-2 group cursor-help">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-brand-500/10 transition-colors">
                <Clock size={16} className="text-brand-400" />
              </div>
              <span>Instant results</span>
            </div>
          </Tooltip>
        </motion.div>
      </main>

      {/* Trusted By Section */}
      <section className="relative z-10 bg-white text-gray-900 py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-16"
          >
            Trusted by Forward-Thinking Teams
          </motion.p>
          <div className="flex flex-wrap justify-center items-center gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" width={100} height={32} className="h-8 w-auto" referrerPolicy="no-referrer" />
            <Image src="https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" alt="Microsoft" width={100} height={32} className="h-8 w-auto" referrerPolicy="no-referrer" />
            <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" width={100} height={32} className="h-8 w-auto" referrerPolicy="no-referrer" />
            <Image src="https://upload.wikimedia.org/wikipedia/commons/0/05/Shopify_logo.svg" alt="Shopify" width={100} height={32} className="h-8 w-auto" referrerPolicy="no-referrer" />
            <Image src="https://upload.wikimedia.org/wikipedia/commons/3/3f/HubSpot_Logo.svg" alt="HubSpot" width={100} height={32} className="h-8 w-auto" referrerPolicy="no-referrer" />
          </div>
        </div>
      </section>
    </div>
  );
}
