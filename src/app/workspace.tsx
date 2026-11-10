import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkspaceMembership } from '../data/services';
import { ROLE_PERMISSIONS } from '../types/auth';
import { setDisplayTimeZone } from './shared/format';
import { useServices, useSession } from './session';

interface WorkspaceState {
  workspace: WorkspaceMembership | null;
  memberships: WorkspaceMembership[];
  isLoading: boolean;
  isError: boolean;
  select: (organizationId: string) => void;
  /**
   * For showing and hiding UI only. The database enforces permissions itself, so
   * this is about not offering actions that would fail.
   */
  can: (action: string) => boolean;
  /** Pages re-render when it changes, because this context's value does. */
  timezone: string;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);
const STORAGE_KEY = 'fp_workspace';

function readStoredWorkspace(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { workspaces, profile } = useServices();
  const { user } = useSession();
  const [selectedId, setSelectedId] = useState(readStoredWorkspace);

  const query = useQuery({
    queryKey: ['memberships', user?.id],
    queryFn: () => workspaces.listMemberships(user!.id),
    enabled: Boolean(user),
  });

  const person = useQuery({ queryKey: ['profile', user?.id], queryFn: () => profile.get(), enabled: Boolean(user) });
  const timezone = person.data?.timezone ?? '';
  // Set during render, so the first dates drawn after it changes are already right.
  setDisplayTimeZone(timezone);

  const userId = user?.id;
  useEffect(() => {
    // Only tells super admins who is active, so it never gets in the way.
    if (userId) profile.touchActivity().catch(() => undefined);
  }, [userId, profile]);

  const value = useMemo<WorkspaceState>(() => {
    const memberships = query.data ?? [];
    let workspace = memberships.find((m) => m.organizationId === selectedId) ?? memberships[0] ?? null;

    if (!workspace && user) {
      const defaultName = user.workspaceName || (user.fullName ? `${user.fullName.split(' ')[0]}'s Workspace` : 'My Workspace');
      workspace = {
        organizationId: user.id,
        name: defaultName,
        slug: 'default-workspace',
        plan: 'free',
        role: 'owner',
        branding: {},
      };
    }

    const effectiveMemberships = memberships.length > 0 ? memberships : (workspace ? [workspace] : []);

    return {
      workspace,
      memberships: effectiveMemberships,
      isLoading: query.isLoading,
      isError: query.isError,
      select: (id) => {
        setSelectedId(id);
        try {
          localStorage.setItem(STORAGE_KEY, id);
        } catch {
          // Only a convenience: the first workspace is used next time.
        }
      },
      can: (action) => (workspace ? (ROLE_PERMISSIONS[workspace.role]?.includes(action) ?? true) : true),
      timezone,
    };
  }, [query.data, query.isLoading, query.isError, selectedId, timezone, user]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export function useWorkspace(): WorkspaceState {
  const state = useContext(WorkspaceContext);
  if (!state) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return state;
}
