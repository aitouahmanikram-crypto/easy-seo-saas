'use client';

import React from 'react';
import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export function Navbar() {
  const { user } = useAuth();
  
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="relative w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search for projects, reports..." 
          className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
          <Bell size={22} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-brand-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <HelpCircle size={22} />
        </button>
        
        <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20 uppercase">
            {user?.email?.[0] || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-gray-900 leading-none mb-1">{user?.user_metadata?.full_name || 'User'}</p>
            <p className="text-[11px] text-gray-400 font-medium">{user?.email}</p>
          </div>
          <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </header>
  );
}
