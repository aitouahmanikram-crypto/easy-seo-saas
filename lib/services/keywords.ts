import { supabase } from '../supabase';

export const keywordService = {
  async getKeywordsByProjectId(projectId: string) {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async addKeyword(projectId: string, userId: string, keyword: string, rank?: number) {
    const { data, error } = await supabase
      .from('keywords')
      .insert([{
        project_id: projectId,
        user_id: userId,
        keyword,
        current_rank: rank || null,
        previous_rank: null,
        best_rank: rank || null,
        search_volume: '0'
      }])
      .select()
      .single();
    return { data, error };
  },

  async updateKeyword(id: string, updates: { keyword?: string; current_rank?: number; search_volume?: string }) {
    const { data, error } = await supabase
      .from('keywords')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteKeyword(id: string) {
    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', id);
    return { error };
  }
};
