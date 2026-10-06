import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500">
            Enter your work email address and we'll send a recovery link
          </p>
        </div>

        {sent ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
            <div className="text-xs font-bold text-emerald-800">Recovery Link Sent</div>
            <p className="text-[11px] text-emerald-600">
              Please check your inbox at <strong>{email}</strong> for instructions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all"
            >
              Send Password Reset Email
            </button>
          </form>
        )}

        <div className="text-center text-xs pt-2">
          <Link to="/login" className="text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
