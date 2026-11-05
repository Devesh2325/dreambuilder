import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart3, BookOpen, ChevronLeft, ChevronRight, Image, LayoutDashboard, LayoutTemplate, Loader2, LogOut, Moon, Palette, Settings, Sun, Users } from 'lucide-react';
import { MODULE_LIST } from '../../core/modules';
import { isLocalBackend } from '../../data';
import { ROUTES } from '../routes';
import { useServices, useSession } from '../session';
import { Icon } from '../shared/Icon';
import { DashboardSkeleton } from '../shared/ui';
import { CreateButton } from '../templates/CreateButton';
import { useTheme } from '../theme';
import { useWorkspace } from '../workspace';

const STORAGE_KEY = 'fp_sidebar_collapsed';

const readCollapsed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const SideLink: React.FC<{ to: string; icon: React.ReactNode; label: string; collapsed: boolean; end?: boolean }> = ({ to, icon, label, collapsed, end }) => (
  <NavLink
    to={to}
    end={end}
    title={collapsed ? label : undefined}
    aria-label={collapsed ? label : undefined}
    className={({ isActive }) => `flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors ${collapsed ? 'justify-center h-8 w-9 mx-auto' : 'px-2.5 h-8'} ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    <span className="shrink-0">{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

const Group: React.FC<{ label: string; collapsed: boolean; children: React.ReactNode }> = ({ label, collapsed, children }) => (
  <div className="space-y-0.5">
    {collapsed
      ? <div className="mx-3 my-2 border-t border-slate-200 dark:border-slate-800" aria-hidden="true" />
      : <p className="px-2.5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>}
    {children}
  </div>
);

const iconSize = 'w-[18px] h-[18px]';

export const Shell: React.FC = () => {
  const { auth } = useServices();
  const { user } = useSession();
  const { workspace, memberships, select, isLoading } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      // Only a convenience: it opens expanded next time.
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await auth.signOut();
    setIsSigningOut(false);
    // Cached data must not stay visible to whoever logs in next on this browser.
    if (!error) queryClient.clear();
  };

  return (
    <div className="app-scroll h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <aside className={`relative z-20 shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-[width] duration-200 ${collapsed ? 'w-[64px]' : 'w-60'}`}>
        <div className={`h-14 shrink-0 flex items-center gap-2 ${collapsed ? 'justify-center' : 'px-3'}`}>
          <span aria-hidden="true" className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-extrabold">F</span>
          {!collapsed && <span className="font-extrabold text-slate-900 dark:text-white">FlowPilot</span>}
        </div>
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[17px] w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition-colors"
          onClick={toggleCollapsed}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />}
        </button>

        {!collapsed && (
          <div className="px-3 pb-2">
            {memberships.length > 1 ? (
              <select
                aria-label="Workspace"
                value={workspace?.organizationId}
                onChange={(event) => {
                  select(event.target.value);
                  queryClient.invalidateQueries({ queryKey: ['projects'] });
                  navigate(ROUTES.home);
                }}
                className="w-full text-sm rounded-lg px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border-0"
              >
                {memberships.map((m) => <option key={m.organizationId} value={m.organizationId}>{m.name}</option>)}
              </select>
            ) : (
              <p className="px-1 text-sm font-medium truncate text-slate-500 dark:text-slate-400">{workspace?.name}</p>
            )}
          </div>
        )}

        <div className={`shrink-0 ${collapsed ? 'px-2 pb-2' : 'px-3 pb-2'}`}>
          <CreateButton iconOnly={collapsed} className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors" />
        </div>

        <nav aria-label="Main" className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2' : 'px-3'} pb-3`}>
          <SideLink to={ROUTES.home} end collapsed={collapsed} label="Dashboard" icon={<LayoutDashboard className={iconSize} aria-hidden="true" />} />
          <Group label="Build" collapsed={collapsed}>
            {MODULE_LIST.filter((m) => m.primary).map((m) => <SideLink key={m.type} to={m.path} collapsed={collapsed} label={m.plural} icon={<Icon name={m.icon} className={iconSize} />} />)}
          </Group>
          <Group label="Engage" collapsed={collapsed}>
            {MODULE_LIST.filter((m) => !m.primary).map((m) => <SideLink key={m.type} to={m.path} collapsed={collapsed} label={m.plural} icon={<Icon name={m.icon} className={iconSize} />} />)}
          </Group>
          <Group label="Library" collapsed={collapsed}>
            <SideLink to={ROUTES.templates} collapsed={collapsed} label="Template library" icon={<LayoutTemplate className={iconSize} aria-hidden="true" />} />
            <SideLink to={ROUTES.assets} collapsed={collapsed} label="Assets" icon={<Image className={iconSize} aria-hidden="true" />} />
            <SideLink to={ROUTES.brand} collapsed={collapsed} label="Brand kit" icon={<Palette className={iconSize} aria-hidden="true" />} />
          </Group>
          <Group label="Workspace" collapsed={collapsed}>
            <SideLink to={ROUTES.analytics} collapsed={collapsed} label="Analytics" icon={<BarChart3 className={iconSize} aria-hidden="true" />} />
            <SideLink to={ROUTES.team} collapsed={collapsed} label="Team" icon={<Users className={iconSize} aria-hidden="true" />} />
            <SideLink to={ROUTES.settings} collapsed={collapsed} label="Settings" icon={<Settings className={iconSize} aria-hidden="true" />} />
            <SideLink to={ROUTES.docs} collapsed={collapsed} label="Docs" icon={<BookOpen className={iconSize} aria-hidden="true" />} />
          </Group>
        </nav>

        <div className={`shrink-0 border-t border-slate-200 dark:border-slate-800 ${collapsed ? 'p-2 space-y-1' : 'p-3'}`}>
          {isLocalBackend && !collapsed && (
            <p role="note" title="Everything is saved only in this browser. Connect Supabase to go live." className="mb-2 px-2 py-1 rounded-md text-[11px] font-medium text-amber-800 bg-amber-50 dark:text-amber-200 dark:bg-amber-500/10">
              Demo mode: saved in this browser only
            </p>
          )}
          {!collapsed && <p className="px-1 mb-1 text-xs truncate text-slate-500 dark:text-slate-400">{user?.email}</p>}
          <div className={collapsed ? 'flex flex-col items-center gap-1' : 'flex items-center gap-1'}>
            <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'} title={theme === 'dark' ? 'Use light theme' : 'Use dark theme'} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button type="button" disabled={isSigningOut} onClick={handleSignOut} aria-label={collapsed ? 'Log out' : undefined} title={collapsed ? 'Log out' : undefined} className={`flex items-center justify-center gap-1.5 p-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 ${collapsed ? '' : 'flex-1'}`}>
              {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <LogOut className="w-4 h-4" aria-hidden="true" />}
              {!collapsed && 'Log out'}
            </button>
          </div>
        </div>
      </aside>

      <main className="relative flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-6">
          {isLoading ? <DashboardSkeleton /> : <Outlet />}
        </div>
      </main>
    </div>
  );
};
