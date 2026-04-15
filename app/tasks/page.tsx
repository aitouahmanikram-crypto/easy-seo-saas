'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Trash2, Edit2, X, Loader2, CheckSquare, Clock, RefreshCw, CheckCircle2, AlertCircle, Plus, Search, ChevronDown, MoreVertical, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_TASKS = [
  { task: 'Fix meta description length', project: 'supabase.com', priority: 'High', status: 'In Progress', dueDate: 'Today', assignee: 'Webdigit-SEO' },
];

import { useEffect, useState, useCallback } from 'react';
import { projectService } from '@/lib/services/projects';
import { taskService } from '@/lib/services/tasks';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState('medium');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskAssignee, setEditTaskAssignee] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const { data } = await taskService.getTasksByProjectId(projectId);
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
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
          fetchTasks(projectsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user, fetchTasks]);

  const handleProjectChange = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
    fetchTasks(projectId);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProject) {
      toast.error('Task title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await taskService.createTask(
        selectedProject.id, 
        user!.id,
        newTaskTitle.trim(),
        '', // description
        newTaskPriority,
        newTaskDueDate || undefined
      );
      if (error) throw error;
      if (data) {
        setTasks([data, ...tasks]);
        setNewTaskTitle('');
        setNewTaskPriority('medium');
        setNewTaskDueDate('');
        setNewTaskAssignee('');
        setIsAddingTask(false);
        toast.success('Task created successfully');
      }
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast.error(error.message || 'Failed to add task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTaskTitle.trim() || !editingTask) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await taskService.updateTask(editingTask.id, { 
        title: editTaskTitle.trim(),
        priority: editTaskPriority,
        due_date: editTaskDueDate || undefined
      });
      if (error) throw error;
      if (data) {
        setTasks(tasks.map(t => t.id === editingTask.id ? data : t));
        setEditingTask(null);
        setEditTaskTitle('');
        toast.success('Task updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(error.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      const { data, error } = await taskService.updateTask(taskId, { status });
      if (error) throw error;
      if (data) {
        setTasks(tasks.map(t => t.id === taskId ? data : t));
        toast.success('Status updated');
      }
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (id: string, title: string) => {
    try {
      const { error } = await taskService.deleteTask(id);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== id));
      toast.success('Task deleted successfully');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(error.message || 'Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    highPriority: tasks.filter(t => t.priority === 'high').length,
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
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                <span>Tasks</span>
                <ChevronRight size={14} />
                <span className="text-gray-600">Management</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Task Management</h1>
              <p className="text-gray-500">Organize and track your SEO work. Stay on top of what matters.</p>
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
                onClick={() => setIsAddingTask(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20"
              >
                <Plus size={20} />
                New Task
              </button>
            </div>
          </div>

          {/* Add Task Modal */}
          {isAddingTask && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Create New Task</h3>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Task Title</label>
                    <input 
                      type="text" 
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Optimize meta descriptions"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
                      <select 
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Due Date</label>
                      <input 
                        type="date" 
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Assignee</label>
                    <input 
                      type="text" 
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                      {isSubmitting ? 'Creating...' : 'Create Task'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Task Modal */}
          {editingTask && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                <button 
                  onClick={() => setEditingTask(null)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Edit Task</h3>
                <form onSubmit={handleUpdateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Task Title</label>
                    <input 
                      type="text" 
                      value={editTaskTitle}
                      onChange={(e) => setEditTaskTitle(e.target.value)}
                      placeholder="e.g. Optimize meta descriptions"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
                      <select 
                        value={editTaskPriority}
                        onChange={(e) => setEditTaskPriority(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Due Date</label>
                      <input 
                        type="date" 
                        value={editTaskDueDate}
                        onChange={(e) => setEditTaskDueDate(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Assignee</label>
                    <input 
                      type="text" 
                      value={editTaskAssignee}
                      onChange={(e) => setEditTaskAssignee(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 mb-4">
                <CheckSquare size={20} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Tasks</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
                <Clock size={20} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.pending}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
                <RefreshCw size={20} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">In Progress</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.inProgress}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 mb-4">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Completed</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.completed}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mb-4">
                <AlertCircle size={20} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">High Priority</p>
              <h3 className="text-3xl font-bold text-gray-900 text-red-500">{stats.highPriority}</h3>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table Filters */}
            <div className="p-6 border-b border-gray-50 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="px-8 py-4"><input type="checkbox" className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" /></th>
                  <th className="px-8 py-4">Task</th>
                  <th className="px-8 py-4">Project</th>
                  <th className="px-8 py-4 text-center">Priority</th>
                  <th className="px-8 py-4 text-center">Status</th>
                  <th className="px-8 py-4 text-center">Due Date</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTasks.length > 0 ? filteredTasks.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-8 py-4"><input type="checkbox" className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" /></td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={16} className="text-gray-400" />
                        <p className="font-bold text-gray-900">{item.title}</p>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm font-medium text-gray-500">{selectedProject?.url}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        item.priority === 'high' ? "bg-red-50 text-red-600" :
                        item.priority === 'medium' ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                      )}>
                        {item.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <select 
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none focus:ring-0 cursor-pointer",
                          item.status === 'in_progress' ? "bg-blue-50 text-blue-600" :
                          item.status === 'pending' ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-600"
                        )}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Done</option>
                      </select>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="text-sm font-medium text-gray-500">
                        {item.due_date ? format(new Date(item.due_date), 'MMM dd') : '-'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingTask(item);
                            setEditTaskTitle(item.title);
                            setEditTaskPriority(item.priority || 'medium');
                            setEditTaskDueDate(item.due_date ? item.due_date.split('T')[0] : '');
                            setEditTaskAssignee(item.assigned_to || '');
                          }}
                          className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(item.id, item.title)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-8 py-12 text-center text-gray-500">
                      No tasks found. Create one to stay organized!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-6 border-t border-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500 font-medium">Showing {filteredTasks.length} tasks</p>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:bg-gray-50 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button className="w-8 h-8 rounded-lg bg-brand-500 text-white font-bold text-sm">1</button>
                <button className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:bg-gray-50 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
