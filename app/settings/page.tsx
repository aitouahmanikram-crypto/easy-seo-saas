'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  CreditCard, 
  ChevronRight,
  Mail,
  Lock,
  Globe,
  Save,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    toast.success('Profile updated successfully');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action is irreversible.')) {
      toast.error('Account deletion is disabled in this demo.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        
        <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>Account</span>
              <ChevronRight size={14} />
              <span className="text-gray-600">Settings</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Settings</h1>
            <p className="text-gray-500">Manage your account settings and preferences.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <div className="space-y-1">
              {[
                { icon: User, label: 'Profile' },
                { icon: Bell, label: 'Notifications' },
                { icon: Shield, label: 'Security' },
                { icon: CreditCard, label: 'Billing' },
                { icon: Globe, label: 'Preferences' },
              ].map((item) => (
                <button 
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === item.label ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-gray-500 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Main Content */}
            <div className="md:col-span-3 space-y-6">
              {activeTab === 'Profile' ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8">
                  {/* Profile Section */}
                  <form onSubmit={handleSaveProfile} className="space-y-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center text-3xl text-white font-bold shadow-lg shadow-brand-500/20">
                          {user?.email?.[0].toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Profile Photo</h3>
                          <p className="text-sm text-gray-500 mb-4">Update your profile picture and personal details.</p>
                          <div className="flex gap-3">
                            <button type="button" className="bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-600 transition-all">
                              Upload New
                            </button>
                            <button type="button" className="bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                              type="text" 
                              defaultValue="User Name"
                              className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                              type="email" 
                              value={user?.email || ''}
                              disabled
                              className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm text-gray-500 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gray-50"></div>

                    {/* Password Section */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                              type="password" 
                              placeholder="••••••••"
                              className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirm Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                              type="password" 
                              placeholder="••••••••"
                              className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 mx-auto">
                    <SettingsIcon size={40} />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeTab} Settings</h2>
                    <p className="text-gray-500 mb-8">These settings are currently being implemented. Check back soon!</p>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="bg-red-50 rounded-3xl border border-red-100 p-8">
                <h3 className="text-xl font-bold text-red-900 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                <button 
                  onClick={handleDeleteAccount}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
