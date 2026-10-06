import React from 'react';
import { ModuleListingView } from './ModuleListingView';
import { AppWindow, MousePointer, Eye, Percent } from 'lucide-react';

export const PopupsPage: React.FC = () => {
  return (
    <ModuleListingView
      moduleType="popup"
      title="Popups & Modals"
      subtitle="Center dialogs, slide-ins, and exit-intent modals with timer and scroll thresholds"
      icon={AppWindow}
      accentColor="bg-rose-600"
      specializedMetrics={[
        { label: 'Active Popups', value: '1' },
        { label: 'Impressions', value: '6,150', change: '+14.8%' },
        { label: 'Conversion CTR', value: '18.7%' },
        { label: 'Exit-Intent Triggers', value: '1,420' },
      ]}
    />
  );
};
