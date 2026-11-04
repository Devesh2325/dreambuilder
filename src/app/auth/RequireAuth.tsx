import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useSession } from '../session';

export const FullPageSpinner: React.FC = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div role="status" aria-label="Loading" className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const RequireAuth: React.FC = () => {
  const { user, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;
  if (!user) {
    // The return path is kept in router state rather than the URL, so a crafted
    // link can't send someone to another site after they log in.
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
};

/** For login and signup pages: people who are already logged in skip them. */
export const RedirectIfAuthenticated: React.FC = () => {
  const { user, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? ROUTES.home} replace />;
  }
  return <Outlet />;
};
