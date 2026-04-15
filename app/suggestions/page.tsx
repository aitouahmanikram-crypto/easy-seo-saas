'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { GoogleGenAI } from '@google/genai';
import { 
  Sparkles, 
  Lightbulb, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ChevronRight,
  RefreshCw,
  Plus,
  ArrowUpRight,
  MoreVertical,
  Code,
  Image as ImageIcon,
  Zap,
  Link as LinkIcon,
  Type,
  CheckSquare,
  ChevronDown,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

const suggestions = [
  { 
    title: 'Add Missing Meta Description', 
    description: '12 pages are missing meta descriptions. Adding them can improve click-through rate.',
    impact: '+4.2 Score',
    priority: 'High',
    category: 'Technical',
    icon: <Code className="text-red-500" />,
    linkText: 'View Affected Pages'
  },
  { 
    title: 'Optimize Images Alt Text', 
    description: '7 images are missing alt text. Add descriptive alt text to improve accessibility and SEO.',
    impact: '+2.8 Score',
    priority: 'Medium',
    category: 'Content',
    icon: <ImageIcon className="text-orange-500" />,
    linkText: 'View Suggestions'
  },
  { 
    title: 'Improve Page Load Speed', 
    description: 'Largest Contentful Paint (LCP) is 2.9s. Aim for less than 2.5s for better rankings.',
    impact: '+3.5 Score',
    priority: 'High',
    category: 'Performance',
    icon: <Zap className="text-red-500" />,
    linkText: 'See Performance Tips'
  },
  { 
    title: 'Add Internal Links', 
    description: 'Link between related pages to help search engines understand your site structure.',
    impact: '+1.9 Score',
    priority: 'Medium',
    category: 'Technical',
    icon: <LinkIcon className="text-brand-500" />,
    linkText: 'View Link Opportunities'
  },
  { 
    title: 'Use Shorter Title Tags', 
    description: '3 title tags are too long. Keep them under 60 characters for better display in search results.',
    impact: '+1.1 Score',
    priority: 'Low',
    category: 'Content',
    icon: <Type className="text-green-500" />,
    linkText: 'Review Title Tags'
  },
];

import { useEffect, useState } from 'react';
import { projectService } from '@/lib/services/projects';
import { suggestionService } from '@/lib/services/suggestions';
import { useAuth } from '@/components/AuthProvider';
import { reportService } from '@/lib/services/reports';
import toast from 'react-hot-toast';

export default function SuggestionsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const { data: projectsData } = await projectService.getProjects();
        if (projectsData && projectsData.length > 0) {
          setProjects(projectsData);
          setSelectedProject(projectsData[0]);
          
          const { data: latestAnalysis } = await reportService.getLatestReportByProjectId(projectsData[0].id);
          if (latestAnalysis) {
            const { data: suggestionsData } = await suggestionService.getSuggestionsByAnalysisId(latestAnalysis.id);
            setSuggestions(suggestionsData || []);
          } else {
            setSuggestions([]);
          }
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  const handleProjectChange = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
    
    setIsLoading(true);
    try {
      const { data: latestAnalysis } = await reportService.getLatestReportByProjectId(projectId);
      if (latestAnalysis) {
        const { data: suggestionsData } = await suggestionService.getSuggestionsByAnalysisId(latestAnalysis.id);
        setSuggestions(suggestionsData || []);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    try {
      const { data } = await suggestionService.updateSuggestionStatus(suggestionId, 'implemented');
      if (data) {
        setSuggestions(suggestions.map(s => s.id === suggestionId ? data : s));
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!selectedProject) return;
    
    setIsGenerating(true);
    try {
      // 1. Get latest report with issues
      const { data: latestReport } = await reportService.getLatestReportByProjectId(selectedProject.id);
      if (!latestReport) {
        toast.error('No SEO report found. Please run an analysis first.');
        setIsGenerating(false);
        return;
      }

      const { data: fullReport } = await reportService.getReportById(latestReport.id);
      if (!fullReport) throw new Error('Failed to fetch report details');

      // 2. Initialize Gemini
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        toast.error('Gemini API key is missing. Please check your environment variables.');
        setIsGenerating(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const analysisData = {
        score: fullReport.score,
        metadata: fullReport.metadata,
        issues: fullReport.issues.map((i: any) => ({
          title: i.title,
          description: i.description,
          priority: i.priority
        }))
      };

      const analysisDataStr = JSON.stringify(analysisData, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (value instanceof HTMLElement) return '[HTMLElement]';
        }
        return value;
      }, 2);

      const prompt = `
        As an expert SEO consultant, analyze the following website SEO report and provide 5-7 actionable, high-impact suggestions to improve its search engine ranking.
        
        Website Analysis Data:
        ${analysisDataStr}
        
        Return the suggestions in a JSON array format. Each suggestion object must have:
        - title: A short, catchy title for the suggestion.
        - description: A detailed explanation of what to do and why.
        - priority: 'high', 'medium', or 'low'.
        - impact: A number from 1 to 10 representing the potential SEO impact.
        - category: One of 'Technical', 'Content', 'Performance', or 'Keywords'.

        Format the response ONLY as a valid JSON array.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const suggestionsJson = jsonMatch ? jsonMatch[0] : responseText;
      
      const generatedSuggestions = JSON.parse(suggestionsJson);

      // 3. Save to Supabase
      const suggestionsToInsert = generatedSuggestions.map((s: any) => ({
        type: s.category?.toLowerCase() || 'technical',
        title: s.title,
        description: s.description,
        impact_score: parseInt(s.impact) || 5,
        status: 'open'
      }));

      const { data: newSuggestions, error: insertError } = await suggestionService.createSuggestions(latestReport.id, suggestionsToInsert);
      
      if (insertError) throw insertError;

      if (newSuggestions) {
        setSuggestions(newSuggestions);
        toast.success('Suggestions generated successfully!');
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast.error(error.message || 'Failed to generate suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (activeTab === 'All') return true;
    return s.category.toLowerCase() === activeTab.toLowerCase();
  });

  const stats = {
    total: suggestions.length,
    high: suggestions.filter(s => s.impact_score >= 8 && s.status !== 'implemented').length,
    medium: suggestions.filter(s => s.impact_score >= 5 && s.impact_score < 8 && s.status !== 'implemented').length,
    implemented: suggestions.filter(s => s.status === 'implemented').length,
    potentialGain: suggestions.filter(s => s.status !== 'implemented').reduce((acc, s) => acc + (parseFloat(s.impact_score) || 0), 0).toFixed(1),
  };

  const categories = ['All', 'Technical', 'Content', 'Performance', 'Keywords'];

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
                <span>AI Suggestions</span>
                <ChevronRight size={14} />
                <span className="text-gray-600">Recommendations</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">AI SEO Suggestions</h1>
              <p className="text-gray-500">Smart recommendations powered by AI to improve your SEO performance.</p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                onChange={(e) => handleProjectChange(e.target.value)}
                value={selectedProject?.id}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 shadow-sm focus:ring-brand-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name || p.url}</option>
                ))}
              </select>
              <button 
                onClick={handleGenerateSuggestions}
                disabled={isGenerating || !selectedProject}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
              >
                {isGenerating ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
                {isGenerating ? 'Generating...' : 'Generate New Suggestions'}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 mb-4">
                <Lightbulb size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Suggestions</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mb-4">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.high}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">High Priority</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
                <Clock size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.medium}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Medium Priority</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 mb-4">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.implemented}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Implemented</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">+{stats.potentialGain}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Potential Score Gain</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-8">
                  {categories.map((tab) => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "pb-4 text-sm font-bold transition-all relative",
                        activeTab === tab ? "text-brand-500" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {tab}
                      {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500 rounded-full"></div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestions List */}
              <div className="space-y-4">
                {filteredSuggestions.length > 0 ? filteredSuggestions.map((item, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start group hover:border-brand-200 transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-brand-50 transition-colors">
                      {item.type === 'technical' ? <Code className="text-brand-500" /> : 
                       item.type === 'content' ? <Type className="text-orange-500" /> :
                       item.type === 'performance' ? <Zap className="text-red-500" /> :
                       <Lightbulb className="text-blue-500" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          item.impact_score >= 8 ? "bg-red-50 text-red-600" :
                          item.impact_score >= 5 ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                        )}>
                          {item.impact_score >= 8 ? 'High' : item.impact_score >= 5 ? 'Medium' : 'Low'} Priority
                        </span>
                        {item.status === 'implemented' && (
                          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider">
                            Implemented
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Impact</p>
                        <div className="flex items-center gap-1 text-brand-500 font-bold">
                          <span className="text-sm">+{item.impact_score} Score</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                      {item.status !== 'implemented' && (
                        <button 
                          onClick={() => handleApplySuggestion(item.id)}
                          className="bg-white border border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white px-6 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                          Apply Suggestion
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center text-gray-500">
                    No suggestions found for this category.
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-8">
              {/* Suggestion Summary */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-8">Suggestion Summary</h3>
                <div className="relative flex items-center justify-center mb-8">
                  <div className="w-40 h-40 rounded-full border-[12px] border-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <span className="text-xs font-bold text-gray-600">{stats.high} High</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                      <span className="text-xs font-bold text-gray-600">{stats.medium} Medium</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      <span className="text-xs font-bold text-gray-600">{stats.implemented} Implemented</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-brand-500/5 border border-brand-500/10 p-8 rounded-3xl">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-500 mb-6 shadow-sm">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">How It Works</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Our AI analyzes your website data, competitors, and SEO best practices to generate actionable suggestions.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
