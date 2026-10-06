import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/authContext';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('alex@flowpilot.dev');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg mx-auto shadow-md">
            F
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Sign in to FlowPilot
          </h2>
          <p className="text-xs text-slate-500">
            Design Every Experience. Guide Every User.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 text-slate-800"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-indigo-600 hover:underline text-[11px] font-semibold">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 text-slate-800"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Don't have an account? </span>
          <Link to="/signup" className="text-indigo-600 font-bold hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
