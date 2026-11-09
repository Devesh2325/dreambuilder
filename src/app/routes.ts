import { MODULES } from '../core/modules';
import { ProjectType } from '../core/schema';

export const ROUTES = {
  home: '/',
  login: '/login',
  signUp: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  templates: '/templates',
  module: (type: ProjectType) => MODULES[type].path,
  create: (type?: ProjectType) => (type ? `/create?type=${type}` : '/create'),
  newFromTemplate: (id: string) => `/new/${id}`,
  project: (id: string) => `/projects/${id}`,
  studio: (id: string) => `/studio/${id}`,
  assets: '/assets',
  analytics: '/analytics',
  team: '/team',
  brand: '/brand',
  settings: '/settings',
  profile: '/profile',
  plans: '/plans',
  support: '/support',
  admin: '/admin',
  superAdminLogin: '/admin/login',
  docs: '/docs',
  doc: (slug: string) => `/docs/${slug}`,
  invite: (token: string) => `/invite/${token}`,
} as const;

/** Address of a published project. */
export const publicSitePath = (slug: string) => `/s/${slug}`;
