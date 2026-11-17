import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
  DEFAULT_WEBSITE_CONFIG, getWebsiteConfig, resetWebsiteConfig, saveWebsiteConfig,
} from '../../data/websiteConfigStore';
import { WebsiteFooter } from '../../app/shared/WebsiteFooter';

describe('Website Configuration Store & Footer', () => {
  it('returns default website configuration when empty', () => {
    resetWebsiteConfig();
    const config = getWebsiteConfig();
    expect(config.company.name).toBe('FlowPilot');
    expect(config.footer.columns.length).toBeGreaterThan(0);
    expect(config.faqs.length).toBeGreaterThan(0);
    expect(config.testimonials.length).toBeGreaterThan(0);
  });

  it('persists and updates website configuration', () => {
    const custom = {
      ...DEFAULT_WEBSITE_CONFIG,
      company: {
        ...DEFAULT_WEBSITE_CONFIG.company,
        name: 'Apex Builder Inc',
        tagline: 'Custom tagline for testing',
      },
    };
    saveWebsiteConfig(custom);
    const updated = getWebsiteConfig();
    expect(updated.company.name).toBe('Apex Builder Inc');
    expect(updated.company.tagline).toBe('Custom tagline for testing');

    resetWebsiteConfig();
    expect(getWebsiteConfig().company.name).toBe('FlowPilot');
  });

  it('renders WebsiteFooter with company name, social icons, and columns', () => {
    render(
      <BrowserRouter>
        <WebsiteFooter />
      </BrowserRouter>
    );

    expect(screen.getByText('FlowPilot')).toBeInTheDocument();
    expect(screen.getByTitle('X / Twitter')).toBeInTheDocument();
    expect(screen.getByTitle('LinkedIn')).toBeInTheDocument();
    expect(screen.getByTitle('GitHub')).toBeInTheDocument();
    expect(screen.getByText(/All Systems Operational/)).toBeInTheDocument();
  });
});
