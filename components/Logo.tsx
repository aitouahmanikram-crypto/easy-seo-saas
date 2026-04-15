import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 font-bold text-2xl tracking-tight ${className}`}>
      <span className="text-brand-900">Easy</span>
      <span className="text-brand-500">SEO</span>
      <div className="w-6 h-6 rounded-full border-4 border-brand-500 border-r-transparent rotate-45 ml-1"></div>
    </div>
  );
}
