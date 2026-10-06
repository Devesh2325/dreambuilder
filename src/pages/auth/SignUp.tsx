import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../services/authContext';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { updateProfile, createOrganization } = useAuth();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      updateProfile(name, email);
      if (company) createOrganization(company);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg mx-auto shadow-md">
            F
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Start Building with FlowPilot
          </h2>
          <p className="text-xs text-slate-500">
            Create an experience workspace for your product team
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Alex Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Company / Organization</label>
            <input
              type="text"
              placeholder="e.g. Acme SaaS"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Work Email</label>
            <input
              type="email"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              placeholder="Create secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            <span>Create Free Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Already have an account? </span>
          <Link to="/login" className="text-indigo-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
