import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Compass, 
  PlaySquare, 
  Globe, 
  Megaphone, 
  Menu as MenuIcon, 
  HelpCircle, 
  AppWindow, 
  CheckSquare, 
  Star, 
  LayoutTemplate, 
  Image as ImageIcon, 
  BarChart3, 
  Network, 
  Users, 
  Blocks, 
  CreditCard, 
  Settings,
  ChevronDown,
  Sparkles,
  Layers,
  Palette
} from 'lucide-react';
import { useAuth } from '../../services/authContext';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  count?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { organization } = useAuth();

  const navigationSections: NavSection[] = [
    {
      title: 'Core Workspace',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/projects', label: 'All Projects', icon: FolderKanban },
      ],
    },
    {
      title: 'Experience Builders',
      items: [
        { to: '/tours', label: 'Tours & Walkthroughs', icon: Compass, count: '1' },
        { to: '/demos', label: 'Interactive Demos', icon: PlaySquare, count: '1' },
        { to: '/pages', label: 'Pages & Landing Sites', icon: Globe, count: '1' },
        { to: '/banners', label: 'Banners & Alerts', icon: Megaphone, count: '1' },
        { to: '/menus', label: 'Navigation Menus', icon: MenuIcon, count: '1' },
        { to: '/faqs', label: 'FAQs & Help Centers', icon: HelpCircle, count: '1' },
        { to: '/popups', label: 'Popups & Modals', icon: AppWindow, count: '1' },
        { to: '/checklists', label: 'Checklists', icon: CheckSquare, count: '1' },
        { to: '/surveys', label: 'Feedback & Surveys', icon: Star, count: '1' },
      ],
    },
    {
      title: 'Library & Analytics',
      items: [
        { to: '/templates', label: 'Templates Marketplace', icon: LayoutTemplate },
        { to: '/assets', label: 'Assets & Media', icon: ImageIcon },
        { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Organization & Setup',
      items: [
        { to: '/domains', label: 'Domains & CDN', icon: Network },
        { to: '/brand', label: 'Brand Kit & Style', icon: Palette },
        { to: '/team', label: 'Team Members', icon: Users },
        { to: '/integrations', label: 'Integrations & Webhooks', icon: Blocks },
        { to: '/billing', label: 'Billing & Plans', icon: CreditCard },
        { to: '/settings', label: 'Workspace Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 select-none font-sans shrink-0">
      {/* Brand Logo & Tagline */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-glow">
            F
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block leading-none">
              FlowPilot
            </span>
            <span className="text-[10px] text-slate-400 font-medium">AI Experience SaaS</span>
          </div>
        </NavLink>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 px-1.5 py-0.5 rounded">
          v2.0
        </span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationSections.map((section, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.count && (
                      <span className="text-[10px] font-semibold opacity-60 px-1.5 py-0.2 bg-black/20 rounded">
                        {item.count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Workspace Badge */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 flex items-center justify-between">
          <div className="truncate">
            <span className="text-xs font-semibold text-white block truncate">
              {organization.name}
            </span>
            <span className="text-[10px] text-indigo-400 capitalize font-medium">
              Plan: {organization.plan}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Connected" />
        </div>
      </div>
    </aside>
  );
};
