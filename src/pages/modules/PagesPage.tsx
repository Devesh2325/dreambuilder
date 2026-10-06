import React from 'react';
import { ModuleListingView } from './ModuleListingView';
import { Globe, Layout, Search, Sparkles } from 'lucide-react';

export const PagesPage: React.FC = () => {
  return (
    <ModuleListingView
      moduleType="page"
      title="Pages & Landing Sites"
      subtitle="Assemble responsive landing sections, hero banners, feature grids, and pricing tables"
      icon={Globe}
      accentColor="bg-blue-600"
      specializedMetrics={[
        { label: 'Published Pages', value: '3' },
        { label: 'Monthly Visitors', value: '12,900', change: '+24.5%' },
        { label: 'Conversion Rate', value: '22.8%' },
        { label: 'Responsive Viewports', value: '3 / 3' },
      ]}
      extraConfigPreview={
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Structured Section Engine</h4>
              <p className="text-[11px] text-slate-500">
                All pages render with responsive stacking rules, theme color variables, and OpenGraph SEO tags.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
            SEO Indexing: Enabled
          </span>
        </div>
      }
    />
  );
};
