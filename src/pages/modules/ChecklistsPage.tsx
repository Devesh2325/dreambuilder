import React from 'react';
import { ModuleListingView } from './ModuleListingView';
import { CheckSquare, Trophy, CheckCircle, Award } from 'lucide-react';

export const ChecklistsPage: React.FC = () => {
  return (
    <ModuleListingView
      moduleType="checklist"
      title="Onboarding Checklists"
      subtitle="Gamified user onboarding task progress with celebratory completion triggers"
      icon={CheckSquare}
      accentColor="bg-emerald-600"
      specializedMetrics={[
        { label: 'Active Checklists', value: '1' },
        { label: 'Avg Task Progress', value: '68.3%', change: '+8.4%' },
        { label: 'Full Completions', value: '1,970' },
        { label: 'Rewards Claimed', value: '1,890' },
      ]}
    />
  );
};
