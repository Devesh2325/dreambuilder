import React, { useState } from 'react';
import { useAuth } from '../../services/authContext';
import { UserRole } from '../../types/auth';
import { Users, Plus, ShieldCheck, Trash2, Mail, Check } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { members, inviteMember, removeMember, role, organization } = useAuth();
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    inviteMember(inviteEmail.trim(), inviteRole, inviteName.trim());
    setIsInviting(false);
    setInviteEmail('');
    setInviteName('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Team Members & Permissions</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Collaborate across your experiences with granular role-based access control.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsInviting(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Teammate</span>
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Active Members ({members.length})
          </h3>
          <span className="text-xs text-slate-400">Workspace: {organization.name}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.id} className="p-4 hover:bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={m.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={m.user.fullName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-900">{m.user.fullName}</h4>
                  <span className="text-[11px] text-slate-400">{m.user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="capitalize font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full text-[11px]">
                  {m.role}
                </span>

                {m.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Permission Matrix Guide */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Role Permissions Matrix</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="block text-slate-900 mb-1">Owner</strong>
            <p className="text-[11px] text-slate-500">Full control over billing, deletions, team management, and workspace settings.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="block text-slate-900 mb-1">Admin</strong>
            <p className="text-[11px] text-slate-500">Manage experiences, invite team members, configure integrations, and publish live.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="block text-slate-900 mb-1">Editor</strong>
            <p className="text-[11px] text-slate-500">Create and edit visual experiences, run AI modifications, and publish updates.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="block text-slate-900 mb-1">Viewer</strong>
            <p className="text-[11px] text-slate-500">Read-only access to view drafts, live previews, and analytics reports.</p>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Smith"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="jordan@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="editor">Editor (Can build & publish)</option>
                  <option value="admin">Admin (Can manage team)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviting(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
