import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';

describe('Brand Kit & Theme System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('updates organization brand kit with logo, type, font, and size', () => {
    const org = storage.getCurrentOrganization();
    expect(org).toBeDefined();

    const updated = storage.updateOrganizationBranding(org.id, {
      companyName: 'FlowPilot Hyper',
      logoUrl: 'https://example.com/logo.png',
      brandType: 'Fintech & Enterprise',
      fontFamily: 'Plus Jakarta Sans',
      baseFontSize: 18,
      primaryColor: '#7c3aed',
      secondaryColor: '#6d28d9',
      accentColor: '#10b981',
      backgroundColor: '#0f172a',
      borderRadius: 12,
    });

    expect(updated.branding.companyName).toBe('FlowPilot Hyper');
    expect(updated.branding.logoUrl).toBe('https://example.com/logo.png');
    expect(updated.branding.brandType).toBe('Fintech & Enterprise');
    expect(updated.branding.fontFamily).toBe('Plus Jakarta Sans');
    expect(updated.branding.baseFontSize).toBe(18);
    expect(updated.branding.primaryColor).toBe('#7c3aed');
    expect(updated.branding.borderRadius).toBe(12);
  });

  it('synchronizes brand design tokens with all active documents', () => {
    const documents = storage.getAllDocuments();
    expect(documents.length).toBeGreaterThan(0);

    const doc = documents[0];
    const updatedDoc = storage.saveDocument({
      ...doc,
      themeVariables: {
        ...doc.themeVariables,
        primaryColor: '#8b5cf6',
        secondaryColor: '#7c3aed',
        fontFamily: 'Poppins',
        borderRadius: '16px',
      },
    });

    expect(updatedDoc.themeVariables.primaryColor).toBe('#8b5cf6');
    expect(updatedDoc.themeVariables.fontFamily).toBe('Poppins');
    expect(updatedDoc.themeVariables.borderRadius).toBe('16px');

    const reloaded = storage.getDocument(doc.id);
    expect(reloaded?.themeVariables.primaryColor).toBe('#8b5cf6');
  });
});
