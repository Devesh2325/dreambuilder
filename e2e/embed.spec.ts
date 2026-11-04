import { expect, Page, test } from '@playwright/test';
import { ProjectType } from '../src/core/schema';
import { initialValues, projectFromTemplate, templatesFor } from '../src/templates';
import type { ProjectSettings } from '../src/core/schema';

const HOST = 'http://localhost:5198';

interface Rpc {
  name: string;
  body: Record<string, any>;
}

/** Answers the embed's calls as Supabase would, recording what it sent. */
async function mockBackend(page: Page, type: ProjectType, options: { settings?: Partial<ProjectSettings>; variables?: Record<string, unknown>; templateIndex?: number } = {}) {
  const template = templatesFor(type)[options.templateIndex ?? 0];
  const values = { ...initialValues(template), ...options.variables };
  const project = projectFromTemplate(template, 'org', values, template.themes[0].theme);
  const snapshot = {
    project: {
      id: 'project-1',
      type,
      title: project.title,
      slug: 'demo',
      variables: values,
      theme: project.theme,
      settings: { ...project.settings, ...options.settings },
    },
    documents: project.documents.map((doc, position) => ({ id: `doc-${position}`, position, seo: {}, ...doc })),
  };

  const calls: Rpc[] = [];
  let checklist: unknown = [];
  await page.route('http://supabase.test/rest/v1/rpc/**', async (route) => {
    const name = route.request().url().split('/').pop()!;
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    const body = route.request().postDataJSON();
    calls.push({ name, body });
    let result: unknown = null;
    if (name === 'get_published_experience') result = body.p_project === 'project-1' ? snapshot : null;
    if (name === 'submit_form') result = true;
    if (name === 'track_events') result = body.p_events.length;
    if (name === 'get_checklist_progress') result = checklist;
    if (name === 'save_checklist_progress') checklist = body.p_completed;
    await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(result) });
  });
  return { calls, snapshot };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const noRules = { triggers: { urlRules: [], delaySeconds: 0, frequency: 'always' as const } };

const trackedTypes = (calls: Rpc[]) =>
  calls.filter((call) => call.name === 'track_events').flatMap((call) => call.body.p_events.map((event: { type: string }) => event.type));

