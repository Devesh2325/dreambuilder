import { describe, expect, it } from 'vitest';
import { extractBrandFromUrl, generateProjectWithAi, rebrandVariablesWithAi } from '../../core/aiGenerator';

describe('aiGenerator', () => {
  it('extracts brand and archetype correctly from website URLs', () => {
    const finuro = extractBrandFromUrl('https://deveshchat.finuro.app/finuro-home');
    expect(finuro.brand.toLowerCase()).toContain('finuro');
    expect(finuro.archetype).toContain('FinTech');

    const apidog = extractBrandFromUrl('https://apidog.com/features');
    expect(apidog.brand).toBe('Apidog');
    expect(apidog.archetype).toBe('Developer Tools');

    const clean = extractBrandFromUrl('myco.io');
    expect(clean.brand).toBe('Myco');
  });

  it('generates a complete landing page from a prompt with ratings, features, and variables', async () => {
    const payload = await generateProjectWithAi(
      {
        type: 'page',
        mode: 'prompt',
        prompt: 'Modern SaaS landing page for an AI code reviewer with customer testimonials and pricing',
        themeTone: 'midnight',
        device: 'desktop',
      },
      'test-org'
    );

    expect(payload.type).toBe('page');
    expect(payload.theme).toBeDefined();
    expect(payload.variables).toBeDefined();
    expect(payload.variables['company.name']).toBeTruthy();
    expect(payload.variables['hero.title']).toBeTruthy();
    expect(payload.variables['rating.score']).toBeGreaterThanOrEqual(4.5);
    expect(Array.isArray(payload.variables['features'])).toBe(true);
    expect(Array.isArray(payload.variables['faqs'])).toBe(true);

    // Document tree validation
    expect(payload.documents).toHaveLength(1);
    const doc = payload.documents[0];
    expect(doc.kind).toBe('page');
    const nodes = doc.content.nodes;
    const nodeTypes = Object.values(nodes).map((n) => n.type);

    expect(nodeTypes).toContain('Heading');
    expect(nodeTypes).toContain('Text');
    expect(nodeTypes).toContain('Button');
    expect(nodeTypes).toContain('Rating');
    expect(nodeTypes).toContain('Card');
    expect(nodeTypes).toContain('Grid');
  });

  it('generates an interactive guided tour with multi-step tooltips and spotlights', async () => {
    const payload = await generateProjectWithAi(
      {
        type: 'tour',
        mode: 'prompt',
        prompt: 'Onboarding walkthrough for a SaaS dashboard with navigation and action steps',
        themeTone: 'indigo',
      },
      'test-org'
    );

    expect(payload.type).toBe('tour');
    expect(payload.documents).toHaveLength(1);
    const doc = payload.documents[0];
    expect(doc.kind).toBe('experience');
    const nodes = doc.content.nodes;
    const tourStepNodes = Object.values(nodes).filter((n) => n.type === 'TourStep');

    expect(tourStepNodes.length).toBeGreaterThanOrEqual(3);
    const layouts = tourStepNodes.map((n) => n.props.layout);
    expect(layouts).toContain('modal');
    expect(layouts).toContain('tooltip');
    expect(layouts).toContain('slideout');
  });

  it('generates a project from website URL input', async () => {
    const payload = await generateProjectWithAi(
      {
        type: 'page',
        mode: 'url',
        url: 'https://apidog.com',
      },
      'test-org'
    );

    expect(payload.variables['company.name']).toBe('Apidog');
    expect(payload.title).toContain('Apidog');
    expect(payload.documents[0].content.nodes).toBeDefined();
  });

  it('generates a project from uploaded image mockup', async () => {
    const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const payload = await generateProjectWithAi(
      {
        type: 'page',
        mode: 'image',
        imageDataUrl: mockDataUrl,
        imageName: 'mockup-preview.png',
      },
      'test-org'
    );

    expect(payload.title).toBeTruthy();
    const nodes = Object.values(payload.documents[0].content.nodes);
    const imageNodes = nodes.filter((n) => n.type === 'Image');
    expect(imageNodes.length).toBeGreaterThan(0);
    expect(imageNodes.some((img) => img.props.src === mockDataUrl)).toBe(true);
  });

  it('rebrands variables in Studio with rebrandVariablesWithAi', () => {
    const original = {
      'company.name': 'Old Name',
      'hero.title': 'Old Title',
    };
    const updated = rebrandVariablesWithAi(original, 'SEBI registered research analyst advisory platform for Devesh');
    expect(updated['company.name']).toContain('Devesh');
    expect(updated['hero.title']).toBeTruthy();
    expect(updated['rating.score']).toBe(4.9);
  });
});
