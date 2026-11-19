import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { ChromeExtensionModal } from '../../app/tours/ChromeExtensionModal';
import { buildContent, el } from '../../templates/dsl';
import { STARTING_BLOCK } from '../../templates';
import { DEFAULT_THEME, NewProject } from '../../core/schema';

describe('Chrome Extension Tour Builder', () => {
  it('renders the 3-step setup guide in ChromeExtensionModal', () => {
    const { unmount } = render(<ChromeExtensionModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('FlowPilot Chrome Extension')).toBeTruthy();
    expect(screen.getByText('Zero Code Needed')).toBeTruthy();
    expect(screen.getByText('Download the Extension Package')).toBeTruthy();
    expect(screen.getByText('Load into Chrome (Developer Mode)')).toBeTruthy();
    expect(screen.getByText('Open Your App & Record Visually')).toBeTruthy();
    expect(screen.getByText('chrome://extensions')).toBeTruthy();

    const downloadLinks = screen.getAllByRole('link', { name: /Download/i });
    expect(downloadLinks.length).toBeGreaterThan(0);
    expect(downloadLinks[0].getAttribute('href')).toBe('/downloads/flowpilot-extension.zip');

    unmount();
  });

  it('switches between setup guide and capabilities tabs in modal', () => {
    const { unmount } = render(<ChromeExtensionModal isOpen={true} onClose={() => {}} />);

    const featuresTab = screen.getByRole('button', { name: /Key Capabilities/i });
    fireEvent.click(featuresTab);

    expect(screen.getByText('Point-and-Click Recording')).toBeTruthy();
    expect(screen.getByText('Smart Resilient Selectors')).toBeTruthy();
    expect(screen.getByText('Userpilot / Whatfix')).toBeTruthy();

    const installTab = screen.getByRole('button', { name: /Setup Guide/i });
    fireEvent.click(installTab);
    expect(screen.getByText('Download the Extension Package')).toBeTruthy();

    unmount();
  });

  it('correctly constructs a tour project and DocContent from extension payload', () => {
    const payload = {
      type: 'tour',
      title: 'App Onboarding Walkthrough',
      builderUrl: 'https://my-saas-app.com/dashboard',
      steps: [
        {
          selector: '#navbar-reports',
          title: 'Reports & Analytics',
          text: 'Reports & Analytics',
          description: 'View real-time conversion rates and visitor activity.',
          path: '/dashboard',
        },
        {
          selector: '[data-tour="settings-btn"]',
          title: 'Workspace Settings',
          text: 'Workspace Settings',
          description: 'Customize your team branding and billing preferences.',
          path: '/settings',
        },
      ],
    };

    // Simulate encoding by extension
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));

    // Simulate decoding by CreatePage
    const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    expect(decoded.title).toBe('App Onboarding Walkthrough');
    expect(decoded.steps).toHaveLength(2);

    const stepElements = decoded.steps.map((step: any, idx: number) =>
      el(
        'TourStep',
        {
          props: {
            selector: step.selector,
            path: step.path,
          },
        },
        [
          el('Heading', { props: { text: step.title, level: 'h4' } }),
          el('Text', { props: { text: step.description } }),
          el('Row', { styles: { display: 'flex', justifyContent: 'flex-end', gap: '8px' } }, [
            el('Button', { props: { text: 'Back', action: 'prev', variant: 'secondary' } }),
            el('Button', {
              props: {
                text: idx === decoded.steps.length - 1 ? 'Finish' : 'Next',
                action: idx === decoded.steps.length - 1 ? 'close' : 'next',
                variant: 'primary',
              },
            }),
          ]),
        ],
      ),
    );

    const content = buildContent('ext', stepElements);

    // Verify tree structure
    expect(content.rootId).toBeTruthy();
    const root = content.nodes[content.rootId];
    expect(root.children).toHaveLength(2);

    const firstStep = content.nodes[root.children[0]];
    expect(firstStep.type).toBe('TourStep');
    expect(firstStep.props.selector).toBe('#navbar-reports');

    const secondStep = content.nodes[root.children[1]];
    expect(secondStep.type).toBe('TourStep');
    expect(secondStep.props.selector).toBe('[data-tour="settings-btn"]');
  });

  it('verifies that the extension directory and zip distribution package are complete', () => {
    const extensionDir = path.resolve('extension');
    const zipPath = path.resolve('public/downloads/flowpilot-extension.zip');

    expect(fs.existsSync(extensionDir)).toBe(true);
    expect(fs.existsSync(zipPath)).toBe(true);

    const zipStat = fs.statSync(zipPath);
    expect(zipStat.size).toBeGreaterThan(10000); // ~16KB

    const manifestPath = path.join(extensionDir, 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('FlowPilot Tour Builder');
    expect(manifest.permissions).toContain('activeTab');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.content_scripts[0].js).toContain('content.js');
  });
});
