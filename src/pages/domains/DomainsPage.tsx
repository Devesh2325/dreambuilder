import React, { useState } from 'react';
import { Network, CheckCircle, Plus, ShieldCheck, Globe } from 'lucide-react';

export const DomainsPage: React.FC = () => {
  const [domain, setDomain] = useState('experiences.acme.io');
  const [isAdding, setIsAdding] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Custom Domains & CDN Hosting</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Serve experiences and landing pages on your company branded custom domain.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Domain</span>
        </button>
      </div>

      {/* Connected Domains Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Connected Domains</h3>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>{domain}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  SSL Active & Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                CNAME target: cdn.flowpilot.dev (Cloudflare Edge)
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-medium">Auto-renewing certificate</span>
        </div>
      </div>

      {/* DNS Setup Instructions Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>DNS Verification Instructions</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          To point your custom domain or subdomain, add a <strong>CNAME</strong> record in your DNS provider:
        </p>
        <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-indigo-200 flex items-center justify-between">
          <span>CNAME &nbsp;&nbsp; experiences &nbsp;&nbsp; cdn.flowpilot.dev</span>
          <span className="text-emerald-400 text-[11px]">TTL: Auto</span>
        </div>
      </div>
    </div>
  );
};
