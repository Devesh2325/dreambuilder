// The new app lives under /v2 until the old one is removed. Changing BASE is
// the only routing edit needed at switch-over.
const BASE = '/v2';

export const ROUTES = {
  home: BASE,
  login: `${BASE}/login`,
  signUp: `${BASE}/signup`,
  forgotPassword: `${BASE}/forgot-password`,
  resetPassword: `${BASE}/reset-password`,
} as const;
