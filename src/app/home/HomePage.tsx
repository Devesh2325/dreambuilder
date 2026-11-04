import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices, useSession } from '../session';

/** Placeholder landing page proving the session and workspace load. Phase 3 replaces it. */
export const HomePage: React.FC = () => {
  const { auth, workspaces } = useServices();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const memberships = useQuery({
    queryKey: ['memberships', user?.id],
    queryFn: () => workspaces.listMemberships(user!.id),
    enabled: Boolean(user),
  });

  const handleSignOut = async () => {
    setSignOutError(null);
    const { error } = await auth.signOut();
    if (error) setSignOutError(error);
    // Cached data must not stay visible to whoever logs in next on this browser.
    else queryClient.clear();
  };

  const current = memberships.data?.[0];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <h1 className="text-2xl font-bold">Welcome{user?.fullName ? `, ${user.fullName}` : ''}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>

        <div className="mt-6 text-sm">
          {memberships.isLoading && <p>Loading your workspace...</p>}
          {memberships.isError && <p role="alert">We couldn't load your workspace. Please refresh the page.</p>}
          {current && (
            <p>
              Workspace: <strong>{current.name}</strong> ({current.role}, {current.plan} plan)
            </p>
          )}
          {memberships.isSuccess && !current && <p>You aren't a member of any workspace yet.</p>}
        </div>

        {signOutError && (
          <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-400">
            {signOutError}
          </p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Log out
        </button>
      </div>
    </main>
  );
};
