import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { IntegrationConfig } from '../../types/modules';
import { Blocks, CheckCircle, AlertCircle, ExternalLink, Settings, ShieldCheck } from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(() => storage.getIntegrations());

  const toggleStatus = (id: string) => {
    const target = integrations.find(i => i.id === id);
    if (!target) return;
    const newStatus = target.status === 'connected' ? 'disconnected' : 'connected';
    storage.updateIntegration(id, { status: newStatus });
    setIntegrations(storage.getIntegrations());
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Blocks className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Integrations & Webhooks</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect FlowPilot to Google Analytics, Slack, webhooks, and your customer data stack.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-subtle flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base text-slate-900">{item.name}</h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize flex items-center gap-1 ${
                    item.status === 'connected'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.status === 'connected' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Provider: {item.provider}
              </span>

              <button
                type="button"
                onClick={() => toggleStatus(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  item.status === 'connected'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                }`}
              >
                {item.status === 'connected' ? 'Disconnect' : 'Connect Integration'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
