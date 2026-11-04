import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart3, BookOpen, ChevronDown, Image, LayoutDashboard, LayoutTemplate, LogOut, Moon, Palette, Plus, Settings, Sun, Users } from 'lucide-react';
import { MODULE_LIST } from '../../core/modules';
import { useTheme } from '../../services/themeContext';
import { isLocalBackend } from '../../data';
import { ROUTES } from '../routes';
import { useServices, useSession } from '../session';
import { Icon } from '../shared/Icon';
import { useWorkspace } from '../workspace';

const linkClass = (active: boolean) =>
  `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
    active
      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
  }`;

const SideLink: React.FC<{ to: string; icon: React.ReactNode; children: React.ReactNode; end?: boolean }> = ({ to, icon, children, end }) => (
  <NavLink to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
    {icon}
    {children}
  </NavLink>
);

const ModuleLink: React.FC<{ type: string; icon: string; children: React.ReactNode }> = ({ type, icon, children }) => {
  const [params] = useSearchParams();
  const location = useLocation();
  const active = location.pathname === ROUTES.home && params.get('type') === type;
  return (
    <NavLink to={`${ROUTES.home}?type=${type}`} className={linkClass(active)}>
      <Icon name={icon} />
      {children}
    </NavLink>
  );
};

export const Shell: React.FC = () => {
  const { auth } = useServices();
  const { user } = useSession();
  const { workspace, memberships, select } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(true);

  const handleSignOut = async () => {
    const { error } = await auth.signOut();
    // Cached data must not stay visible to whoever logs in next on this browser.
    if (!error) queryClient.clear();
  };

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <aside className="w-60 shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <p className="px-1 pb-2 font-extrabold text-indigo-600 dark:text-indigo-400">FlowPilot</p>
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
            <p className="px-1 text-sm font-medium truncate">{workspace?.name}</p>
          )}
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <NavLink to={ROUTES.templates} className="flex items-center justify-center gap-1.5 mb-3 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Create new
          </NavLink>
          <SideLink to={ROUTES.home} end icon={<LayoutDashboard className="w-4 h-4" aria-hidden="true" />}>All projects</SideLink>
          {MODULE_LIST.filter((m) => m.primary).map((m) => <ModuleLink key={m.type} type={m.type} icon={m.icon}>{m.plural}</ModuleLink>)}

          <button
            type="button"
            aria-expanded={showMore}
            onClick={() => setShowMore(!showMore)}
            className="w-full flex items-center justify-between px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            More modules
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMore ? '' : '-rotate-90'}`} aria-hidden="true" />
          </button>
          {showMore && MODULE_LIST.filter((m) => !m.primary).map((m) => <ModuleLink key={m.type} type={m.type} icon={m.icon}>{m.plural}</ModuleLink>)}

          <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Workspace</p>
          <SideLink to={ROUTES.templates} icon={<LayoutTemplate className="w-4 h-4" aria-hidden="true" />}>Templates</SideLink>
          <SideLink to={ROUTES.assets} icon={<Image className="w-4 h-4" aria-hidden="true" />}>Assets</SideLink>
          <SideLink to={ROUTES.analytics} icon={<BarChart3 className="w-4 h-4" aria-hidden="true" />}>Analytics</SideLink>
          <SideLink to={ROUTES.brand} icon={<Palette className="w-4 h-4" aria-hidden="true" />}>Brand kit</SideLink>
          <SideLink to={ROUTES.team} icon={<Users className="w-4 h-4" aria-hidden="true" />}>Team</SideLink>
          <SideLink to={ROUTES.settings} icon={<Settings className="w-4 h-4" aria-hidden="true" />}>Settings</SideLink>
          <SideLink to={ROUTES.docs} icon={<BookOpen className="w-4 h-4" aria-hidden="true" />}>Docs</SideLink>
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <p className="px-1 text-xs truncate text-slate-500 dark:text-slate-400">{user?.email}</p>
          <div className="mt-2 flex gap-1">
            <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button type="button" onClick={handleSignOut} className="flex-1 flex items-center justify-center gap-1.5 p-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {isLocalBackend && (
          <p role="note" className="px-4 py-1.5 text-xs text-center text-amber-900 bg-amber-100 dark:text-amber-100 dark:bg-amber-900/60">
            Demo mode: everything is saved only in this browser. Connect Supabase to go live.
          </p>
        )}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
