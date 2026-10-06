import React from 'react';
import { ModuleListingView } from './ModuleListingView';
import { Compass, Crosshair, CheckCircle, ShieldAlert } from 'lucide-react';

export const ToursPage: React.FC = () => {
  return (
    <ModuleListingView
      moduleType="tour"
      title="Product Tours & Walkthroughs"
      subtitle="Guide users step-by-step through core features with point-and-click spotlighting"
      icon={Compass}
      accentColor="bg-indigo-600"
      specializedMetrics={[
        { label: 'Total Walkthroughs', value: '4' },
        { label: 'Avg Tour Completion', value: '78.4%', change: '+6.1%' },
        { label: 'Step Drop-off Rate', value: '11.2%' },
        { label: 'Active Spotlights', value: '14' },
      ]}
      extraConfigPreview={
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Target Selector Health & Fallback Engine</h4>
              <p className="text-[11px] text-slate-500">
                All 14 active tour selectors are verified against host DOM with auto-center fallback enabled.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Selectors 100% Healthy
          </span>
        </div>
      }
    />
  );
};
