'use client';

import React, { useState } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { authService } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import Image from 'next/image';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignup = async () => {
    const { error } = await authService.signInWithGoogle();
    if (error) toast.error(error.message);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await authService.signUp(email, password, fullName);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for the confirmation link!');
      router.push('/login');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Signup Form */}
      <div className="flex w-full flex-col bg-[#020617] p-12 lg:w-[45%]">
        <div className="flex items-center justify-between">
          <Logo className="text-white" />
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <div className="my-auto mx-auto w-full max-w-md">
          <h1 className="text-4xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400 mb-10">Start growing your rankings today</p>

            <Button 
              variant="google" 
              className="w-full h-14 mb-8"
              onClick={handleGoogleSignup}
            >
              <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} className="w-5 h-5" referrerPolicy="no-referrer" />
              Sign up with Google
            </Button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#020617] px-4 text-gray-500 font-bold">Or</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 text-white">Full Name</label>
              <Input 
                type="text" 
                placeholder="John Doe" 
                icon={<User size={20} />}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-8 text-center text-gray-400">
            Already have an account? <Link href="/login" className="font-bold text-brand-400 hover:text-brand-300">Sign In</Link>
          </p>
        </div>
      </div>

      {/* Right Side - Marketing Content */}
      <div className="hidden flex-1 bg-[#f8fafc] lg:flex flex-col p-20 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block bg-brand-100 text-brand-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
            SEO Made Simple
          </span>
          <h2 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Join 10,000+ Users <br />
            <span className="text-brand-500">Optimizing with EasySEO</span>
          </h2>
          <p className="text-gray-500 text-lg mb-12 max-w-lg">
            The most powerful SEO analysis tool for modern websites.
          </p>

          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-3xl font-bold text-gray-900 mb-1">98%</p>
              <p className="text-sm text-gray-500">User Satisfaction</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-3xl font-bold text-gray-900 mb-1">2.5M</p>
              <p className="text-sm text-gray-500">Pages Analyzed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
