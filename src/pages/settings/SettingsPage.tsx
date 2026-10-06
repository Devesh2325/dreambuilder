import React, { useState } from 'react';
import { useAuth } from '../../services/authContext';
import { Settings, Shield, User, Sparkles, Check, Database } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, organization, updateProfile } = useAuth();

  const [name, setName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, email);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans select-none">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Workspace & Account Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your workspace identity, user profile credentials, and persistence connections.
          </p>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          <span>User Profile Information</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{savedSuccess ? 'Profile Saved' : 'Update Profile'}</span>
          </button>
        </form>
      </div>

      {/* Cloud & Database Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          <span>Database & Environment Status</span>
        </h3>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Storage Engine Mode:</span>
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              High-Fidelity Persistent Local Dev Mode
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Supabase Cloud Sync:</span>
            <span className="text-slate-500 font-mono">
              Ready (Configure VITE_SUPABASE_URL in .env to connect live project)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">AI Assistant Provider:</span>
            <span className="text-slate-700 font-medium">
              Autonomous Schema-Driven Engine (Zero API failure fallback active)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
