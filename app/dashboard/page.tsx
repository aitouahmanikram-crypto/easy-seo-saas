'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { 
  BarChart3, 
  Globe, 
  Key, 
  CheckSquare, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  MoreVertical,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const performanceData = [
  { name: 'Mar 01', current: 65, previous: 55 },
  { name: 'Mar 02', current: 72, previous: 60 },
  { name: 'Mar 03', current: 68, previous: 62 },
  { name: 'Mar 04', current: 78, previous: 65 },
  { name: 'Mar 05', current: 75, previous: 68 },
  { name: 'Mar 06', current: 82, previous: 70 },
  { name: 'Mar 07', current: 85, previous: 72 },
];

const recentAnalyses = [
  { website: 'example.com', score: 72, issues: 18, analyzed: '2 hours ago', icon: 'https://www.google.com/s2/favicons?domain=example.com&sz=64' },
  { website: 'myportfolio.dev', score: 89, issues: 7, analyzed: '1 day ago', icon: 'https://www.google.com/s2/favicons?domain=myportfolio.dev&sz=64' },
  { website: 'shopystore.com', score: 64, issues: 31, analyzed: '3 days ago', icon: 'https://www.google.com/s2/favicons?domain=shopystore.com&sz=64' },
  { website: 'blogsite.org', score: 91, issues: 5, analyzed: '5 days ago', icon: 'https://www.google.com/s2/favicons?domain=blogsite.org&sz=64' },
];

import { useRouter } from 'next/navigation';

import { useEffect, useState, useCallback } from 'react';
import { projectService } from '@/lib/services/projects';
import { reportService } from '@/lib/services/reports';
import { keywordService } from '@/lib/services/keywords';
import { taskService } from '@/lib/services/tasks';
import { useAuth } from '@/components/AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Trash2, Edit2, X } from 'lucide-react';

