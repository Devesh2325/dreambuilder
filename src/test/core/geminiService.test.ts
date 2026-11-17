import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getGeminiApiKey, setGeminiApiKey, isGeminiConnected, callGeminiAi } from '../../core/geminiService';
import { generateProjectWithAi } from '../../core/aiGenerator';

describe('geminiService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('manages API key in localStorage', () => {
    expect(isGeminiConnected()).toBe(false);
    expect(getGeminiApiKey()).toBe('');

    setGeminiApiKey('AIzaSyTestKey123');
    expect(isGeminiConnected()).toBe(true);
    expect(getGeminiApiKey()).toBe('AIzaSyTestKey123');

    setGeminiApiKey('');
    expect(isGeminiConnected()).toBe(false);
  });

  it('returns null when API key is missing', async () => {
    const res = await callGeminiAi({
      type: 'page',
      archetype: 'Modern Cloud Platform',
      brandName: 'TestBrand',
      domainName: 'testbrand.com',
      promptText: 'A high converting landing page',
    });
    expect(res).toBeNull();
  });

  it('calls Gemini REST endpoint and parses structured response', async () => {
    setGeminiApiKey('AIzaSyMockKey');

    const mockCandidate = {
      companyName: 'FinPulse AI',
      tagline: 'Algorithmic Intelligence for Modern Traders',
      heroHeadline: 'Trade with Confidence using SEBI-Compliant AI',
      heroSubtitle: 'Next generation financial algorithms designed for precision execution.',
      features: [
        { title: 'Alpha Scanner', desc: 'Real-time breakout alerts', icon: 'Sparkles' },
        { title: 'Risk Guard', desc: 'Auto-hedging and margin monitor', icon: 'ShieldCheck' },
      ],
      stats: [
        { value: '₹4,200 Cr+', label: 'AUM Monitored' },
        { value: '99.9%', label: 'Uptime SLA' },
      ],
      ratingScore: 4.95,
      ratingReviews: '2,500+ Verified Investors',
      faq: [
        { q: 'Is FinPulse SEBI registered?', a: 'Yes, fully certified under RA regulations.' },
      ],
      plans: [
        { name: 'Trader', price: '₹999', period: '/mo', features: ['Daily Calls', 'Live Chat'] },
      ],
      contactEmail: 'advisory@finpulse.ai',
      contactPhone: '+91 98765 43210',
      contactAddress: 'Bandra Kurla Complex, Mumbai',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(mockCandidate) }],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await callGeminiAi({
      type: 'page',
      archetype: 'FinTech & Wealth Advisory',
      brandName: 'FinPulse',
      domainName: 'finpulse.ai',
      promptText: 'Wealth advisory landing page',
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(res).not.toBeNull();
    expect(res?.companyName).toBe('FinPulse AI');
    expect(res?.heroHeadline).toContain('SEBI-Compliant AI');
  });

  it('integrates seamlessly with generateProjectWithAi', async () => {
    setGeminiApiKey('AIzaSyMockKey');

    const mockCandidate = {
      companyName: 'NovaCloud AI',
      tagline: 'Autonomous Cloud Orchestration',
      heroHeadline: 'Deploy Global Cloud Infrastructure with Natural Language',
      heroSubtitle: 'NovaCloud transforms prompts into secure multi-region architectures.',
      features: [
        { title: 'Auto Scaler', desc: 'Instant zero-lag scaling', icon: 'Zap' },
      ],
      stats: [
        { value: '10M+', label: 'Containers Orchestrated' },
      ],
      ratingScore: 4.98,
      ratingReviews: '3,800+ Dev Teams',
      faq: [{ q: 'What clouds are supported?', a: 'AWS, GCP, and Azure.' }],
      plans: [{ name: 'Team', price: '$49', period: '/mo', features: ['Unlimited deploys'] }],
      contactEmail: 'team@novacloud.io',
      contactPhone: '+1 (800) 555-0199',
      contactAddress: 'San Francisco, CA',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockCandidate) }] } }],
      }),
    }));

    const project = await generateProjectWithAi({
      type: 'page',
      mode: 'prompt',
      prompt: 'Modern cloud orchestration tool called NovaCloud',
    }, 'org_test');

    expect(project.variables['company.name']).toBe('NovaCloud AI');
    expect(project.variables['hero.title']).toBe('Deploy Global Cloud Infrastructure with Natural Language');
    expect(project.title).toContain('NovaCloud AI');
  });
});
