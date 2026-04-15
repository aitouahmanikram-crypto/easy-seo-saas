'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Trash2, Edit2, X, Loader2, Key, TrendingUp, TrendingDown, Plus, Download, Search, ChevronDown, ArrowUpRight, ArrowDownRight, MoreVertical, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_KEYWORDS = [
  { keyword: 'supabase', project: 'Main', domain: 'supabase.com', current: 1, change: '+2', previous: 3, best: 1, volume: '246,000' },
];

import { useEffect, useState, useCallback, Suspense } from 'react';
import { projectService } from '@/lib/services/projects';
import { keywordService } from '@/lib/services/keywords';
import { useAuth } from '@/components/AuthProvider';
import { parse } from 'json2csv';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function KeywordsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const projectParam = searchParams.get('project');
  
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<number>(0);
  
  const [editingKeyword, setEditingKeyword] = useState<any>(null);
  const [editKeywordValue, setEditKeywordValue] = useState('');
  const [editDifficultyValue, setEditDifficultyValue] = useState<number>(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: projectsData } = await projectService.getProjects();
      if (projectsData && projectsData.length > 0) {
        setProjects(projectsData);
        
        let projectToSelect = projectsData[0];
        if (projectParam) {
          const found = projectsData.find(p => p.id === projectParam);
          if (found) projectToSelect = found;
        }
        
        setSelectedProject(projectToSelect);
        
        const { data: keywordsData } = await keywordService.getKeywordsByProjectId(projectToSelect.id);
        setKeywords(keywordsData || []);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
      toast.error('Failed to load keywords');
    } finally {
      setIsLoading(false);
    }
  }, [projectParam]);

  useEffect(() => {
    if (!user) return;
    fetchInitialData();
  }, [user, fetchInitialData]);

  const handleProjectChange = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
    
    setIsLoading(true);
    try {
      const { data: keywordsData } = await keywordService.getKeywordsByProjectId(projectId);
      setKeywords(keywordsData || []);
    } catch (error) {
      console.error('Error fetching keywords:', error);
      toast.error('Failed to load keywords for this project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword || !selectedProject) {
      toast.error('Keyword is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await keywordService.addKeyword(selectedProject.id, user!.id, newKeyword, newDifficulty);
      if (error) throw error;
      
      if (data) {
        setKeywords([data, ...keywords]);
        setNewKeyword('');
        setNewDifficulty(0);
        setIsAddingKeyword(false);
        toast.success('Keyword added successfully');
      }
    } catch (error: any) {
      console.error('Error adding keyword:', error);
      toast.error(error.message || 'Failed to add keyword');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKeyword || !editKeywordValue) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await keywordService.updateKeyword(editingKeyword.id, {
        keyword: editKeywordValue,
        current_rank: editDifficultyValue
      });
      if (error) throw error;
      
      setKeywords(keywords.map(k => k.id === editingKeyword.id ? data : k));
      setEditingKeyword(null);
      toast.success('Keyword updated successfully');
    } catch (error: any) {
      console.error('Error updating keyword:', error);
      toast.error(error.message || 'Failed to update keyword');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKeyword = async (id: string, keyword: string) => {
    try {
      const { error } = await keywordService.deleteKeyword(id);
      if (error) throw error;
      
      setKeywords(keywords.filter(k => k.id !== id));
      toast.success('Keyword deleted successfully');
    } catch (error: any) {
      console.error('Error deleting keyword:', error);
      toast.error(error.message || 'Failed to delete keyword');
    }
  };

  const handleExportCSV = () => {
    if (keywords.length === 0) {
      toast.error('No keywords to export');
      return;
    }
    
    const fields = ['keyword', 'difficulty', 'created_at'];
    const csv = parse(keywords, { fields });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `keywords_${selectedProject?.name || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredKeywords = keywords.filter(k => 
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: keywords.length,
    top10: 0,
    avgPos: 0,
    improved: 0,
    declined: 0,
  };

  if (isLoading) {
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                <span>Keywords</span>
                <ChevronRight size={14} />
                <span className="text-gray-600">Tracking</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Keyword Tracking</h1>
              <p className="text-gray-500">Monitor your keyword rankings and track your progress over time.</p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                onChange={(e) => handleProjectChange(e.target.value)}
                value={selectedProject?.id}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 shadow-sm focus:ring-brand-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button 
                onClick={() => setIsAddingKeyword(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20"
              >
                <Plus size={20} />
                Add Keywords
              </button>
              <button 
                onClick={handleExportCSV}
                className="bg-white border border-gray-100 px-6 py-2.5 rounded-xl font-bold text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Add Keyword Modal */}
          {isAddingKeyword && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Add New Keyword</h3>
                <form onSubmit={handleAddKeyword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Keyword</label>
                    <input 
                      type="text" 
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="e.g. seo tools"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                      autoFocus
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Position (1-100)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="100"
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsAddingKeyword(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                      {isSubmitting ? 'Adding...' : 'Add Keyword'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Keyword Modal */}
          {editingKeyword && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                <button 
                  onClick={() => setEditingKeyword(null)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Edit Keyword</h3>
                <form onSubmit={handleUpdateKeyword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Keyword</label>
                    <input 
                      type="text" 
                      value={editKeywordValue}
                      onChange={(e) => setEditKeywordValue(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                      autoFocus
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Position (1-100)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="100"
                      value={editDifficultyValue}
                      onChange={(e) => setEditDifficultyValue(parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setEditingKeyword(null)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 mb-4">
                <Key size={20} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Keywords</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</h3>
              <p className="text-[10px] font-bold text-gray-500">Tracked</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 mb-4">
                <TrendingUp size={20} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Keywords in Top 10</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.top10}</h3>
              <p className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                {((stats.top10 / (stats.total || 1)) * 100).toFixed(1)}% of total
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
                <TrendingUp size={20} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Avg. Position</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.avgPos}</h3>
              <p className="text-[10px] font-bold text-gray-500">Across all keywords</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
                <TrendingUp size={20} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Improved</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.improved}</h3>
              <p className="text-[10px] font-bold text-green-500">{((stats.improved / (stats.total || 1)) * 100).toFixed(1)}% of total</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mb-4">
                <TrendingDown size={20} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Declined</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.declined}</h3>
              <p className="text-[10px] font-bold text-red-500">{((stats.declined / (stats.total || 1)) * 100).toFixed(1)}% of total</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table Filters */}
            <div className="p-6 border-b border-gray-50 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search keywords..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="px-8 py-4"><input type="checkbox" className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" /></th>
                  <th className="px-8 py-4">Keyword</th>
                  <th className="px-8 py-4 text-center">Current</th>
                  <th className="px-8 py-4 text-center">Change</th>
                  <th className="px-8 py-4 text-center">Previous</th>
                  <th className="px-8 py-4 text-center">Best</th>
                  <th className="px-8 py-4 text-center">Volume</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredKeywords.length > 0 ? filteredKeywords.map((item, i) => {
                  const change = (item.previous_rank || 0) - (item.current_rank || 0);
                  const isPositive = change > 0;
                  const isNegative = change < 0;
                  
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-8 py-4"><input type="checkbox" className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" /></td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{item.keyword}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{selectedProject?.url}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="font-bold text-gray-900">{item.current_rank || '-'}</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        {change !== 0 ? (
                          <div className={cn(
                            "flex items-center justify-center gap-1 font-bold text-xs",
                            isPositive ? "text-green-500" : "text-red-500"
                          )}>
                            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(change)}
                          </div>
                        ) : (
                          <span className="text-gray-400 font-bold text-xs">-</span>
                        )}
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-sm font-medium text-gray-500">{item.previous_rank || '-'}</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-sm font-medium text-gray-500">{item.best_rank || '-'}</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-sm font-medium text-gray-500">{item.search_volume || '0'}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingKeyword(item);
                              setEditKeywordValue(item.keyword);
                              setEditDifficultyValue(item.current_rank || 0);
                            }}
                            className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
                            title="Edit Keyword"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteKeyword(item.id, item.keyword)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Keyword"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={8} className="px-8 py-12 text-center text-gray-500">
                      No keywords found. Add some to start tracking!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-6 border-t border-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500 font-medium">Showing {filteredKeywords.length} keywords</p>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:bg-gray-50 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button className="w-8 h-8 rounded-lg bg-brand-500 text-white font-bold text-sm">1</button>
                <button className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:bg-gray-50 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function KeywordsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#f8fafc] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    }>
      <KeywordsContent />
    </Suspense>
  );
}
