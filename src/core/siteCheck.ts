// What the embed reports when the builder checks a customer's page, and what that page's
// security policy has to allow. Shared by the embed and the app, so it has no imports.

export interface SiteCheckReport {
  /** Projects the page asks for, from script tags and placeholders. */
  scriptProjects: string[];
  slotProjects: string[];
  backend: 'demo' | 'ok' | 'unreachable';
  /** Project id to what loading it found. */
  projects: Record<string, 'published' | 'not-published' | 'error'>;
  /** Directive and address of anything the page's policy blocked. */
  blocked: string[];
  path: string;
}

export interface PolicySource {
  directive: string;
  sources: string[];
  /** Plain words for why, for whoever reads this. */
  why: string;
}

const originOf = (url: string | null | undefined) => {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
};

/** Everything a page's Content Security Policy must allow for FlowPilot to work there. */
export function policySources(scriptOrigin: string, backendUrl: string | null | undefined): PolicySource[] {
  const backend = originOf(backendUrl);
  return [
    { directive: 'script-src', sources: [scriptOrigin], why: 'loads the FlowPilot script' },
    ...(backend ? [{ directive: 'connect-src', sources: [backend], why: 'loads your published content and records activity' }] : []),
    { directive: 'style-src', sources: ["'unsafe-inline'", 'https://fonts.googleapis.com'], why: 'styles what FlowPilot shows, kept apart from your own styles' },
    { directive: 'font-src', sources: ['https://fonts.gstatic.com'], why: 'loads the fonts you chose' },
    { directive: 'img-src', sources: ['https:', 'data:'], why: 'shows your pictures' },
    { directive: 'frame-src', sources: ['https://www.youtube-nocookie.com', 'https://player.vimeo.com'], why: 'plays videos, if you add any' },
  ];
}

/** As one line, ready to merge into an existing policy. */
export const policyLine = (sources: PolicySource[]) => sources.map((item) => `${item.directive} ${item.sources.join(' ')}`).join('; ');
