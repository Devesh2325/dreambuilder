import React from 'react';
import { ModuleListingView } from './ModuleListingView';
import { HelpCircle, Search, MessageSquare, CheckCircle } from 'lucide-react';

export const FAQsPage: React.FC = () => {
  return (
    <ModuleListingView
      moduleType="faq"
      title="FAQs & Help Centers"
      subtitle="Searchable collapsible questions accordions with rich answers and category filters"
      icon={HelpCircle}
      accentColor="bg-emerald-600"
      specializedMetrics={[
        { label: 'FAQ Collections', value: '1' },
        { label: 'Published Questions', value: '12' },
        { label: 'Monthly Searches', value: '4,210', change: '+31.0%' },
        { label: 'Deflected Support Tickets', value: '820' },
      ]}
    />
  );
};
