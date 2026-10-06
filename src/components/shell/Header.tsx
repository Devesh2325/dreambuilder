import React, { useState } from 'react';
import { useAuth } from '../../services/authContext';
import { 
  Plus, 
  Building2, 
  ChevronDown, 
  Bell, 
  Search, 
  Check, 
  User, 
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onCreateClick: () => void;
}

export const Header: React.FC<Props> = ({ onCreateClick }) => {
  const { user, organization, organizations, switchOrganization, role } = useAuth();
  const navigate = useNavigate();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between font-sans select-none z-20">
      {/* Left: Organization Workspace Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800"
          >
            <div className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
              {organization.name.charAt(0)}
            </div>
            <span>{organization.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Org Switcher Menu */}
          {isOrgDropdownOpen && (
            <div className="absolute left-0 top-10 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in duration-100">
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
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between"
                >
                  <span className="truncate">{org.name}</span>
                  {org.id === organization.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
              <div className="border-t border-slate-100 mt-1 pt-1">
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
                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Notifications, User Profile */}
      <div className="flex items-center gap-3">
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
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 relative transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user.fullName}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
            <div className="text-left hidden md:block">
              <span className="text-xs font-semibold text-slate-800 block leading-tight">
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
            <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-800 truncate">{user.fullName}</div>
                <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigate('/settings');
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium"
              >
                Profile & Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/team');
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium"
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
