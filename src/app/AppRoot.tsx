import React from 'react';
import { isSupabaseConfigured } from '../data/supabaseClient';
import { supabaseServices } from '../data/supabaseServices';
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';

const SetupNotice: React.FC = () => (
  <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
    <div className="max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-slate-700 dark:text-slate-300">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Supabase isn't connected yet</h1>
      <p className="mt-2 text-sm">
        Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code> file, then restart
        the dev server. See <code>docs/SUPABASE_SETUP.md</code>.
      </p>
    </div>
  </main>
);

const AppRoot: React.FC = () =>
  isSupabaseConfigured ? (
    <AppProviders services={supabaseServices}>
      <AppRoutes />
    </AppProviders>
  ) : (
    <SetupNotice />
  );

export default AppRoot;
