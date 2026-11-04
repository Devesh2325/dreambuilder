import { createLocalServices } from './localServices';
import { createPublicApi } from './publicApi';
import { PublicApi } from './services';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './supabaseClient';

const requested = import.meta.env.VITE_BACKEND as string | undefined;

/**
 * Local mode needs no setup. It is chosen explicitly, or automatically during
 * development while Supabase isn't configured. Production never falls back to it,
 * since it would look like saving to a server while keeping data in one browser.
 */
export const isLocalBackend = requested === 'local' || (import.meta.env.DEV && !isSupabaseConfigured);
export const isBackendAvailable = isLocalBackend || isSupabaseConfigured;

export async function loadServices() {
  if (isLocalBackend) return createLocalServices();
  const { supabaseServices } = await import('./supabaseServices');
  return supabaseServices;
}

/** Public pages use this so visitors don't download the login and database client. */
export function getPublicApi(): PublicApi {
  return isLocalBackend ? createLocalServices().publicApi : createPublicApi(supabaseUrl, supabaseAnonKey);
}
