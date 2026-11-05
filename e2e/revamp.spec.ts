import { expect, Page, test } from '@playwright/test';
import { canvas, createFromTemplate, publish, signUp, waitForSaved } from './helpers';
import { TEMPLATES } from '../src/templates';

const openEditor = async (page: Page, templateId: string) => {
  await createFromTemplate(page, templateId);
  await page.getByRole('link', { name: 'Open editor' }).click();
  await expect(page.getByTestId('canvas-stage')).toBeVisible();
};

test('preview never loads the app inside itself, whatever link is clicked', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'page-launch');

  // A navigation menu with a # link, the case that used to nest the studio in the preview.
  await page.getByRole('tab', { name: 'Add' }).click();
  await page.getByRole('tabpanel', { name: 'Add' }).getByRole('button', { name: 'Navigation' }).click();
  await page.getByRole('tab', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Add menu item' }).click();
  await page.getByLabel('Menu item 1 label').fill('Blog');
  await waitForSaved(page);

  await page.getByRole('button', { name: 'Preview' }).click();
  const preview = page.frameLocator('iframe[title="Preview"]');
  await preview.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Blog' }).click();
  await expect(preview.getByRole('heading', { level: 1 })).toBeVisible();
  // The studio's Publish button must not be inside the frame.
  await expect(preview.getByRole('button', { name: 'Publish' })).toHaveCount(0);
  await expect(page.locator('iframe[title="Preview"]')).toHaveAttribute('srcdoc', /doctype/);

  await page.getByRole('button', { name: 'Close preview' }).click();
  await expect(page.getByTestId('canvas-stage')).toBeVisible();
  const noPageScroll = await page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight);
  expect(noPageScroll).toBe(true);
});

test('navigation: links can be centered, left or right', async ({ page }) => {
  await signUp(page);
  await page.setViewportSize({ width: 1600, height: 900 });
  await openEditor(page, 'website-business');
  const nav = canvas(page).getByRole('navigation', { name: 'Main' });
  const about = nav.getByRole('link', { name: 'About' });
  await nav.click({ position: { x: 500, y: 6 } });

  const position = async () => {
    const navBox = (await nav.boundingBox())!;
    const box = (await about.boundingBox())!;
    return (box.x + box.width / 2 - navBox.x) / navBox.width;
  };

  expect(await position()).toBeGreaterThan(0.7);
  await page.getByLabel('Menu position').selectOption('center');
  await expect.poll(position).toBeLessThan(0.6);
  expect(await position()).toBeGreaterThan(0.4);
  await page.getByLabel('Menu position').selectOption('left');
  await expect.poll(position).toBeLessThan(0.35);
});

test('all tools are on one side, and the canvas gets the rest of the screen', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 880 });
  await signUp(page);
  await openEditor(page, 'website-business');

  const stage = (await page.getByTestId('canvas-stage').boundingBox())!;
  expect(stage.x + stage.width).toBeGreaterThanOrEqual(1919);
  expect(stage.width).toBeGreaterThan(1500);

  // Clicking a block opens its settings in the same panel.
  await canvas(page).getByRole('heading', { level: 1 }).click();
  await expect(page.getByRole('tab', { name: 'Edit' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Level')).toBeVisible();

  // Closing the panel leaves almost the whole screen.
  await page.getByRole('tab', { name: 'Edit' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Edit' })).toHaveCount(0);
  const wide = (await page.getByTestId('canvas-stage').boundingBox())!;
  expect(wide.width).toBeGreaterThan(1800);
});

test('blocks can be grabbed and dragged directly on the canvas', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'page-launch');
  const frame = canvas(page);
  const box = frame.locator('.fp-box').first();
  await expect(box.locator('> *').first()).toHaveClass(/fp-heading/);

  const button = frame.getByRole('link', { name: 'Try it free' });
  const heading = frame.getByRole('heading', { level: 1 });
  await button.hover();
  await button.dragTo(heading, { targetPosition: { x: 20, y: 2 } });
  await expect(box.locator('> *').first()).toHaveClass(/fp-btn/);

  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(box.locator('> *').first()).toHaveClass(/fp-heading/);
});

test('a block from the panel drops where the line shows', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'page-launch');
  await page.getByRole('tab', { name: 'Add' }).click();
  const frame = canvas(page);
  const heading = frame.getByRole('heading', { level: 1 });
  await page.getByRole('tabpanel', { name: 'Add' }).getByRole('button', { name: 'Spacer' }).dragTo(heading, { targetPosition: { x: 40, y: 2 } });
  await expect(frame.locator('.fp-box').first().locator('> *').first()).not.toHaveClass(/fp-heading/);
});

