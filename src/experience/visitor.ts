// Anonymous ids for frequency rules and analytics. They contain no personal data.

function stored(storage: () => Storage, key: string): string {
  try {
    const existing = storage().getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    storage().setItem(key, created);
    return created;
  } catch {
    // Storage can be blocked by privacy settings. Experiences should still work.
    return crypto.randomUUID();
  }
}

export const getVisitorId = () => stored(() => localStorage, 'fp_visitor');
export const getSessionId = () => stored(() => sessionStorage, 'fp_session');

export function deviceName(width: number): string {
  if (width <= 640) return 'mobile';
  if (width <= 991) return 'tablet';
  return 'desktop';
}
