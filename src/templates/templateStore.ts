import { TemplateDefinition } from './dsl';

const OVERRIDES_STORAGE_KEY = 'fp_admin_template_overrides';
const CUSTOM_STORAGE_KEY = 'fp_admin_custom_templates';
const TEMPLATES_UPDATED_EVENT = 'fp_templates_updated';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function safeGetItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(TEMPLATES_UPDATED_EVENT));
  } catch {
    // Local storage could be disabled or full
  }
}

export function getTemplateOverrides(): Record<string, Partial<TemplateDefinition>> {
  return safeGetItem<Record<string, Partial<TemplateDefinition>>>(OVERRIDES_STORAGE_KEY, {});
}

export function saveTemplateOverride(id: string, override: Partial<TemplateDefinition>): void {
  const current = getTemplateOverrides();
  current[id] = { ...current[id], ...override };
  safeSetItem(OVERRIDES_STORAGE_KEY, current);
}

export function removeTemplateOverride(id: string): void {
  const current = getTemplateOverrides();
  delete current[id];
  safeSetItem(OVERRIDES_STORAGE_KEY, current);
}

export function getCustomTemplates(): TemplateDefinition[] {
  return safeGetItem<TemplateDefinition[]>(CUSTOM_STORAGE_KEY, []);
}

export function saveCustomTemplate(template: TemplateDefinition): void {
  const current = getCustomTemplates();
  const index = current.findIndex((item) => item.id === template.id);
  if (index >= 0) {
    current[index] = template;
  } else {
    current.push(template);
  }
  safeSetItem(CUSTOM_STORAGE_KEY, current);
}

export function removeCustomTemplate(id: string): void {
  const current = getCustomTemplates().filter((item) => item.id !== id);
  safeSetItem(CUSTOM_STORAGE_KEY, current);
}

export function resetAllTemplateOverrides(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(OVERRIDES_STORAGE_KEY);
    localStorage.removeItem(CUSTOM_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(TEMPLATES_UPDATED_EVENT));
  } catch {
    // No-op
  }
}

export function mergeTemplate(base: TemplateDefinition, override: Partial<TemplateDefinition>): TemplateDefinition {
  return {
    ...base,
    ...override,
    variables: override.variables ?? base.variables,
    themes: override.themes ?? base.themes,
    pages: override.pages ?? base.pages,
    tags: override.tags ?? base.tags,
  };
}

export function subscribeToTemplateChanges(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(TEMPLATES_UPDATED_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(TEMPLATES_UPDATED_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

