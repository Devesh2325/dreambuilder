import React from 'react';
import { ModuleListingView } from './ModuleListingView';
import { Megaphone, Bell, Clock, MousePointer } from 'lucide-react';

export const BannersPage: React.FC = () => {
  return (
    <ModuleListingView
      moduleType="banner"
      title="Banners & In-App Alerts"
      subtitle="Broadcast announcements, maintenance notices, and promotions across your web applications"
      icon={Megaphone}
      accentColor="bg-amber-600"
      specializedMetrics={[
        { label: 'Active Banners', value: '1' },
        { label: 'Impressions', value: '8,400', change: '+18.1%' },
        { label: 'Click-Through Rate', value: '14.1%' },
        { label: 'Dismissal Rate', value: '6.4%' },
      ]}
    />
  );
};
