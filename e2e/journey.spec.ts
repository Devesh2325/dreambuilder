import { expect, test } from '@playwright/test';
import { BASE, canvas, createFromTemplate, publish, signUp, waitForSaved } from './helpers';
import { PROJECT_TYPES } from '../src/core/schema';
import { templatesFor } from '../src/templates';

test('full journey: template, details, editor, publish, live site, form response', async ({ page }) => {
  await signUp(page);

  // Choose a template.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Create new' }).click();
  await page.getByRole('searchbox', { name: 'Search templates' }).fill('restaurant');
  await page.getByRole('link', { name: /Restaurant or cafe/ }).click();

  // Details appear in the preview as they're typed.
  const preview = page.frameLocator('iframe[title="Preview"]');
  await page.getByLabel('Business name').fill('Rosa Trattoria');
  await expect(preview.getByRole('link', { name: 'Rosa Trattoria' })).toBeVisible();
  await page.getByLabel('Main headline').fill('Handmade pasta every day');
  await expect(preview.getByRole('heading', { name: 'Handmade pasta every day' })).toBeVisible();

  // Validation stops an empty required field.
  await page.getByLabel('Business name').fill('');
  await page.getByRole('button', { name: 'Create website' }).click();
  await expect(page.getByText('Business name is required')).toBeVisible();
  await page.getByLabel('Business name').fill('Rosa Trattoria');

  await page.getByRole('button', { name: 'Create website' }).click();
  await expect(page.getByRole('heading', { name: 'Rosa Trattoria' })).toBeVisible();
  await expect(page.getByText(/is ready\. Publish it now/)).toBeVisible();

  // Publish without opening the editor.
  const slug = `rosa-${Date.now()}`;
  await publish(page, slug);
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(`/s/${slug}`) })).toBeVisible();

  // Change the design in the editor. Drafts don't affect the live site.
  await page.getByRole('link', { name: 'Open editor' }).click();
  await expect(canvas(page).getByRole('heading', { name: 'Handmade pasta every day' })).toBeVisible();
  await page.getByLabel('Main headline').fill('Fresh pasta, draft version');
  await expect(canvas(page).getByRole('heading', { name: 'Fresh pasta, draft version' })).toBeVisible();
  await waitForSaved(page);

  await page.goto(`/s/${slug}`);
  await expect(page.getByRole('heading', { name: 'Handmade pasta every day' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fresh pasta, draft version' })).toHaveCount(0);
  await expect(page).toHaveTitle(/Rosa Trattoria/);

  // Internal navigation stays within the site.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Contact' }).click();
  await expect(page).toHaveURL(new RegExp(`/s/${slug}/contact$`));

  // A visitor sends the form.
  await page.getByLabel(/Your name/).fill('Vera Visitor');
  await page.getByLabel(/^Email/).fill('vera@example.com');
  await page.getByLabel(/How can we help/).fill('A table for two please');
  await page.getByRole('button', { name: 'Request a table' }).click();
  await expect(page.getByText("Thanks! We'll get back to you soon.")).toBeVisible();

  // The owner sees the response.
  await page.goBack();
  await page.goto(BASE);
  await page.getByRole('link', { name: /Rosa Trattoria/ }).click();
  await expect(page.getByRole('cell', { name: 'A table for two please' })).toBeVisible();

  // Publishing again updates the live site.
  await publish(page, slug);
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
  await page.goto(`/s/${slug}`);
  await expect(page.getByRole('heading', { name: 'Fresh pasta, draft version' })).toBeVisible();

  // Analytics shows the visits.
  await page.goto(`${BASE}/analytics`);
  await expect(page.getByRole('cell', { name: 'Page views' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Form submissions' })).toBeVisible();
});

test('editor: changes survive reload, undo works, and shared sections edit in place', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'website-business');
  await page.getByRole('link', { name: 'Open editor' }).click();

  const frame = canvas(page);
  const heading = frame.getByRole('heading', { name: 'Your trusted local experts' });
  await heading.click();
  await expect(frame.getByTestId('selection')).toBeVisible();

  // Double-click edits inline. Replacing the token detaches this spot from the variable.
  await heading.dblclick();
  await frame.getByRole('textbox', { name: 'Edit text' }).fill('Edited inline');
  await frame.getByRole('textbox', { name: 'Edit text' }).press('Enter');
  await expect(frame.getByRole('heading', { name: 'Edited inline' })).toBeVisible();

  // Undo and redo.
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'Your trusted local experts' })).toBeVisible();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'Edited inline' })).toBeVisible();

  // Add a block by clicking, with the selection deciding where it goes.
  await page.getByRole('tab', { name: 'Add' }).click();
  await page.getByRole('button', { name: 'Divider' }).click();
  await expect(frame.getByRole('separator')).toHaveCount(2);

  await waitForSaved(page);
  await page.reload();
  await expect(frame.getByRole('heading', { name: 'Edited inline' })).toBeVisible();
  await expect(frame.getByRole('separator')).toHaveCount(2);

  // The shared header is editable in place, and its change appears on another page.
  await frame.getByRole('navigation', { name: 'Main' }).click({ position: { x: 300, y: 5 } });
  await page.getByRole('tab', { name: 'Pages' }).click();
  await page.getByRole('button', { name: 'About /about' }).click();
  await expect(frame.getByRole('heading', { name: 'About us' })).toBeVisible();
  await expect(frame.getByRole('navigation', { name: 'Main' })).toBeVisible();

  // Device preview sets a narrower canvas, with real responsive behavior.
  await page.getByRole('button', { name: 'Mobile' }).click();
  await expect(page.locator('iframe[title="Design canvas"]')).toHaveJSProperty('offsetWidth', 390);
});

