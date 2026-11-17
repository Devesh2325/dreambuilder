/**
 * Gemini AI Service
 * Connects to Google Gemini 2.0 Flash REST API for live, multimodal web experience generation.
 * Supports text prompts, live URL context, and screenshot vision analysis.
 */

export interface GeminiGenerationInput {
  type: string;
  archetype: string;
  brandName: string;
  domainName: string;
  promptText: string;
  url?: string;
  imageDataUrl?: string;
}

export interface GeminiGeneratedContent {
  companyName: string;
  tagline: string;
  heroHeadline: string;
  heroSubtitle: string;
  features: { title: string; desc: string; icon: string }[];
  deepFeatures?: { title: string; desc: string; tag: string; icon: string }[];
  stats: { value: string; label: string }[];
  ratingScore: number;
  ratingReviews: string;
  faq: { q: string; a: string }[];
  plans: { name: string; price: string; period: string; features: string[]; popular?: boolean }[];
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

const STORAGE_KEY = 'fp_gemini_api_key';

/** Retrieves Gemini API Key from Vite env or user localStorage */
export function getGeminiApiKey(): string {
  try {
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim()) {
      return envKey.trim();
    }
  } catch {
    // env not available in some runtimes
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch {
    // localStorage disabled or SSR
  }

  return '';
}

/** Sets Gemini API Key in localStorage */
export function setGeminiApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage disabled
  }
}

/** Checks whether Gemini AI is connected */
export function isGeminiConnected(): boolean {
  return Boolean(getGeminiApiKey());
}

/**
 * Calls Gemini 2.0 Flash to synthesize live, context-aware web content.
 * Falls back to null if key is missing, network fails, or response is invalid.
 */
export async function callGeminiAi(input: GeminiGenerationInput): Promise<GeminiGeneratedContent | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `You are an elite conversion rate optimization (CRO) and UX designer.
Synthesize complete, realistic, publication-ready website content for the given project.
Return strictly a valid JSON object matching this schema:
{
  "companyName": "Brand Name",
  "tagline": "Short punchy value proposition",
  "heroHeadline": "Compelling, high-converting hero headline",
  "heroSubtitle": "1-2 sentence descriptive subtitle explaining how the platform works and who it helps",
  "features": [
    { "title": "Feature 1", "desc": "Detailed explanation of value", "icon": "Sparkles" },
    { "title": "Feature 2", "desc": "Detailed explanation of value", "icon": "ShieldCheck" },
    { "title": "Feature 3", "desc": "Detailed explanation of value", "icon": "BarChart3" },
    { "title": "Feature 4", "desc": "Detailed explanation of value", "icon": "Zap" }
  ],
  "stats": [
    { "value": "Primary Metric", "label": "Description" },
    { "value": "Secondary Metric", "label": "Description" },
    { "value": "Tertiary Metric", "label": "Description" },
    { "value": "Quaternary Metric", "label": "Description" }
  ],
  "ratingScore": 4.9,
  "ratingReviews": "1,420+ Active Clients",
  "faq": [
    { "q": "Common Question 1?", "a": "Clear, direct answer." },
    { "q": "Common Question 2?", "a": "Clear, direct answer." },
    { "q": "Common Question 3?", "a": "Clear, direct answer." }
  ],
  "plans": [
    { "name": "Starter", "price": "$19", "period": "/mo", "features": ["Feature A", "Feature B", "Feature C"] },
    { "name": "Pro", "price": "$49", "period": "/mo", "features": ["Feature A", "Feature B", "Feature C", "Feature D"], "popular": true },
    { "name": "Enterprise", "price": "$149", "period": "/mo", "features": ["All Features", "Dedicated Manager", "SLA"] }
  ],
  "contactEmail": "hello@brand.com",
  "contactPhone": "+1 (800) 555-0199",
  "contactAddress": "Innovation Hub, Financial District"
}
Ensure all copy matches the real industry archetype: ${input.archetype}, brand: ${input.brandName}, domain: ${input.domainName}.`;

    const contents: any[] = [];
    const parts: any[] = [
      {
        text: `${systemPrompt}\n\nProject Type: ${input.type}\nTarget Domain: ${input.domainName}\nBrand Name: ${input.brandName}\nIndustry Archetype: ${input.archetype}\nUser Instructions / Context: ${input.promptText || 'Standard high-converting flagship site'}`,
      },
    ];

    // If an image mockup was uploaded, pass as multimodal inline_data
    if (input.imageDataUrl && input.imageDataUrl.startsWith('data:')) {
      const match = input.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inline_data: {
            mime_type: match[1],
            data: match[2],
          },
        });
      }
    }

    contents.push({ parts });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API call failed with status:', response.status);
      return null;
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText) as GeminiGeneratedContent;
    if (!parsed.companyName || !parsed.heroHeadline) return null;

    return parsed;
  } catch (err) {
    console.warn('Error executing Gemini API call, using internal synthesis fallback:', err);
    return null;
  }
}
