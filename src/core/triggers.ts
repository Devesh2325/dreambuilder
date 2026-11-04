import { Device, Triggers } from './schema';

export function matchesUrl(rules: Triggers['urlRules'], path: string): boolean {
  if (rules.length === 0) return true;
  return rules.some((rule) => {
    if (!rule.value) return true;
    if (rule.type === 'exact') return path === rule.value;
    if (rule.type === 'starts_with') return path.startsWith(rule.value);
    return path.includes(rule.value);
  });
}

export function deviceForWidth(width: number): Device {
  if (width <= 640) return 'mobile';
  if (width <= 991) return 'tablet';
  return 'desktop';
}

export interface SeenStore {
  session: boolean;
  visitor: boolean;
  completed: boolean;
}

export function passesFrequency(frequency: Triggers['frequency'], seen: SeenStore): boolean {
  switch (frequency) {
    case 'always':
      return true;
    case 'once_per_session':
      return !seen.session;
    case 'once_per_visitor':
      return !seen.visitor;
    case 'until_completed':
      return !seen.completed;
  }
}

export function shouldShow(triggers: Triggers, path: string, width: number, seen: SeenStore): boolean {
  if (!matchesUrl(triggers.urlRules, path)) return false;
  if (triggers.devices?.length && !triggers.devices.includes(deviceForWidth(width))) return false;
  return passesFrequency(triggers.frequency, seen);
}
