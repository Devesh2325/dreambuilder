import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart3, BookOpen, ChevronDown, Crown, Image, LayoutDashboard, LayoutTemplate, LifeBuoy, Loader2, LogOut, Moon, PanelLeft, Palette, Settings, ShieldCheck, Sun, Users } from 'lucide-react';
import { MODULE_LIST } from '../../core/modules';
import { isLocalBackend } from '../../data';
import { AuthUser } from '../../data/services';
import { ROUTES } from '../routes';
import { useServices, useSession } from '../session';
import { Icon } from '../shared/Icon';
import { DashboardSkeleton } from '../shared/ui';
import { GoogleTranslateSelector } from '../shared/GoogleTranslate';
import { useIsSuperAdmin } from '../admin/AdminPage';
import { initials } from '../shared/format';
import { useTheme } from '../theme';
import { NudgeBanner } from './NudgeBanner';
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
    className={({ isActive }) => `flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors ${collapsed ? 'justify-center h-8 w-9 mx-auto' : 'px-2.5 h-8'} ${isActive
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

const HeaderProfileMenu: React.FC<{
  user: AuthUser | null;
  onSignOut: () => void;
  isSigningOut: boolean;
}> = ({ user, onSignOut, isSigningOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { workspace } = useWorkspace();

  return (
    <div className="relative">
      <button
        type="button"
        data-tour="profile"
        aria-label="Account menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 transition-colors shadow-sm"
      >
        <span aria-hidden="true" className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold text-white bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-sm">
          {initials(user?.fullName, user?.email)}
        </span>
        <span className="hidden md:block pr-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
          {user?.fullName || 'My Account'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 font-sans">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.fullName || 'User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              {workspace && (
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {workspace.name}
                </span>
              )}
            </div>

            <Link
              to={ROUTES.profile}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span>Profile & Password</span>
            </Link>

            <Link
              to={ROUTES.plans}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Subscription & Plans</span>
            </Link>

            <Link
              to={ROUTES.support}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <LifeBuoy className="w-4 h-4 text-slate-400" />
              <span>Support & Help</span>
            </Link>

            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isSigningOut}
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span>Log out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Shell: React.FC = () => {
  const { auth } = useServices();
  const { user } = useSession();
  const { workspace, memberships, select, isLoading } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const superAdmin = useIsSuperAdmin();

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
    if (error) setIsSigningOut(false);
  };

  return (
    <div className="app-scroll h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <aside className={`relative z-20 shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-[width] duration-200 ${collapsed ? 'w-[60px]' : 'w-60'}`}>
        <div className={`h-14 shrink-0 flex items-center ${collapsed ? 'justify-center' : 'justify-between pl-3 pr-2'}`}>
          {!collapsed && (
            <span className="flex items-center gap-2 min-w-0">
              <span aria-hidden="true" className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-extrabold">F</span>
              <span className="font-extrabold truncate text-slate-900 dark:text-white">FlowPilot</span>
            </span>
          )}
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="group/toggle w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            onClick={toggleCollapsed}
          >
            {collapsed && <span aria-hidden="true" className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-extrabold group-hover/toggle:hidden">F</span>}
            <PanelLeft className={`${iconSize} ${collapsed ? 'hidden group-hover/toggle:block' : ''}`} aria-hidden="true" />
          </button>
        </div>

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

        <nav aria-label="Main" data-tour="nav" className={`no-scrollbar flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2' : 'px-3'} pb-3`}>
          <SideLink to={ROUTES.home} end collapsed={collapsed} label="Dashboard" icon={<LayoutDashboard className={iconSize} aria-hidden="true" />} />
          {superAdmin.data && <SideLink to={ROUTES.admin} collapsed={collapsed} label="Super admin" icon={<ShieldCheck className={iconSize} aria-hidden="true" />} />}
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
          </Group>
          <Group label="Help" collapsed={collapsed}>
            <SideLink to={ROUTES.docs} collapsed={collapsed} label="Docs" icon={<BookOpen className={iconSize} aria-hidden="true" />} />
            <SideLink to={ROUTES.support} collapsed={collapsed} label="Support" icon={<LifeBuoy className={iconSize} aria-hidden="true" />} />
          </Group>
        </nav>

        {isLocalBackend && !collapsed && (
          <div className="shrink-0 p-2 border-t border-slate-200 dark:border-slate-800">
            <p role="note" title="Everything is saved only in this browser. Connect Supabase to go live." className="px-2 py-1 rounded-md text-[11px] font-medium text-amber-800 bg-amber-50 dark:text-amber-200 dark:bg-amber-500/10">
              Demo mode: saved in this browser
            </p>
          </div>
        )}
      </aside>

      <main className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Sleek Modern Application Header with Profile, Plan, Theme, and Translation */}
        <header className="h-14 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              {workspace?.name ? `Workspace: ${workspace.name}` : 'Workspace'}
            </span>
            <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Google Translation Global Selector */}
            <GoogleTranslateSelector variant="header" />

            {/* Current Plan Badge shifted to Header */}
            <Link
              to={ROUTES.plans}
              title="Manage your subscription and usage limits"
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-800/60 dark:text-amber-200 hover:border-amber-400 dark:hover:border-amber-500 transition-all shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
              <span className="capitalize">{workspace?.plan ? `${workspace.plan} Plan` : 'Free Plan'}</span>
            </Link>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
              title={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Proper Profile Menu on Header */}
            <HeaderProfileMenu user={user} onSignOut={handleSignOut} isSigningOut={isSigningOut} />

            {/* Quick Log out button */}
            <button
              type="button"
              disabled={isSigningOut}
              onClick={handleSignOut}
              aria-label="Log out"
              title="Log out"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
            >
              {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <LogOut className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <NudgeBanner />
          {isLoading ? <DashboardSkeleton /> : <Outlet />}
        </div>
      </main>
    </div>
  );
};
