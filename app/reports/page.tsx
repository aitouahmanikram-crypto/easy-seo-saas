'use client';

import React from 'react';
import Image from 'next/image';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Gauge } from '@/components/Gauge';
import { 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Monitor, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  ChevronRight,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const historyData = [
  { name: 'Mar 01', score: 78 },
  { name: 'Mar 03', score: 82 },
  { name: 'Mar 05', score: 80 },
  { name: 'Mar 07', score: 87 },
];

const topIssues = [
  { type: '3 pages have duplicate titles', severity: 'High', icon: <AlertCircle className="text-red-500" /> },
  { type: '7 images are missing alt text', severity: 'Medium', icon: <AlertTriangle className="text-orange-500" /> },
  { type: 'Improve page load speed', severity: 'Medium', icon: <RefreshCw className="text-orange-500" /> },
  { type: 'Add meta description', severity: 'Low', icon: <CheckCircle2 className="text-green-500" /> },
  { type: 'Fix broken links', severity: 'Low', icon: <ExternalLink className="text-green-500" /> },
];

import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';
import { projectService } from '@/lib/services/projects';
import { reportService } from '@/lib/services/reports';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SEOReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const { data: projectsData } = await projectService.getProjects();
        if (projectsData && projectsData.length > 0) {
          setProjects(projectsData);
          setSelectedProject(projectsData[0]);
          
          const { data: reportsData } = await reportService.getReportsByProjectId(projectsData[0].id);
          if (reportsData && reportsData.length > 0) {
            setReports(reportsData);
            
            // Fetch full report with issues for the latest one
            const { data: fullReport } = await reportService.getReportById(reportsData[0].id);
            setSelectedReport(fullReport);
          }
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  const handleProjectChange = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
    
    const { data: reportsData } = await reportService.getReportsByProjectId(projectId);
    setReports(reportsData || []);
    if (reportsData && reportsData.length > 0) {
      const { data: fullReport } = await reportService.getReportById(reportsData[0].id);
      setSelectedReport(fullReport);
    } else {
      setSelectedReport(null);
    }
  };

  const handleReportChange = async (reportId: string) => {
    const { data: fullReport } = await reportService.getReportById(reportId);
    setSelectedReport(fullReport);
  };

  const handleExportPDF = () => {
    if (!selectedReport || !selectedProject) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // brand-500
    doc.text('EasySEO Analysis Report', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Project: ${selectedProject.name}`, 20, 30);
    doc.text(`Date: ${format(new Date(selectedReport.created_at), 'PPP p')}`, 20, 37);
    doc.text(`SEO Score: ${selectedReport.score}/100`, 20, 44);

    // Summary
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Summary', 20, 60);
    
    const summaryData = [
      ['Errors', selectedReport.total_errors.toString()],
      ['Warnings', selectedReport.total_warnings.toString()],
      ['Good Points', selectedReport.good_points.toString()],
      ['Pages Crawled', selectedReport.pages_crawled.toString()]
    ];

    autoTable(doc, {
      startY: 65,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Issues
    doc.setFontSize(16);
    doc.text('Identified Issues', 20, (doc as any).lastAutoTable.finalY + 15);

    const issuesData = selectedReport.issues.map((issue: any) => [
      issue.severity.toUpperCase(),
      issue.type,
      issue.message
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Priority', 'Issue', 'Description']],
      body: issuesData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 50 },
        2: { cellWidth: 'auto' }
      }
    });

    doc.save(`EasySEO_Report_${selectedProject.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
          {/* Breadcrumbs & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>SEO Reports</span>
              <ChevronRight size={14} />
              <span className="text-gray-600">Report Details</span>
            </div>
            <div className="flex items-center gap-4">
              <select 
                onChange={(e) => handleProjectChange(e.target.value)}
                value={selectedProject?.id}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm focus:ring-brand-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select 
                onChange={(e) => handleReportChange(e.target.value)}
                value={selectedReport?.id}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm focus:ring-brand-500"
              >
                {reports.map(r => (
                  <option key={r.id} value={r.id}>{format(new Date(r.created_at), 'MMM dd, yyyy HH:mm')}</option>
                ))}
              </select>
              <button 
                onClick={handleExportPDF}
                disabled={!selectedReport}
                className="bg-white border border-gray-100 px-6 py-2.5 rounded-xl font-bold text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
              >
                <Download size={18} />
                Download PDF
              </button>
              <button 
                onClick={() => router.push('/')}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20"
              >
                <RefreshCw size={18} />
                Run New Analysis
              </button>
            </div>
          </div>

          {selectedReport ? (
            <>
              {/* Main Report Header Card */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-12 items-center">
                <div className="w-full lg:w-1/3 aspect-video bg-gray-900 rounded-2xl overflow-hidden relative group">
                  <Image 
                    src={`https://picsum.photos/seed/${selectedProject?.name}/800/450`} 
                    alt="Website Preview" 
                    fill
                    className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <Monitor size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold">Desktop Analysis</p>
                        <p className="text-white/60 text-xs">Analyzed {format(new Date(selectedReport.created_at), 'PPP')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">{selectedProject?.name}</h2>
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw size={14} className="text-brand-500" />
                        Analyzed {format(new Date(selectedReport.created_at), 'PPP p')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <Gauge score={selectedReport.score} size={140} />
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {selectedReport.score > 80 ? 'Great Job! 🚀' : selectedReport.score > 50 ? 'Room for Improvement 📈' : 'Needs Attention ⚠️'}
                      </h3>
                      <p className="text-gray-500 max-w-xs">Your website has <span className="font-bold text-gray-900">{(selectedReport.total_errors || 0) + (selectedReport.total_warnings || 0)} issues</span> that need attention.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-8 border-b border-gray-100">
                {['Overview', 'Issues', 'Performance', 'Content', 'Technical', 'Best Practices'].map((tab, i) => (
                  <button 
                    key={tab} 
                    className={cn(
                      "pb-4 text-sm font-bold transition-all relative",
                      i === 0 ? "text-brand-500" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {tab}
                    {i === 0 && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500 rounded-full"></div>}
                  </button>
                ))}
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Errors</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedReport.total_errors}</p>
                    <p className="text-[10px] font-bold text-red-500">Need to fix</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Warnings</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedReport.total_warnings}</p>
                    <p className="text-[10px] font-bold text-orange-500">Consider improving</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Good Points</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedReport.good_points}</p>
                    <p className="text-[10px] font-bold text-green-500">You&apos;re doing well!</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pages Crawled</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedReport.pages_crawled}</p>
                    <p className="text-[10px] font-bold text-blue-500">Completed successfully</p>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Score Breakdown */}
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">SEO Score Breakdown</h3>
                    <p className="text-gray-500 text-sm mb-8">See how your website scored in each category.</p>
                    
                    <div className="space-y-6">
                      {[
                        { label: 'Technical SEO', score: selectedReport.score > 90 ? 95 : selectedReport.score },
                        { label: 'Content', score: selectedReport.metadata?.wordCount > 600 ? 90 : 70 },
                        { label: 'Performance', score: 88 },
                        { label: 'Best Practices', score: 86 },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-sm font-bold mb-2">
                            <span className="text-gray-700">{item.label}</span>
                            <span className="text-gray-900">{item.score} <span className="text-gray-400">/ 100</span></span>
                          </div>
                          <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-500 rounded-full transition-all duration-1000"
                              style={{ width: `${item.score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Issues */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 flex items-center justify-between border-b border-gray-50">
                      <h3 className="text-xl font-bold text-gray-900">Issues List</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {selectedReport.issues.map((issue: any, i: number) => (
                        <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors",
                              issue.severity === 'high' ? "bg-red-50 text-red-500" :
                              issue.severity === 'medium' ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-500"
                            )}>
                              {issue.severity === 'high' ? <AlertCircle size={20} /> : 
                               issue.severity === 'medium' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{issue.type}</p>
                              <p className="text-xs text-gray-500">{issue.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              issue.severity === 'high' ? "bg-red-50 text-red-600" :
                              issue.severity === 'medium' ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                            )}>
                              {issue.severity}
                            </span>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* SEO Score History */}
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-8">SEO Score History</h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reports.slice().reverse().map(r => ({ name: format(new Date(r.created_at), 'MMM dd'), score: r.score }))}>
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#4f46e5" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                          />
                          <XAxis dataKey="name" hide />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Quick Tip */}
                  <div className="bg-brand-50 p-8 rounded-3xl border border-brand-100 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-brand-500 mx-auto mb-6 shadow-sm">
                      <Lightbulb size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Tip</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Focus on fixing the High and Medium issues first. They have the biggest impact on your SEO score.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-500 mb-8">You haven&apos;t analyzed this project yet.</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl font-bold transition-all"
              >
                Start Analysis
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
