import { supabase } from '../supabase';

export const suggestionService = {
  async getSuggestionsByAnalysisId(analysisId: string) {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createSuggestions(analysisId: string, suggestions: any[]) {
    const suggestionsToInsert = suggestions.map(s => ({
      analysis_id: analysisId,
      type: s.type || 'technical',
      title: s.title,
      impact_score: parseInt(s.impact_score || s.impact || '0'),
      status: 'open'
    }));

    const { data, error } = await supabase
      .from('suggestions')
      .insert(suggestionsToInsert)
      .select();
    return { data, error };
  },

  async updateSuggestionStatus(id: string, status: 'open' | 'implemented') {
    const { data, error } = await supabase
      .from('suggestions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  }
};
