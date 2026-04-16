'use client';

import React, { useState } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, BarChart3, Sparkles, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { authService } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import Image from 'next/image';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const { error } = await authService.signInWithGoogle();
    if (error) toast.error(error.message);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await authService.signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Login Form */}
      <div className="flex w-full flex-col bg-[#020617] p-12 lg:w-[45%]">
        <div className="flex items-center justify-between">
          <Logo className="text-white" />
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <div className="my-auto mx-auto w-full max-w-md">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-gray-400 mb-10">Sign in to your account</p>

            <Button 
              variant="google" 
              className="w-full h-14 mb-8"
              onClick={handleGoogleLogin}
            >
              <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} className="w-5 h-5" referrerPolicy="no-referrer" />
              Continue with Google
            </Button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#020617] px-4 text-gray-500 font-bold">Or</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-2 text-white">
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                icon={<Mail size={20} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 text-white">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Link href="#" className="text-sm font-medium text-brand-400 hover:text-brand-300">Forgot Password?</Link>
              </div>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  icon={<Lock size={20} />}
                  className="pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-8 text-center text-gray-400">
            Don&apos;t have an account? <Link href="/signup" className="font-bold text-brand-400 hover:text-brand-300">Sign Up</Link>
          </p>
        </div>
      </div>

      {/* Right Side - Marketing Content */}
      <div className="hidden flex-1 bg-[#f8fafc] lg:flex flex-col p-20 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block bg-brand-100 text-brand-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
            Join EasySEO Today
          </span>
          <h2 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Everything You Need <br />
            <span className="text-brand-500">to Grow Your Rankings</span>
          </h2>
          <p className="text-gray-500 text-lg mb-12 max-w-lg">
            Create an account to unlock powerful SEO tools and track your progress.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Track Keywords</h3>
                <p className="text-gray-500">Monitor your rankings and see what&apos;s working.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">AI Suggestions</h3>
                <p className="text-gray-500">Get actionable recommendations to improve SEO.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Export Reports</h3>
                <p className="text-gray-500">Download detailed reports and share with your team.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Manage Team</h3>
                <p className="text-gray-500">Collaborate and manage multiple projects.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Dashboard Preview (Screenshot 7 bottom right) */}
        <div className="absolute -bottom-20 -right-20 w-[600px] h-[400px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 transform rotate-[-2deg]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-500"></div>
            <div className="h-4 w-32 bg-gray-100 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-40 bg-gray-50 rounded-2xl p-4">
                <div className="h-4 w-20 bg-gray-200 rounded mb-4"></div>
                <div className="flex items-center justify-center pt-4">
                  <div className="w-24 h-24 rounded-full border-8 border-brand-500 border-t-transparent"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-red-50 rounded-xl"></div>
                <div className="h-20 bg-orange-50 rounded-xl"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-40 bg-gray-50 rounded-2xl"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-green-50 rounded-xl"></div>
                <div className="h-20 bg-blue-50 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