import Image from 'next/image';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    avgScore: 0,
    projectCount: 0,
    keywordCount: 0,
    taskCount: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [editProjectName, setEditProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: projectsData } = await projectService.getProjects();
      if (!projectsData) return;

      const projectsWithReports = await Promise.all(
        projectsData.map(async (p) => {
          const { data: report } = await reportService.getLatestReportByProjectId(p.id);
          return { ...p, latestReport: report };
        })
      );

      setProjects(projectsWithReports);

      // Aggregate stats
      const scores = projectsWithReports.filter(p => p.latestReport).map(p => p.latestReport.score);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      // Fetch keywords and tasks for all projects
      let totalKeywords = 0;
      let totalTasks = 0;
      let pending = 0;
      let inProgress = 0;
      let completed = 0;

      for (const p of projectsData) {
        const { data: keywords } = await keywordService.getKeywordsByProjectId(p.id);
        totalKeywords += keywords?.length || 0;

        const { data: tasks } = await taskService.getTasksByProjectId(p.id);
        totalTasks += tasks?.length || 0;
        tasks?.forEach(t => {
          if (t.status === 'pending') pending++;
          else if (t.status === 'in_progress') inProgress++;
          else if (t.status === 'completed') completed++;
        });
      }

      setStats({
        avgScore,
        projectCount: projectsData.length,
        keywordCount: totalKeywords,
        taskCount: totalTasks,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        completedTasks: completed
      });

      // Mock performance data for now as we don't have historical scores yet
      setPerformanceData([
        { name: 'Mar 01', current: avgScore - 5, previous: avgScore - 10 },
        { name: 'Mar 02', current: avgScore - 2, previous: avgScore - 8 },
        { name: 'Mar 03', current: avgScore - 4, previous: avgScore - 6 },
        { name: 'Mar 04', current: avgScore + 2, previous: avgScore - 4 },
        { name: 'Mar 05', current: avgScore - 1, previous: avgScore - 2 },
        { name: 'Mar 06', current: avgScore + 3, previous: avgScore },
        { name: 'Mar 07', current: avgScore, previous: avgScore - 2 },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !user) {
      toast.error('Project name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await projectService.createProject(newProjectName.trim(), user.id);
      if (error) throw error;
      
      toast.success('Project created successfully');
      setIsAddingProject(false);
      setNewProjectName('');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProjectName.trim() || !editingProject) {
      toast.error('Project name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await projectService.updateProject(editingProject.id, { name: editProjectName.trim() });
      if (error) throw error;
      
      toast.success('Project updated successfully');
      setEditingProject(null);
      setEditProjectName('');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast.error(error.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all associated keywords and reports.`)) {
      return;
    }

    try {
      const { error } = await projectService.deleteProject(id);
      if (error) throw error;
      
      toast.success('Project deleted successfully');
      setProjects(projects.filter(p => p.id !== id));
      // Update stats locally for instant feedback
      setStats(prev => ({
        ...prev,
        projectCount: prev.projectCount - 1
      }));
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error.message || 'Failed to delete project');
    }
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
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard Overview</h1>
              <p className="text-gray-500">Welcome back! Here&apos;s what&apos;s happening with your SEO.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold text-gray-700 shadow-sm">
                <CheckSquare size={16} className="text-brand-500" />
                Latest Analysis
                <Plus size={14} className="ml-2 text-gray-400" />
              </div>
              <button 
                onClick={() => setIsAddingProject(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20"
              >
                <Plus size={20} />
                New Project
              </button>
            </div>
          </div>

          {/* Add Project Modal */}
          {isAddingProject && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                <button 
                  onClick={() => setIsAddingProject(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Add New Project</h3>
                <p className="text-gray-500 mb-6 text-sm">Create a new project to start tracking SEO performance.</p>
                
                <form onSubmit={handleAddProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Project Name</label>
                    <input 
                      type="text" 
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. My Online Store"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsAddingProject(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Project Modal */}
          {editingProject && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                <button 
                  onClick={() => setEditingProject(null)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Edit Project</h3>
                <p className="text-gray-500 mb-6 text-sm">Update your project details.</p>
                
                <form onSubmit={handleUpdateProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Project Name</label>
                    <input 
                      type="text" 
                      value={editProjectName}
                      onChange={(e) => setEditProjectName(e.target.value)}
                      placeholder="e.g. My Online Store"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
                  <TrendingUp size={20} />
                </div>
                <div className="h-8 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData.slice(0, 5)}>
                      <Area type="monotone" dataKey="current" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg SEO Score</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-gray-900">{stats.avgScore}</h3>
                <span className="text-xs font-bold text-green-500 mb-1 flex items-center">
                  <ArrowUpRight size={12} />
                  Real-time
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <Globe size={20} />
                </div>
                <div className="h-8 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData.slice(2, 7)}>
                      <Area type="monotone" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Projects</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-gray-900">{stats.projectCount}</h3>
                <span className="text-xs font-bold text-gray-500 mb-1">Active domains</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                  <Key size={20} />
                </div>
                <div className="h-8 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <Area type="monotone" dataKey="current" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Keywords</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-gray-900">{stats.keywordCount}</h3>
                <span className="text-xs font-bold text-green-500 mb-1 flex items-center">
                  <ArrowUpRight size={12} />
                  Tracked
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <CheckSquare size={20} />
                </div>
                <div className="h-8 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...performanceData].reverse()}>
                      <Area type="monotone" dataKey="current" stroke="#f97316" fill="#f97316" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tasks</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-gray-900">{stats.taskCount}</h3>
                <span className="text-xs font-bold text-orange-500 mb-1">{stats.pendingTasks + stats.inProgressTasks} active</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* SEO Performance Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">SEO Performance</h3>
                <select className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-600 focus:ring-0">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#4f46e5" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="previous" 
                      stroke="#e2e8f0" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tasks Overview (Donut Chart) */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-8">Tasks Overview</h3>
              <div className="relative flex items-center justify-center mb-8">
                <div className="w-48 h-48 rounded-full border-[16px] border-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-900">{stats.taskCount}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</p>
                  </div>
                </div>
                {/* Simulated Donut Segments based on real data */}
                <svg className="absolute w-48 h-48 -rotate-90">
                  <circle 
                    cx="96" cy="96" r="80" fill="none" stroke="#4f46e5" strokeWidth="16" 
                    strokeDasharray="502" 
                    strokeDashoffset={502 - (502 * (stats.pendingTasks / (stats.taskCount || 1)))} 
                    strokeLinecap="round" 
                  />
                  <circle 
                    cx="96" cy="96" r="80" fill="none" stroke="#f97316" strokeWidth="16" 
                    strokeDasharray="502" 
                    strokeDashoffset={502 - (502 * (stats.inProgressTasks / (stats.taskCount || 1)))} 
                    strokeLinecap="round" 
                  />
                  <circle 
                    cx="96" cy="96" r="80" fill="none" stroke="#22c55e" strokeWidth="16" 
                    strokeDasharray="502" 
                    strokeDashoffset={502 - (502 * (stats.completedTasks / (stats.taskCount || 1)))} 
                    strokeLinecap="round" 
                  />
                </svg>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-gray-600">Pending</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{stats.pendingTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm font-medium text-gray-600">In Progress</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{stats.inProgressTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-600">Completed</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{stats.completedTasks}</span>
                </div>
              </div>
              <button 
                onClick={() => router.push('/tasks')}
                className="w-full mt-8 text-brand-500 font-bold text-sm flex items-center justify-center gap-2 hover:gap-3 transition-all"
              >
                View All Tasks
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Analyses Table */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 flex items-center justify-between border-b border-gray-50">
                <h3 className="text-xl font-bold text-gray-900">Recent Analyses</h3>
                <button 
                  onClick={() => router.push('/reports')}
                  className="text-brand-500 font-bold text-sm hover:underline"
                >
                  View All Reports
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                    <th className="px-8 py-4">Website</th>
                    <th className="px-8 py-4">Score</th>
                    <th className="px-8 py-4">Issues</th>
                    <th className="px-8 py-4">Analyzed</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projects.length > 0 ? projects.slice(0, 5).map((project, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <Image 
                            src={`https://www.google.com/s2/favicons?domain=${project.url}&sz=64`} 
                            alt="" 
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-lg bg-gray-100 p-1.5" 
                            referrerPolicy="no-referrer" 
                          />
                          <span className="font-bold text-gray-900">{project.url}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          (project.latestReport?.score || 0) > 80 ? "bg-green-50 text-green-600" : 
                          (project.latestReport?.score || 0) > 60 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
                        )}>
                          {project.latestReport?.score || 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-sm font-bold text-orange-500">
                        {(project.latestReport?.total_errors || 0) + (project.latestReport?.total_warnings || 0)} issues
                      </td>
                      <td className="px-8 py-4 text-sm text-gray-500 font-medium">
                        {project.latestReport ? formatDistanceToNow(new Date(project.latestReport.created_at), { addSuffix: true }) : 'Never'}
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => router.push(`/keywords?project=${project.id}`)}
                            className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
                            title="View Keywords"
                          >
                            <Key size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingProject(project);
                              setEditProjectName(project.name);
                            }}
                            className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
                            title="Edit Project"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProject(project.id, project.name || project.url)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                        No projects found. Start by analyzing a website!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-8">Quick Actions</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => router.push('/')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-brand-50 hover:bg-brand-100 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm group-hover:scale-110 transition-transform">
                    <Globe size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-sm">Analyze Website</p>
                    <p className="text-[11px] text-gray-500">Get a new SEO report</p>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/keywords')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                    <Key size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-sm">Track Keywords</p>
                    <p className="text-[11px] text-gray-500">Monitor your rankings</p>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/tasks')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-green-50 hover:bg-green-100 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-green-500 shadow-sm group-hover:scale-110 transition-transform">
                    <CheckSquare size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-sm">Manage Tasks</p>
                    <p className="text-[11px] text-gray-500">Organize your SEO work</p>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/suggestions')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm group-hover:scale-110 transition-transform">
                    <Sparkles size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-sm">Get AI Suggestions</p>
                    <p className="text-[11px] text-gray-500">Improve with AI</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
