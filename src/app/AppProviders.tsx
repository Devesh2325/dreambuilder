import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppServices, AuthUser } from '../data/services';
import { ServicesContext, SessionContext } from './session';

const SessionProvider: React.FC<{ services: AppServices; children: React.ReactNode }> = ({ services, children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Subscribe first, so a change that lands while getUser is running isn't lost.
    const unsubscribe = services.auth.onChange((next) => {
      setUser(next);
      setIsLoading(false);
    });

    services.auth
      .getUser()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [services]);

  return <SessionContext.Provider value={{ user, isLoading }}>{children}</SessionContext.Provider>;
};

export const AppProviders: React.FC<{ services: AppServices; children: React.ReactNode }> = ({ services, children }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ServicesContext.Provider value={services}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider services={services}>{children}</SessionProvider>
      </QueryClientProvider>
    </ServicesContext.Provider>
  );
};
