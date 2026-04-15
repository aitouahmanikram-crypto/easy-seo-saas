'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  Search, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Link as LinkIcon,
  Filter,
  Download,
  Loader2
} from 'lucide-react';
import { projectService } from '@/lib/services/projects';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const MOCK_BACKLINKS = [
  { source: 'techcrunch.com', target: '/', dr: 92, ur: 45, anchor: 'EasySEO tool', type: 'dofollow', date: '2024-03-15' },
  { source: 'medium.com', target: '/blog/seo-tips', dr: 95, ur: 32, anchor: 'best SEO practices', type: 'nofollow', date: '2024-03-12' },
  { source: 'github.com', target: '/', dr: 97, ur: 50, anchor: 'EasySEO', type: 'dofollow', date: '2024-03-10' },
  { source: 'producthunt.com', target: '/', dr: 91, ur: 38, anchor: 'EasySEO launch', type: 'dofollow', date: '2024-03-05' },
  { source: 'forbes.com', target: '/', dr: 94, ur: 42, anchor: 'SEO automation', type: 'dofollow', date: '2024-03-01' },
];

export default function BacklinksPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const { data: projectsData } = await projectService.getProjects();
        if (projectsData && projectsData.length > 0) {
          setProjects(projectsData);
          setSelectedProject(projectsData[0]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  const filteredBacklinks = MOCK_BACKLINKS.filter(b => 
    b.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.anchor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                <span>Tools</span>
                <ChevronRight size={14} />
                <span className="text-gray-600">Backlink Checker</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Backlink Checker</h1>
              <p className="text-gray-500">Analyze your backlink profile and find new opportunities.</p>
            </div>
            {projects.length > 0 && (
              <select 
                onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value))}
                value={selectedProject?.id}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 shadow-sm focus:ring-brand-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.url}</option>
                ))}
              </select>
            )}
          </div>

          {!selectedProject ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 mx-auto">
                <Globe size={40} />
              </div>
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Projects Found</h2>
                <p className="text-gray-500 mb-8">Start by analyzing a website to create your first project and track backlinks.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="bg-brand-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto shadow-lg shadow-brand-500/20"
                >
                  <Search size={20} />
                  Analyze Website
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 mb-4">
                    <LinkIcon size={20} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Backlinks</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">1,248</h3>
                  <p className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                    <TrendingUp size={12} /> +12 this month
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
                    <Globe size={20} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Referring Domains</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">452</h3>
                  <p className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                    <TrendingUp size={12} /> +5 this month
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 mb-4">
                    <ShieldCheck size={20} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Domain Rating (DR)</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">48</h3>
                  <p className="text-[10px] font-bold text-gray-500">Strong profile</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mb-4">
                    <TrendingDown size={20} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Lost Backlinks</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">3</h3>
                  <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                    <TrendingDown size={12} /> -2 this month
                  </p>
                </div>
              </div>

              {/* Backlinks Table */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search by source or anchor..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="bg-white border border-gray-100 px-4 py-2.5 rounded-xl font-bold text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm text-sm">
                      <Filter size={18} />
                      Filters
                    </button>
                    <button className="bg-white border border-gray-100 px-4 py-2.5 rounded-xl font-bold text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm text-sm">
                      <Download size={18} />
                      Export
                    </button>
                  </div>
                </div>

                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                      <th className="px-8 py-4">Source Page</th>
                      <th className="px-8 py-4 text-center">DR</th>
                      <th className="px-8 py-4 text-center">UR</th>
                      <th className="px-8 py-4">Anchor Text</th>
                      <th className="px-8 py-4">Target Page</th>
                      <th className="px-8 py-4 text-center">Type</th>
                      <th className="px-8 py-4">First Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBacklinks.map((link, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 flex items-center gap-1">
                              {link.source}
                              <ExternalLink size={12} className="text-gray-400" />
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">https://{link.source}/...</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className="font-bold text-gray-900">{link.dr}</span>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className="font-bold text-gray-900">{link.ur}</span>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-sm font-medium text-gray-700">{link.anchor}</span>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-sm font-medium text-gray-500">{link.target}</span>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            link.type === 'dofollow' ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"
                          )}>
                            {link.type}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-sm font-medium text-gray-500">{link.date}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
