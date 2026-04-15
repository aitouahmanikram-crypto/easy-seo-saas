'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
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
  ArrowRight,
  Loader2,
  Globe,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { Tooltip } from '@/components/ui/Tooltip';

interface AnalysisResult {
  domain: string;
  seo_score: number;
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
  }>;
  metadata: {
    title: string;
    metaDescription: string;
    h1: string;
    h2Count: number;
    imageCount: number;
    linkCount: number;
    wordCount: number;
  };
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlParam = searchParams.get('url');
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleExportPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // brand-500
    doc.text('EasySEO Analysis Report', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Domain: ${result.domain}`, 20, 30);
    doc.text(`Date: ${format(new Date(), 'PPP p')}`, 20, 37);
    doc.text(`SEO Score: ${result.seo_score}/100`, 20, 44);

    // Summary
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Summary', 20, 60);
    
    const summaryData = [
      ['Errors', result.issues.filter(i => i.severity === 'high').length.toString()],
      ['Warnings', result.issues.filter(i => i.severity === 'medium').length.toString()],
      ['Good Points', result.issues.filter(i => i.severity === 'low').length.toString()],
      ['Word Count', result.metadata.wordCount.toString()],
      ['Images', result.metadata.imageCount.toString()],
      ['Links', result.metadata.linkCount.toString()]
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

    const issuesData = result.issues.map((issue: any) => [
      issue.severity.toUpperCase(),
      issue.type,
      issue.message
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Severity', 'Issue', 'Message']],
      body: issuesData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 50 },
        2: { cellWidth: 'auto' }
      }
    });

    doc.save(`EasySEO_Analysis_${result.domain}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const performAnalysis = useCallback(async (targetUrl: string) => {
    if (!targetUrl) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: targetUrl,
          userId: user?.id 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze website');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (urlParam) {
      if (!analysisStarted) {
        performAnalysis(urlParam);
        setAnalysisStarted(true);
      }
    } else {
      router.push('/');
    }
  }, [urlParam, router, performAnalysis, analysisStarted]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    performAnalysis(urlParam!);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#020617] items-center justify-center overflow-hidden relative">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 blur-[120px] rounded-full animate-pulse" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-md px-6 relative z-10"
        >
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 border-4 border-brand-500/10 border-t-brand-500 rounded-full mx-auto"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Globe className="text-brand-500" size={40} />
              </motion.div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white tracking-tight">Analyzing {urlParam}</h2>
            <p className="text-gray-400 text-lg leading-relaxed">Our AI is crawling your website and checking for SEO improvements. This usually takes a few seconds...</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 pt-8">
            {[
              { text: 'Crawling HTML structure...', delay: 0 },
              { text: 'Checking meta tags...', delay: 1 },
              { text: 'Analyzing heading hierarchy...', delay: 2 },
              { text: 'Verifying image alt text...', delay: 3 },
              { text: 'Calculating SEO score...', delay: 4 }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex items-center gap-4 text-sm text-gray-500 bg-white/5 p-3 rounded-xl border border-white/5"
              >
                <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                {step.text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#020617] items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 max-w-md px-6"
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20">
            <AlertCircle size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white">Analysis Failed</h2>
            <p className="text-gray-400 text-lg leading-relaxed">{error}</p>
          </div>
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleRetry}
              className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-500/20"
            >
              <RotateCcw size={20} />
              Retry Analysis
            </button>
            <button 
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white font-bold transition-all"
            >
              Try Another URL
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!result) return null;

  const highIssues = result.issues.filter(i => i.severity === 'high');
  const mediumIssues = result.issues.filter(i => i.severity === 'medium');
  const lowIssues = result.issues.filter(i => i.severity === 'low');

  const screenshotUrl = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(urlParam || result.domain)}?w=1200&h=800`;

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
              <span className="text-gray-600">Analysis Results</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleExportPDF}
                className="bg-white border border-gray-100 px-6 py-2.5 rounded-xl font-bold text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
              >
                <Download size={18} />
                Download PDF
              </button>
              <button 
                onClick={() => performAnalysis(urlParam!)}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20"
              >
                <RefreshCw size={18} />
                Re-run Analysis
              </button>
            </div>
          </div>

          {/* Main Report Header Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-12 items-center"
          >
            <div className="w-full lg:w-1/3 aspect-video bg-gray-900 rounded-2xl overflow-hidden relative group border border-gray-100">
              <Image 
                src={screenshotUrl} 
                alt="Website Preview" 
                fill
                className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                    <Monitor size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Desktop Analysis</p>
                    <p className="text-white/60 text-xs">Real-time screenshot</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                Live Preview
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">{result.domain}</h2>
                <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <RefreshCw size={14} className="text-brand-500" />
                    Analyzed just now
                  </span>
                  <a 
                    href={urlParam?.startsWith('http') ? urlParam : `https://${urlParam}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg hover:text-brand-500 transition-colors"
                  >
                    <ExternalLink size={14} className="text-brand-500" />
                    Visit Website
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="relative">
                  <Gauge score={result.seo_score} size={160} />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-sm border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    SEO Score
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {result.seo_score > 80 ? 'Great Job! 🚀' : result.seo_score > 50 ? 'Room for Improvement 📈' : 'Needs Attention ⚠️'}
                  </h3>
                  <p className="text-gray-500 text-lg max-w-sm leading-relaxed">
                    Your website has <span className="font-bold text-gray-900">{result.issues.length} issues</span> that need attention to reach its full potential.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Summary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'High Severity', value: highIssues.length, sub: 'Critical fixes', icon: AlertCircle, color: 'red', tooltip: 'Critical issues that significantly impact your SEO rankings.' },
              { label: 'Medium Severity', value: mediumIssues.length, sub: 'Important', icon: AlertTriangle, color: 'orange', tooltip: 'Important issues that should be addressed soon.' },
              { label: 'Word Count', value: result.metadata.wordCount, sub: 'Content length', icon: CheckCircle2, color: 'green', tooltip: 'Total number of words found on the page.' },
              { label: 'Images', value: result.metadata.imageCount, sub: 'Assets found', icon: FileText, color: 'blue', tooltip: 'Total number of images detected on the page.' }
            ].map((stat, i) => (
              <Tooltip key={i} content={stat.tooltip} className="w-full">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all h-full"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                    stat.color === 'red' ? "bg-red-50 text-red-500" :
                    stat.color === 'orange' ? "bg-orange-50 text-orange-500" :
                    stat.color === 'green' ? "bg-green-50 text-green-500" : "bg-blue-50 text-blue-500"
                  )}>
                    <stat.icon size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className={cn(
                      "text-[10px] font-bold",
                      stat.color === 'red' ? "text-red-500" :
                      stat.color === 'orange' ? "text-orange-500" :
                      stat.color === 'green' ? "text-green-500" : "text-blue-500"
                    )}>{stat.sub}</p>
                  </div>
                </motion.div>
              </Tooltip>
            ))}
          </div>

          {/* Detailed Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Issues List */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-8 flex items-center justify-between border-b border-gray-50">
                  <h3 className="text-xl font-bold text-gray-900">Identified Issues</h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full uppercase">{highIssues.length} High</span>
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full uppercase">{mediumIssues.length} Med</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {result.issues.length > 0 ? (
                    result.issues.map((issue, i) => (
                      <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                            issue.severity === 'high' ? "bg-red-50 text-red-500" :
                            issue.severity === 'medium' ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-500"
                          )}>
                            {issue.severity === 'high' ? <AlertCircle size={24} /> : 
                             issue.severity === 'medium' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{issue.type}</p>
                            <p className="text-sm text-gray-500">{issue.message}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          issue.severity === 'high' ? "bg-red-50 text-red-600 border border-red-100" :
                          issue.severity === 'medium' ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-green-50 text-green-600 border border-green-100"
                        )}>
                          {issue.severity}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-16 text-center">
                      <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">No issues found!</p>
                      <p className="text-gray-500 mt-2">Your website is perfectly optimized for search engines.</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Metadata Breakdown */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-8">Metadata Details</h3>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Page Title</p>
                      <p className="text-base text-gray-800 font-semibold break-words leading-relaxed">{result.metadata.title || 'Not found'}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className={cn(
                          "h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden",
                          (result.metadata.title?.length || 0) >= 50 && (result.metadata.title?.length || 0) <= 70 ? "bg-green-100" : "bg-orange-100"
                        )}>
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
                              (result.metadata.title?.length || 0) >= 50 && (result.metadata.title?.length || 0) <= 70 ? "bg-green-500" : "bg-orange-500"
                            )}
                            style={{ width: `${Math.min(100, ((result.metadata.title?.length || 0) / 70) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{result.metadata.title?.length || 0}/70</span>
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">H1 Heading</p>
                      <p className="text-base text-gray-800 font-semibold break-words leading-relaxed">{result.metadata.h1 || 'Not found'}</p>
                      <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {result.metadata.h1 ? '✅ Found H1 tag' : '❌ Missing H1 tag'}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Meta Description</p>
                    <p className="text-base text-gray-800 font-semibold leading-relaxed">{result.metadata.metaDescription || 'Not found'}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className={cn(
                        "h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden",
                        (result.metadata.metaDescription?.length || 0) >= 120 && (result.metadata.metaDescription?.length || 0) <= 160 ? "bg-green-100" : "bg-orange-100"
                      )}>
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            (result.metadata.metaDescription?.length || 0) >= 120 && (result.metadata.metaDescription?.length || 0) <= 160 ? "bg-green-500" : "bg-orange-500"
                          )}
                          style={{ width: `${Math.min(100, ((result.metadata.metaDescription?.length || 0) / 160) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{result.metadata.metaDescription?.length || 0}/160</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-8">
              {/* Quick Tip */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-brand-500 p-8 rounded-3xl text-center text-white relative overflow-hidden group shadow-xl shadow-brand-500/20"
              >
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-8 border border-white/20">
                  <Lightbulb size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI Recommendation</h3>
                <p className="text-brand-50 leading-relaxed mb-8">
                  {highIssues.length > 0 
                    ? `Focus on fixing the ${highIssues.length} critical issues first. They are significantly hurting your search engine visibility.`
                    : "Your technical SEO looks solid! Consider improving your content depth and building more high-quality backlinks."}
                </p>
                <button 
                  onClick={() => router.push('/suggestions')}
                  className="w-full bg-white text-brand-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-50 transition-all shadow-lg"
                >
                  View AI Suggestions
                  <ArrowRight size={20} />
                </button>
              </motion.div>

              {/* Stats Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-8">Page Statistics</h3>
                <div className="space-y-6">
                  {[
                    { label: 'H2 Headings', value: result.metadata.h2Count, icon: FileText },
                    { label: 'Total Links', value: result.metadata.linkCount, icon: ExternalLink },
                    { label: 'Images Found', value: result.metadata.imageCount, icon: Globe },
                    { label: 'Word Count', value: result.metadata.wordCount, icon: CheckCircle2 }
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                          <stat.icon size={16} />
                        </div>
                        <span className="text-gray-500 font-medium">{stat.label}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#020617] items-center justify-center">
        <Loader2 className="text-brand-500 animate-spin" size={48} />
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}
