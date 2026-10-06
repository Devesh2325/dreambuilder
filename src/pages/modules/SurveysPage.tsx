import React from 'react';
import { ModuleListingView } from './ModuleListingView';
import { Star, MessageSquare, ThumbsUp, Download } from 'lucide-react';
import { storage } from '../../services/storage';

export const SurveysPage: React.FC = () => {
  const responses = storage.getSurveyResponses();

  return (
    <ModuleListingView
      moduleType="survey"
      title="Feedback & NPS Surveys"
      subtitle="Gather user sentiment with 0-10 Net Promoter Scores and qualitative responses"
      icon={Star}
      accentColor="bg-amber-500"
      specializedMetrics={[
        { label: 'Active Surveys', value: '1' },
        { label: 'Net Promoter Score (NPS)', value: '+68', change: '+4.0' },
        { label: 'Total Responses', value: '1,950' },
        { label: 'Response Rate', value: '41.2%' },
      ]}
      extraConfigPreview={
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">NPS Breakdown: 72% Promoters • 24% Passives • 4% Detractors</h4>
              <p className="text-[11px] text-slate-500">
                Responses are stored with privacy-safe pseudonymous visitor tracking.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert('Exporting survey responses to CSV... Download initiated!')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      }
    />
  );
};