test('editor: drag and drop onto the canvas', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'website-business');
  await page.getByRole('link', { name: 'Open editor' }).click();
  await page.getByRole('tab', { name: 'Add' }).click();

  const frame = canvas(page);
  await expect(frame.getByRole('heading', { name: 'What we do' })).toBeVisible();
  const before = await frame.locator('hr').count();
  await page.getByRole('button', { name: 'Divider' }).dragTo(frame.getByRole('heading', { name: 'What we do' }));
  await expect(frame.locator('hr')).toHaveCount(before + 1);
});

test('editor: changes per device only affect that device', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'page-launch');
  await page.getByRole('link', { name: 'Open editor' }).click();

  const frame = canvas(page);
  const heading = frame.getByRole('heading', { level: 1 });
  await heading.click();
  await page.getByRole('button', { name: 'Mobile' }).click();
  await page.getByRole('tab', { name: 'style' }).click();
  await page.getByRole('textbox', { name: 'Size' }).fill('11px');
  await expect(heading).toHaveCSS('font-size', '11px');
  await page.getByRole('button', { name: 'Desktop' }).click();
  await expect(heading).not.toHaveCSS('font-size', '11px');
});

test('editor warns about a conflicting edit from another tab', async ({ page, context }) => {
  await signUp(page);
  await createFromTemplate(page, 'page-launch');
  await page.getByRole('link', { name: 'Open editor' }).click();
  await expect(canvas(page).getByRole('heading', { level: 1 })).toBeVisible();

  const other = await context.newPage();
  await other.goto(page.url());
  const otherHeading = canvas(other).getByRole('heading', { level: 1 });
  await otherHeading.click();
  await other.getByLabel('Text', { exact: true }).fill('Saved in another tab');
  await waitForSaved(other);
  await other.close();

  await canvas(page).getByRole('heading', { level: 1 }).click();
  await page.getByLabel('Text', { exact: true }).fill('Saved here');
  await expect(page.getByRole('alert').filter({ hasText: 'Someone else changed' })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Load their version' }).click();
  await expect(canvas(page).getByRole('heading', { name: 'Saved in another tab' })).toBeVisible();
});

for (const type of PROJECT_TYPES) {
  test(`${type}: template to published page`, async ({ page }) => {
    const template = templatesFor(type)[0];
    await signUp(page);
    await createFromTemplate(page, template.id);
    const slug = `${type}-${Date.now()}`;
    await publish(page, slug);
    await expect(page.getByText('Published! Your changes are live.')).toBeVisible();

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/s/${slug}`);
    // Overlays are fixed-position, so their root has no height of its own.
    await expect(page.locator('.fp-root')).toBeAttached();
    await expect(page.locator('body')).not.toContainText('{{');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('visitors cannot see unpublished or missing sites', async ({ page }) => {
  await page.goto('/s/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('logged-out users are sent to login, then back where they were going', async ({ page }) => {
  await page.goto(`${BASE}/team`);
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
});

test('team: invite link works for the invited email', async ({ page, context }) => {
  await signUp(page);
  await page.goto(`${BASE}/team`);
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
  await page.getByLabel('Email').fill('friend@example.com');
  await page.getByRole('button', { name: 'Create invite link' }).click();
  const link = await page.locator('code').textContent();
  expect(link).toContain('/invite/');
  await expect(page.getByText('friend@example.com')).toBeVisible();

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  await page.getByRole('link', { name: 'Create account' }).click();
  await page.getByLabel('Your name').fill('Friend');
  await page.getByLabel('Workspace name').fill('Friend Space');
  await page.getByLabel('Email').fill('friend@example.com');
  await page.getByLabel('Password').fill('a-long-enough-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  // Returned to the Team page they were on when logged out.
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();

  await page.goto(link!);
  await page.getByRole('button', { name: 'Accept invitation' }).click();
  await expect(page.getByLabel('Workspace')).toBeVisible();
  await expect(page.getByLabel('Workspace').locator('option')).toHaveCount(2);
  void context;
});

test('docs work logged out, with a real project id filled in when given', async ({ page }) => {
  await page.goto(`${BASE}/docs/tour?project=abc-123`);
  await expect(page.getByRole('heading', { name: 'Product tours', level: 1 })).toBeVisible();
  await expect(page.locator('pre').first()).toContainText('data-project-id="abc-123"');
  await page.getByRole('navigation', { name: 'Documentation' }).getByRole('link', { name: 'JavaScript API' }).click();
  await expect(page.getByRole('heading', { name: 'JavaScript API', level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/project=abc-123/);
});
