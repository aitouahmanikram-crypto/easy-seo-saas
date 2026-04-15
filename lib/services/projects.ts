import { supabase } from '../supabase';

export const projectService = {
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getProjectById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async createProject(name: string, userId: string, url?: string) {
    const projectUrl = url || name;
    
    // Check for duplicate url for this user
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('url', projectUrl)
      .maybeSingle();

    if (existingProject) {
      return { data: null, error: { message: 'A project with this URL already exists.' } };
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        name, 
        url: projectUrl, 
        user_id: userId 
      }])
      .select()
      .single();
    return { data, error };
  },

  async updateProject(id: string, updates: { name?: string }) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    return { error };
  }
};
