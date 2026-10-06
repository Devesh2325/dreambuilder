import React from 'react';
import { ModuleListingView } from './ModuleListingView';
import { Menu as MenuIcon, Layers, Smartphone, Navigation } from 'lucide-react';

export const MenusPage: React.FC = () => {
  return (
    <ModuleListingView
      moduleType="menu"
      title="Navigation Menus & Headers"
      subtitle="Visual hierarchy editor for header bars, mega-menus, dropdowns, and mobile drawers"
      icon={MenuIcon}
      accentColor="bg-cyan-600"
      specializedMetrics={[
        { label: 'Navigation Bars', value: '1' },
        { label: 'Total Links Tracked', value: '24' },
        { label: 'Nav Interactions', value: '22,000', change: '+9.4%' },
        { label: 'Mobile Drawer Opens', value: '6,420' },
      ]}
    />
  );
};