test('demo: product screens, step controls, and draggable hotspots', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'demo-walkthrough');
  const preview = page.frameLocator('iframe[title$="preview"]');

  // Real screens, not random photos.
  await expect(preview.locator('.fp-screen > img')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await expect(preview.getByText('Step 1 of 3')).toBeVisible();
  await preview.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(preview.getByText('Step 2 of 3')).toBeVisible();
  await preview.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(preview.getByText('Step 1 of 3')).toBeVisible();
  await preview.getByRole('button', { name: 'Start here' }).click();
  await expect(preview.getByText('Step 2 of 3')).toBeVisible();

  await page.getByRole('link', { name: 'Open editor' }).click();
  const hotspot = canvas(page).locator('.fp-hotspot').first();
  await hotspot.scrollIntoViewIfNeeded();
  const before = (await hotspot.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + 200, before.y + 120, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await hotspot.boundingBox())!.x).toBeGreaterThan(before.x + 100);
});

test('banners: popup is a banner style, and carousels rotate', async ({ page }) => {
  await signUp(page);
  await page.goto('/banners');
  await page.getByRole('button', { name: 'New banner' }).first().click();
  for (const style of ['Simple', 'Modern', 'Popup', 'Carousel']) {
    await expect(page.getByRole('button', { name: style, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Popup', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Templates' }).getByRole('listitem')).toHaveCount(3);
  await page.getByRole('button', { name: 'Carousel', exact: true }).click();
  await page.getByRole('button', { name: /^Use Rotating messages/ }).click();
  await page.getByRole('button', { name: /^Create / }).click();
  await expect(page.getByText(/is ready/)).toBeVisible();
  await page.getByRole('button', { name: 'Back to project' }).click();

  const preview = page.frameLocator('iframe[title$="preview"]');
  await expect(preview.getByText('Free shipping over $50')).toBeVisible();
  await preview.getByRole('button', { name: 'Next slide' }).click();
  await expect(preview.getByText('New arrivals are here')).toBeVisible();
  await expect(preview.getByText('Free shipping over $50')).toBeHidden();

  await page.goto('/banners');
  await expect(page.getByRole('row', { name: /Rotating messages/ }).getByRole('cell', { name: 'Carousel' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Popups' })).toHaveCount(0);
});

test('sidebar collapses to icons, and remembers', async ({ page }) => {
  await signUp(page);
  const sidebar = page.getByRole('complementary');
  expect((await sidebar.boundingBox())!.width).toBeGreaterThan(200);

  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBeLessThan(80);
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Forms' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Forms' }).click();
  await expect(page).toHaveURL(/\/forms$/);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
});

test('dashboard guides a new user, and updates as they progress', async ({ page }) => {
  await signUp(page);
  const guide = page.getByRole('region', { name: /Get started/ });
  await expect(page.getByRole('heading', { name: 'Welcome, Test' })).toBeVisible();
  await expect(guide).toBeVisible();
  await expect(guide.getByText('0 of 4 done')).toBeVisible();

  await guide.getByRole('button', { name: 'Choose a template' }).click();
  await page.getByRole('list', { name: 'What to create' }).getByRole('button', { name: /^Website/ }).click();
  await page.getByRole('button', { name: /^Use Local business/ }).click();
  await page.getByRole('button', { name: 'Create website' }).click();
  await expect(page.getByText(/is ready/)).toBeVisible();

  await page.goto('/');
  await expect(guide.getByText('1 of 4 done')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Recent projects' }).getByRole('link', { name: /Harbor Plumbing/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'All projects' })).toHaveCount(0);

  await guide.getByRole('button', { name: 'Hide this guide' }).click();
  await expect(guide).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome, Test' })).toBeVisible();
  await expect(guide).toHaveCount(0);
});

test('project page: the same tabs for every module', async ({ page }) => {
  await signUp(page);
  for (const [id, hasResponses] of [['form-contact', true], ['tour-welcome', false], ['faq-general', false]] as const) {
    await createFromTemplate(page, id);
    const tabs = page.getByRole('tablist', { name: 'Project sections' });
    await expect(tabs.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.getByRole('tab', { name: 'Share and install' })).toBeVisible();
    await expect(tabs.getByRole('tab', { name: 'Versions' })).toBeVisible();
    await expect(tabs.getByRole('tab', { name: 'Settings' })).toBeVisible();
    await expect(tabs.getByRole('tab', { name: /Responses/ })).toHaveCount(hasResponses ? 1 : 0);

    await tabs.getByRole('tab', { name: 'Share and install' }).click();
    await expect(page.getByRole('link', { name: /integration guide/ })).toBeVisible();
    await expect(page.getByRole('note').filter({ hasText: 'Publish first' })).toBeVisible();
  }
});

test('project page: rename, publish and take offline', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'tour-welcome');
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByLabel('Project name').fill('Dashboard intro');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard intro', level: 1 })).toBeVisible();

  await page.getByRole('tab', { name: 'Overview' }).click();
  await publish(page, `intro-${Date.now()}`);
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
  await page.getByRole('tab', { name: 'Share and install' }).click();
  await expect(page.getByText('data-project-id')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Take offline' }).click();
  await expect(page.getByRole('button', { name: 'Take offline' })).toHaveCount(0);
});

test('templates come in many industries, with a filter', async ({ page }) => {
  await signUp(page);
  expect(TEMPLATES.filter((t) => t.type === 'website').length).toBeGreaterThanOrEqual(15);
  await page.goto('/websites');
  await page.getByRole('button', { name: 'New website' }).first().click();
  const list = page.getByRole('list', { name: 'Templates' });
  await page.getByRole('button', { name: 'Health and wellness', exact: true }).click();
  await expect(list.getByText('Medical clinic', { exact: true })).toBeVisible();
  await expect(list.getByText('Law firm', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByLabel('Search templates').fill('blog');
  await expect(list.getByText('Blog', { exact: true })).toBeVisible();
});

for (const id of ['website-docs', 'website-blog', 'page-blog-article', 'page-docs-article', 'page-saas-landing', 'website-clinic']) {
  test(`${id} publishes and reads correctly`, async ({ page }) => {
    await signUp(page);
    await createFromTemplate(page, id);
    const slug = `${id}-${Date.now()}`;
    await publish(page, slug);
    await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
    await page.goto(`/s/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('{{');
  });
}

test('linked fields name the variable they use, instead of showing code', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'page-launch');
  const frame = canvas(page);
  const heading = frame.getByRole('heading', { level: 1 });
  const original = await heading.textContent();
  await heading.click();

  await expect(page.getByText('Uses your Headline')).toBeVisible();
  await expect(page.locator('input[value*="{{"]')).toHaveCount(0);

  // Double-click shows the real words. Pressing Enter unchanged keeps following the variable.
  await heading.dblclick();
  const editor = frame.getByRole('textbox', { name: 'Edit text' });
  await expect(editor).toHaveValue(original!);
  await editor.press('Enter');
  await expect(page.getByText('Uses your Headline')).toBeVisible();

  // Change it opens Variables, and the canvas follows.
  await page.getByRole('button', { name: 'Change it' }).first().click();
  await page.getByRole('tabpanel', { name: 'Variables' }).getByLabel('Headline').fill('From the variables');
  await expect(frame.getByRole('heading', { name: 'From the variables' })).toBeVisible();

  // Typing your own starts from the current words, and stops following the variable.
  await page.getByRole('tab', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Type your own Text' }).click();
  await expect(page.getByLabel('Text', { exact: true })).toHaveValue('From the variables');
  await page.getByLabel('Text', { exact: true }).fill('My own words');
  await page.getByRole('tab', { name: 'Variables' }).click();
  await page.getByRole('tabpanel', { name: 'Variables' }).getByLabel('Headline').fill('Ignored now');
  await expect(frame.getByRole('heading', { name: 'My own words' })).toBeVisible();
});

test('demo controls stay visible above the screen', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'demo-walkthrough');
  const preview = page.frameLocator('iframe[title$="preview"]');
  const bar = (await preview.getByText('Step 1 of 3').boundingBox())!;
  const screen = (await preview.locator('.fp-screen').boundingBox())!;
  expect(bar.y).toBeLessThan(screen.y);
});

test('docs template sidebar links line up on the left', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'website-docs');
  const preview = page.frameLocator('iframe[title$="preview"]');
  const main = preview.getByRole('main').or(preview.locator('.fp-page'));
  await expect(main.first()).toBeVisible();
  const x = async (name: string) => (await preview.locator('.fp-box').getByRole('link', { name, exact: true }).first().boundingBox())!.x;
  expect(Math.abs((await x('Overview')) - (await x('API reference')))).toBeLessThan(2);
});

test('a popup carousel says where it really shows', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'banner-carousel-promo');
  await page.goto('/banners');
  await expect(page.getByRole('row', { name: /Promo carousel/ }).getByRole('cell', { name: /Center of screen/ })).toBeVisible();
});

test('dragging works from every starting point', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'page-launch');
  const frame = canvas(page);
  const firstChild = () => frame.locator('.fp-box').first().locator('> *').first();
  const heading = frame.getByRole('heading', { level: 1 });

  // The grip on the block toolbar.
  const button = frame.getByRole('link', { name: 'Try it free' });
  await button.click();
  await expect(frame.getByTestId('block-toolbar')).toBeVisible();
  await frame.getByTestId('block-toolbar').locator('[draggable=true]').dragTo(heading, { targetPosition: { x: 20, y: 2 } });
  await expect(firstChild()).toHaveClass(/fp-btn/);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(firstChild()).toHaveClass(/fp-heading/);

  // A text block, grabbed directly.
  const paragraph = frame.locator('.fp-box').first().locator('.fp-text').first();
  await paragraph.hover();
  await paragraph.dragTo(heading, { targetPosition: { x: 20, y: 2 } });
  await expect(firstChild()).toHaveClass(/fp-text/);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();

  // From the Layers panel.
  await page.getByRole('tab', { name: 'Layers' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Layers' });
  await panel.getByRole('button', { name: 'Button', exact: true }).first().dragTo(panel.getByRole('button', { name: 'Heading', exact: true }).first(), { targetPosition: { x: 20, y: 1 } });
  await expect(firstChild()).toHaveClass(/fp-btn/);
});

test('clicking empty space opens the project settings, including when a tour appears', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'tour-welcome');
  await page.getByRole('link', { name: 'Open editor' }).click();
  const frame = canvas(page);
  await frame.getByRole('heading', { name: /Welcome to/ }).click();
  await expect(page.getByLabel('Level')).toBeVisible();

  await page.getByRole('button', { name: 'Product tour settings' }).click();
  await expect(page.getByRole('region', { name: 'When it appears' })).toBeVisible();

  await page.getByRole('tab', { name: 'Theme' }).click();
  await frame.locator('.fp-page').click({ position: { x: 800, y: 20 } });
  await expect(page.getByRole('region', { name: 'When it appears' })).toBeVisible();
});
