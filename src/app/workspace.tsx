import React, { createContext, useContext, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkspaceMembership } from '../data/services';
import { ROLE_PERMISSIONS } from '../types/auth';
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
  const { workspaces } = useServices();
  const { user } = useSession();
  const [selectedId, setSelectedId] = useState(readStoredWorkspace);

  const query = useQuery({
    queryKey: ['memberships', user?.id],
    queryFn: () => workspaces.listMemberships(user!.id),
    enabled: Boolean(user),
  });

  const value = useMemo<WorkspaceState>(() => {
    const memberships = query.data ?? [];
    const workspace = memberships.find((m) => m.organizationId === selectedId) ?? memberships[0] ?? null;
    return {
      workspace,
      memberships,
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
      can: (action) => (workspace ? ROLE_PERMISSIONS[workspace.role].includes(action) : false),
    };
  }, [query.data, query.isLoading, query.isError, selectedId]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export function useWorkspace(): WorkspaceState {
  const state = useContext(WorkspaceContext);
  if (!state) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return state;
}
