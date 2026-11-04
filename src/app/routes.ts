// The new app lives under /v2 until the old one is removed. Changing BASE is
// the only routing edit needed at switch-over.
const BASE = '/v2';

export const ROUTES = {
  home: BASE,
  login: `${BASE}/login`,
  signUp: `${BASE}/signup`,
  forgotPassword: `${BASE}/forgot-password`,
  resetPassword: `${BASE}/reset-password`,
  templates: `${BASE}/templates`,
  newFromTemplate: (id: string) => `${BASE}/new/${id}`,
  project: (id: string) => `${BASE}/projects/${id}`,
  studio: (id: string) => `${BASE}/studio/${id}`,
  assets: `${BASE}/assets`,
  analytics: `${BASE}/analytics`,
  team: `${BASE}/team`,
  brand: `${BASE}/brand`,
  settings: `${BASE}/settings`,
  docs: `${BASE}/docs`,
  doc: (slug: string) => `${BASE}/docs/${slug}`,
  invite: (token: string) => `${BASE}/invite/${token}`,
} as const;

/** Address of a published project. Public sites are always at the top level. */
export const publicSitePath = (slug: string) => `/s/${slug}`;
