import React from 'react';
import { ModuleListingView } from './ModuleListingView';
import { PlaySquare, MousePointer, Share2, Layers } from 'lucide-react';

export const DemosPage: React.FC = () => {
  return (
    <ModuleListingView
      moduleType="demo"
      title="Interactive Product Demos"
      subtitle="Create sandbox product walkthroughs with simulated screens, hotspots, and branching"
      icon={PlaySquare}
      accentColor="bg-purple-600"
      specializedMetrics={[
        { label: 'Active Demos', value: '2' },
        { label: 'Avg Interactions / Demo', value: '8.4', change: '+12.0%' },
        { label: 'Completion Rate', value: '64.2%' },
        { label: 'Share Link Clicks', value: '1,840' },
      ]}
      extraConfigPreview={
        <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Public Demo Embed & Branching Logic</h4>
              <p className="text-[11px] text-slate-500">
                Host simulated walkthroughs anywhere via iframe embeds or stand-alone shareable demo links.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-300">
            Branching Paths: Active
          </span>
        </div>
      }
    />
  );
};
