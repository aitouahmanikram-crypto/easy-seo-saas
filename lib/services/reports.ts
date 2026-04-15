import { supabase } from '../supabase';

export const reportService = {
  async getReportsByProjectId(projectId: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getLatestReportByProjectId(projectId: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { data, error };
  },

  async getReportById(id: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*, suggestions(*)')
      .eq('id', id)
      .maybeSingle();
    
    if (data && data.full_report_json) {
      const report = data.full_report_json as any;
      data.issues = report.issues || [];
    } else if (data) {
      data.issues = [];
    }
    
    return { data, error };
  },

  async getIssuesByReportId(reportId: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select('full_report_json')
      .eq('id', reportId)
      .maybeSingle();
    
    if (error || !data) return { data: [], error };
    
    // Extract issues from the full report JSON
    const report = data.full_report_json as any;
    return { data: report?.issues || [], error: null };
  },

  async createReport(projectId: string, reportData: any) {
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert([{
        project_id: projectId,
        score: reportData.seo_score,
        total_errors: reportData.issues.filter((i: any) => i.severity === 'high').length,
        total_warnings: reportData.issues.filter((i: any) => i.severity === 'medium').length,
        good_points: reportData.issues.filter((i: any) => i.severity === 'low').length,
        pages_crawled: 1,
        full_report_json: reportData
      }])
      .select()
      .single();

    if (analysisError) return { data: null, error: analysisError };

    // Update project's last_analyzed_at
    await supabase
      .from('projects')
      .update({ last_analyzed_at: new Date().toISOString() })
      .eq('id', projectId);

    return { data: analysis, error: null };
  }
};
