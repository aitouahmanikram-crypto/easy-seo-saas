import { supabase } from '../supabase';

export const taskService = {
  async getTasksByProjectId(projectId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createTask(projectId: string, userId: string, title: string, description?: string, priority?: string, dueDate?: string) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        project_id: projectId,
        user_id: userId,
        title,
        description: description || '',
        status: 'pending',
        priority: priority || 'medium',
        due_date: dueDate || null
      }])
      .select()
      .single();
    return { data, error };
  },

  async updateTask(id: string, updates: { title?: string; description?: string; status?: string; priority?: string; due_date?: string }) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    return { error };
  }
};
