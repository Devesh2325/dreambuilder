// Dates are shown in the time zone chosen under Profile, or the browser's when none is.

let displayZone: string | undefined;

const isValidZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

export const setDisplayTimeZone = (zone: string | null | undefined) => {
  displayZone = zone && isValidZone(zone) ? zone : undefined;
};

export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const allTimeZones = (): string[] => {
  const list = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone');
  return list?.length ? list : [browserTimeZone(), 'UTC'];
};

export const formatDate = (value: string | number | Date, zone: string | undefined = displayZone) =>
  new Date(value).toLocaleDateString(undefined, { timeZone: zone, day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (value: string | number | Date, zone: string | undefined = displayZone) =>
  new Date(value).toLocaleString(undefined, { timeZone: zone, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Analytics are counted per calendar day, so a day must not shift with the time zone. */
export const formatDay = (day: string, withYear = false) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { timeZone: 'UTC', day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined });

export const initials = (name: string | null | undefined, email: string | null | undefined) => {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length) return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase();
  return (email?.[0] ?? '?').toUpperCase();
};
