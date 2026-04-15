'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { 
  Search, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  ShieldAlert,
  Zap,
  Layout,
  Globe,
  Loader2
} from 'lucide-react';
import { projectService } from '@/lib/services/projects';
import { reportService } from '@/lib/services/reports';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AuditPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [latestReport, setLatestReport] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);

  const fetchAuditData = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const { data: report } = await reportService.getLatestReportByProjectId(projectId);
      setLatestReport(report);
      
      if (report) {
        const { data: issuesData } = await reportService.getIssuesByReportId(report.id);
        setIssues(issuesData || []);
      } else {
        setIssues([]);
      }
    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast.error('Failed to load audit data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const { data: projectsData } = await projectService.getProjects();
        if (projectsData && projectsData.length > 0) {
          setProjects(projectsData);
          setSelectedProject(projectsData[0]);
          fetchAuditData(projectsData[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user, fetchAuditData]);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
    fetchAuditData(projectId);
  };

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
                <span className="text-gray-600">Site Audit</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Site Audit</h1>
              <p className="text-gray-500">Comprehensive technical SEO audit for your website.</p>
            </div>
            {projects.length > 0 && (
              <select 
                onChange={(e) => handleProjectChange(e.target.value)}
                value={selectedProject?.id}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 shadow-sm focus:ring-brand-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name || p.url}</option>
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
                <p className="text-gray-500 mb-8">Start by analyzing a website to create your first project and run a site audit.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="bg-brand-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto shadow-lg shadow-brand-500/20"
                >
                  <Search size={20} />
                  Analyze Website
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-brand-500" size={48} />
            </div>
          ) : !latestReport ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mx-auto">
                <AlertCircle size={40} />
              </div>
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Reports Found</h2>
                <p className="text-gray-500 mb-8">This project hasn&apos;t been analyzed yet. Run an analysis to see the site audit results.</p>
                <button 
                  onClick={() => window.location.href = `/analyze?url=${selectedProject.url}`}
                  className="bg-brand-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto shadow-lg shadow-brand-500/20"
                >
                  <Search size={20} />
                  Run Analysis
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Health Score Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    <svg className="w-full h-full -rotate-90">
                      <circle 
                        cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="12" 
                      />
                      <circle 
                        cx="80" cy="80" r="70" fill="none" 
                        stroke={latestReport.score > 80 ? "#22c55e" : latestReport.score > 60 ? "#f97316" : "#ef4444"} 
                        strokeWidth="12" 
                        strokeDasharray="440" 
                        strokeDashoffset={440 - (440 * latestReport.score) / 100} 
                        strokeLinecap="round" 
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-gray-900">{latestReport.score}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Health Score</span>
                    </div>
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                    latestReport.score > 80 ? "bg-green-50 text-green-600" : 
                    latestReport.score > 60 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
                  )}>
                    {latestReport.score > 80 ? "Excellent" : latestReport.score > 60 ? "Needs Improvement" : "Critical"}
                  </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                        <ShieldAlert size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Critical Errors</p>
                        <h3 className="text-2xl font-bold text-gray-900">{latestReport.total_errors}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Fix these immediately to improve your search visibility.</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Warnings</p>
                        <h3 className="text-2xl font-bold text-gray-900">{latestReport.total_warnings}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Potential issues that could affect your SEO performance.</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Passed Checks</p>
                        <h3 className="text-2xl font-bold text-gray-900">{latestReport.good_points}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Elements that are correctly optimized on your site.</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                        <Layout size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pages Audited</p>
                        <h3 className="text-2xl font-bold text-gray-900">{latestReport.pages_crawled}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Total number of pages analyzed in this audit.</p>
                  </div>
                </div>
              </div>

              {/* Audit Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <Zap size={24} className="text-brand-500" />
                    <h3 className="text-xl font-bold text-gray-900">Performance</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Page Speed</span>
                      <span className="text-sm font-bold text-green-500">Fast</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Image Optimization</span>
                      <span className="text-sm font-bold text-orange-500">Moderate</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Minification</span>
                      <span className="text-sm font-bold text-green-500">Good</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <Layout size={24} className="text-blue-500" />
                    <h3 className="text-xl font-bold text-gray-900">On-Page SEO</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Title Tags</span>
                      <span className="text-sm font-bold text-green-500">Optimized</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Meta Descriptions</span>
                      <span className="text-sm font-bold text-red-500">Missing</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">H1 Headings</span>
                      <span className="text-sm font-bold text-green-500">Good</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={24} className="text-red-500" />
                    <h3 className="text-xl font-bold text-gray-900">Technical</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">HTTPS / SSL</span>
                      <span className="text-sm font-bold text-green-500">Secure</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Robots.txt</span>
                      <span className="text-sm font-bold text-green-500">Found</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sitemap.xml</span>
                      <span className="text-sm font-bold text-red-500">Not Found</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Issues */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                  <h3 className="text-xl font-bold text-gray-900">Top Audit Findings</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {issues.length > 0 ? issues.slice(0, 5).map((issue, i) => (
                    <div key={i} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        issue.severity === 'high' ? "bg-red-50 text-red-500" : 
                        issue.severity === 'medium' ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-500"
                      )}>
                        {issue.severity === 'high' ? <ShieldAlert size={20} /> : 
                         issue.severity === 'medium' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-gray-900">{issue.type}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            issue.severity === 'high' ? "bg-red-100 text-red-700" : 
                            issue.severity === 'medium' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {issue.severity} Priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{issue.message}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-gray-500">
                      No issues found. Your site is looking great!
                    </div>
                  )}
                </div>
                <div className="p-6 bg-gray-50 text-center">
                  <button 
                    onClick={() => window.location.href = '/reports'}
                    className="text-brand-500 font-bold text-sm hover:underline"
                  >
                    View Detailed Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