test.describe('embed script on another origin', () => {
  test('tour: targets real elements, moves through steps, reports analytics', async ({ page }) => {
    const { calls } = await mockBackend(page, 'tour', {
      settings: noRules,
      variables: { 'nav.selector': '#main-nav', 'action.selector': '[data-tour="reports"]' },
    });
    await page.goto(`${HOST}/app`);

    await expect(page.getByRole('heading', { name: /Welcome to Acme/ })).toBeVisible();
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByRole('heading', { name: 'Find your way' })).toBeVisible();
    const spotlight = page.locator('[data-fp-spotlight]');
    await expect(spotlight).toBeVisible();
    const navBox = (await page.locator('#main-nav').boundingBox())!;
    const spotBox = (await spotlight.boundingBox())!;
    expect(Math.abs(spotBox.width - (navBox.width + 12))).toBeLessThan(2);

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Get started' })).toBeVisible();
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page.getByRole('heading', { name: 'Get started' })).toHaveCount(0);

    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await expect.poll(() => trackedTypes(calls)).toContain('tour_completed');
    expect(trackedTypes(calls)).toContain('impression');
    expect(trackedTypes(calls)).toContain('tour_step_completed');
  });

  test('tour: continues at the same step after moving to another page', async ({ page }) => {
    await mockBackend(page, 'tour', { settings: { triggers: { urlRules: [], delaySeconds: 0, frequency: 'once_per_session' } } });
    await page.goto(`${HOST}/app`);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByRole('heading', { name: 'Find your way' })).toBeVisible();

    // Single-page navigation keeps it showing.
    await page.evaluate(() => history.pushState({}, '', '/other'));
    await expect(page.getByRole('heading', { name: 'Find your way' })).toBeVisible();
  });

  test('tour: does not leak styles into or out of the customer page', async ({ page }) => {
    await mockBackend(page, 'tour', { settings: noRules });
    await page.goto(`${HOST}/app`);
    await expect(page.getByRole('heading', { name: /Welcome to Acme/ })).toBeVisible();

    const hostFont = await page.locator('#title').evaluate((el) => getComputedStyle(el).fontSize);
    expect(hostFont).toBe('32px');
    const shadowRoots = await page.locator('[data-flowpilot-host]').evaluateAll((hosts) => hosts.map((h) => Boolean(h.shadowRoot)));
    expect(shadowRoots).toEqual([true]);
    const leaked = await page.evaluate(() => document.head.querySelectorAll('style').length);
    expect(leaked).toBe(0);
  });

  test('frequency: once per visitor is not shown again', async ({ page }) => {
    await mockBackend(page, 'banner', { settings: { triggers: { urlRules: [], delaySeconds: 0, frequency: 'once_per_visitor' } } });
    await page.goto(`${HOST}/`);
    await expect(page.getByText('We just launched something new!')).toBeVisible();
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.getByText('We just launched something new!')).toHaveCount(0);
  });

  test('URL rules apply, including on single-page navigation', async ({ page }) => {
    await mockBackend(page, 'banner', { settings: { triggers: { urlRules: [{ type: 'starts_with', value: '/other' }], delaySeconds: 0, frequency: 'always' } } });
    await page.goto(`${HOST}/`);
    await page.waitForTimeout(300);
    await expect(page.getByText('We just launched something new!')).toHaveCount(0);

    await page.locator('#spa-link').click();
    await expect(page.getByText('We just launched something new!')).toBeVisible();

    await page.evaluate(() => history.pushState({}, '', '/elsewhere'));
    await expect(page.getByText('We just launched something new!')).toHaveCount(0);
  });

  test('popup: waits for the delay, and closes', async ({ page }) => {
    await mockBackend(page, 'popup', { settings: { triggers: { urlRules: [], delaySeconds: 1, frequency: 'always' } } });
    await page.goto(`${HOST}/`);
    await page.waitForTimeout(400);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('popup: exit intent shows when the mouse leaves the window', async ({ page }) => {
    await mockBackend(page, 'popup', { templateIndex: 1, settings: { triggers: { urlRules: [], delaySeconds: 0, exitIntent: true, frequency: 'always' } } });
    await page.goto(`${HOST}/`);
    await page.waitForTimeout(300);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientY: -1, bubbles: true })));
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('inline form: mounts in the chosen spot and submits to the backend', async ({ page }) => {
    const { calls } = await mockBackend(page, 'form');
    await page.goto(`${HOST}/?inline=1`);
    const slot = page.locator('#slot');
    await expect(slot.getByRole('heading', { name: 'Contact us' })).toBeVisible();

    await slot.getByLabel(/Name/).fill('Vera');
    await slot.getByLabel(/Email/).fill('vera@example.com');
    await slot.getByLabel(/Message/).fill('Hello');
    await slot.getByRole('button', { name: 'Send' }).click();
    await expect(slot.getByText("Thanks! We'll be in touch.")).toBeVisible();

    const submission = calls.find((call) => call.name === 'submit_form')!;
    expect(submission.body.p_project).toBe('project-1');
    expect(submission.body.p_data).toMatchObject({ name: 'Vera', email: 'vera@example.com', message: 'Hello' });
  });

  test('checklist: saves progress and restores it after reload', async ({ page }) => {
    await mockBackend(page, 'checklist', { settings: noRules });
    await page.goto(`${HOST}/`);
    const item = page.getByRole('checkbox', { name: /Complete your profile/ });
    await item.check();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');

    await page.reload();
    await expect(page.getByRole('checkbox', { name: /Complete your profile/ })).toBeChecked();
  });

  test('survey: rating is required, then sent', async ({ page }) => {
    const { calls } = await mockBackend(page, 'survey', { settings: noRules });
    await page.goto(`${HOST}/`);
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(200);
    expect(calls.some((call) => call.name === 'submit_form')).toBe(false);

    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Thanks for your feedback!')).toBeVisible();
    expect(calls.find((call) => call.name === 'submit_form')!.body.p_data.score).toBe('9');
  });

  test('demo: hotspots move between screens', async ({ page }) => {
    const { calls } = await mockBackend(page, 'demo');
    await page.goto(`${HOST}/?inline=1`);
    await page.getByRole('button', { name: 'Start here' }).click();
    await expect(page.getByRole('button', { name: 'Then choose an option' })).toBeVisible();
    expect(calls.length).toBeGreaterThan(0);
  });

  test('JavaScript API: start ignores rules, and track records events', async ({ page }) => {
    const { calls } = await mockBackend(page, 'banner', { settings: { triggers: { urlRules: [{ type: 'exact', value: '/never' }], delaySeconds: 0, frequency: 'always' } } });
    await page.goto(`${HOST}/`);
    await page.waitForTimeout(300);
    await expect(page.getByText('We just launched something new!')).toHaveCount(0);

    await page.evaluate(async () => {
      await (window as any).FlowPilot.start('project-1');
      (window as any).FlowPilot.identify('user_42');
      (window as any).FlowPilot.track('project-1', 'Upgrade Clicked!', { plan: 'pro' });
    });
    await expect(page.getByText('We just launched something new!')).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await expect.poll(() => trackedTypes(calls)).toContain('upgrade_clicked_');
    const event = calls.filter((c) => c.name === 'track_events').flatMap((c) => c.body.p_events).find((e: any) => e.type === 'upgrade_clicked_');
    expect(event.visitorId).toBe('user:user_42');
  });

  test('a wrong project id does nothing, with a console warning and no page errors', async ({ page }) => {
    await mockBackend(page, 'banner');
    const warnings: string[] = [];
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${HOST}/?project=wrong`);
    await expect.poll(() => warnings.join()).toContain("isn't published");
    expect(errors).toEqual([]);
    await expect(page.locator('[data-flowpilot-host]')).toHaveCount(0);
  });

  test('backend failure never breaks the customer page', async ({ page }) => {
    await page.route('http://supabase.test/**', (route) => route.abort());
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${HOST}/`);
    await expect(page.locator('#title')).toBeVisible();
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test('picker: clicking an element sends a selector back to the page that opened it', async ({ page, context }) => {
    await mockBackend(page, 'banner');
    await page.goto(`${HOST}/`);
    const messages = page.evaluate(() => new Promise<any>((resolve) => {
      window.addEventListener('message', (event) => resolve({ data: event.data, origin: event.origin }));
    }));

    const popupPromise = context.waitForEvent('page');
    await page.evaluate((host) => {
      window.open(`${host}/app#fp-pick=nonce-1&origin=${encodeURIComponent(window.location.origin)}`, 'picker');
    }, HOST);
    const popup = await popupPromise;
    await popup.locator('#open-reports').click();

    const received = await messages;
    expect(received.data).toEqual({ type: 'flowpilot:selector', nonce: 'nonce-1', selector: '#open-reports' });
    expect(popup.url()).not.toContain('fp-pick');
  });

  test('picker mode is not triggered by a crafted link without an opener', async ({ page }) => {
    await mockBackend(page, 'banner', { settings: noRules });
    await page.goto(`${HOST}/#fp-pick=x&origin=https%3A%2F%2Fevil.example`);
    await expect(page.getByText('click the element this step should point to')).toHaveCount(0);
    await expect(page.getByText('We just launched something new!')).toBeVisible();
  });
});
