import React, { useState } from 'react';
import { useAuth } from '../../services/authContext';
import { useTheme } from '../../services/themeContext';
import { 
  Plus, 
  Building2, 
  ChevronDown, 
  Bell, 
  Search, 
  Check, 
  User, 
  ShieldCheck,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onCreateClick: () => void;
}

export const Header: React.FC<Props> = ({ onCreateClick }) => {
  const { user, organization, organizations, switchOrganization, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between font-sans select-none z-20 transition-colors">
      {/* Left: Organization Workspace Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <div className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px]">
              {organization.name.charAt(0)}
            </div>
            <span>{organization.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Org Switcher Menu */}
          {isOrgDropdownOpen && (
            <div className="absolute left-0 top-10 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in duration-100">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Workspace
              </div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => {
                    switchOrganization(org.id);
                    setIsOrgDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-between"
                >
                  <span className="truncate">{org.name}</span>
                  {org.id === organization.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))}
              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOrgDropdownOpen(false);
                    const name = prompt('Enter new workspace name:');
                    if (name) {
                      const { createOrganization } = useAuth();
                      createOrganization(name);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Theme Toggle, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Dark / Light Theme Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Create Experience Primary Action Button */}
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Experience</span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user.fullName}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div className="text-left hidden md:block">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                {user.fullName}
              </span>
              <span className="text-[10px] text-slate-400 capitalize font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-500" />
                {role}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden md:block" />
          </button>

          {isProfileDropdownOpen && (
            <div className="absolute right-0 top-11 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-40 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{user.fullName}</div>
                <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigate('/brand');
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                Brand Kit
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/settings');
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                Profile & Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/team');
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                Manage Team
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
