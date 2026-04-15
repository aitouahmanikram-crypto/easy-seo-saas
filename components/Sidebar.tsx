'use client';

import React from 'react';
import { Logo } from '@/components/Logo';
import { 
  LayoutDashboard, 
  FileText, 
  Key, 
  CheckSquare, 
  Sparkles, 
  Search, 
  ShieldCheck, 
  Settings, 
  HelpCircle,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'SEO Reports', href: '/reports' },
  { icon: Key, label: 'Keywords', href: '/keywords' },
  { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
  { icon: Sparkles, label: 'AI Suggestions', href: '/suggestions' },
];

const toolItems = [
  { icon: Search, label: 'Site Audit', href: '/audit' },
  { icon: ShieldCheck, label: 'Backlink Checker', href: '/backlinks' },
];

export function Sidebar() {
  const pathname = usePathname();

  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside className="w-64 bg-[#0f172a] text-gray-400 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 mb-4">
        <Logo className="text-white" />
      </div>

      <nav className="flex-1 px-4 space-y-8">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                pathname === item.href 
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" 
                  : "hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Tools</p>
          {toolItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                pathname === item.href 
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" 
                  : "hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* AI Assistant Promo (Screenshot 6 bottom left) */}
      <div className="px-4 mb-8">
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-4 text-center">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/20">
            <Sparkles size={24} className="text-white" />
          </div>
          <h4 className="text-white font-bold text-sm mb-1">Need Help?</h4>
          <p className="text-[11px] text-gray-400 mb-3">Get personalized SEO tips powered by AI.</p>
          <button className="w-full bg-white text-brand-900 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
            Ask AI Assistant
          </button>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-1">
        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:text-white hover:bg-white/5 transition-all font-medium">
          <Settings size={20} />
          Settings
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:text-red-400 hover:bg-red-400/5 transition-all font-medium text-left"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
