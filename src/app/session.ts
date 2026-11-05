import { createContext, useContext } from 'react';
import { AppServices, AuthUser } from '../data/services';

export const ServicesContext = createContext<AppServices | null>(null);

export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used within AppProviders');
  return services;
}

export interface SessionState {
  user: AuthUser | null;
  /** True until the stored session has been checked. Don't redirect while this is true. */
  isLoading: boolean;
  /** Someone was signed in and then wasn't, so where they were isn't for the next person. */
  endedThisVisit: boolean;
}

export const SessionContext = createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used within AppProviders');
  return session;
}
