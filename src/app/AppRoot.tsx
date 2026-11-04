import React, { useEffect, useState } from 'react';
import { isBackendAvailable, loadServices } from '../data';
import { AppServices } from '../data/services';
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';
import { FullPageSpinner } from './auth/RequireAuth';

const SetupNotice: React.FC = () => (
  <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
    <div className="max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-slate-700 dark:text-slate-300">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Supabase isn't connected yet</h1>
      <p className="mt-2 text-sm">
        Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code> file, then rebuild. See{' '}
        <code>docs/SUPABASE_SETUP.md</code>.
      </p>
    </div>
  </main>
);

const AppRoot: React.FC = () => {
  const [services, setServices] = useState<AppServices | null>(null);

  useEffect(() => {
    if (isBackendAvailable) loadServices().then(setServices);
  }, []);

  if (!isBackendAvailable) return <SetupNotice />;
  if (!services) return <FullPageSpinner />;
  return (
    <AppProviders services={services}>
      <AppRoutes />
    </AppProviders>
  );
};

export default AppRoot;
