// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROJECT_TYPES } from '../../core/schema';
import { MODULES } from '../../core/modules';
import { allDocs, DOC_SECTIONS, fillPlaceholders, getDoc } from '../../docs/content';

const embedSource = readFileSync('src/embed/flowpilot.tsx', 'utf8');

describe('documentation', () => {
  it.each(PROJECT_TYPES)('has a guide for %s, linked from the sidebar', (type) => {
    expect(getDoc(type)).toBeDefined();
    expect(DOC_SECTIONS.flatMap((section) => section.slugs)).toContain(type);
  });

  it('lists every guide in the sidebar, and every sidebar item exists', () => {
    const listed = DOC_SECTIONS.flatMap((section) => section.slugs);
    expect(listed.slice().sort()).toEqual(allDocs().map((doc) => doc.slug).sort());
  });

  it('has only working links between guides', () => {
    for (const doc of allDocs()) {
      for (const [, target] of doc.body.matchAll(/\]\(([^)]+)\)/g)) {
        if (/^https?:/.test(target)) continue;
        expect(getDoc(target), `${doc.slug} links to ${target}`).toBeDefined();
      }
    }
  });

  it('shows the install style that matches how each module is delivered', () => {
    for (const type of PROJECT_TYPES) {
      const body = getDoc(type)!.body;
      const { delivery } = MODULES[type];
      if (delivery === 'overlay') {
        expect(body, type).toContain('data-project-id');
        expect(body, type).not.toContain('<div data-flowpilot');
      }
      if (delivery === 'inline' && type !== 'form') expect(body, type).toContain('<div data-flowpilot');
    }
  });

  it('documents every method of the JavaScript API, and only those', () => {
    const body = getDoc('api')!.body;
    const documented = [...body.matchAll(/^## `FlowPilot\.(\w+)\(/gm)].map((match) => match[1]);
    const interfaceBlock = embedSource.match(/export interface FlowPilotApi \{([\s\S]*?)\n\}/)![1];
    const implemented = [...interfaceBlock.matchAll(/^\s+(\w+): \(/gm)].map((match) => match[1]);
    expect(documented.sort()).toEqual(implemented.sort());
  });

  it('documents every event the code records', () => {
    const body = getDoc('api')!.body;
    const sources = ['src/experience/ExperiencePlayer.tsx', 'src/renderer/blocks.tsx', 'src/embed/flowpilot.tsx', 'src/app/public/PublicSitePage.tsx']
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const recorded = new Set<string>();
    for (const [, name] of sources.matchAll(/track\??\.?\(?(?:projectId, )?'([a-z_]+)'/g)) recorded.add(name);
    recorded.add('tour_completed');
    recorded.add('tour_skipped');
    expect(recorded.size).toBeGreaterThan(8);
    for (const name of recorded) expect(body, `${name} is not documented`).toContain(name);
  });

  it('only documents script attributes that exist', () => {
    const attributes = new Set(allDocs().flatMap((doc) => [...doc.body.matchAll(/<script[^>]*\s(data-[a-z-]+)=/g)].map((m) => m[1])));
    expect([...attributes].sort()).toEqual(['data-fonts', 'data-project-id']);
    expect(embedSource).toContain('dataset.projectId');
    expect(embedSource).toContain('dataset.fonts');
  });

  it('fills in placeholders, rejecting unsafe project ids', () => {
    expect(fillPlaceholders('{{ORIGIN}}/{{PROJECT_ID}}', 'https://a.com', 'abc-123')).toBe('https://a.com/abc-123');
    expect(fillPlaceholders('{{PROJECT_ID}}', 'x', null)).toBe('YOUR_PROJECT_ID');
    expect(fillPlaceholders('{{PROJECT_ID}}', 'x', '"><script>')).toBe('YOUR_PROJECT_ID');
  });
});
