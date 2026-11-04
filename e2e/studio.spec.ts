import { expect, Page, test } from '@playwright/test';
import { canvas, createFromTemplate, signUp, waitForSaved } from './helpers';

const openEditor = async (page: Page, templateId: string) => {
  await createFromTemplate(page, templateId);
  await page.getByRole('link', { name: 'Open editor' }).click();
  await expect(page.getByTestId('canvas-stage')).toBeVisible();
};

const openBlank = async (page: Page, plural: string, label: string) => {
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: plural, exact: true }).click();
  await page.getByRole('button', { name: `New ${label}` }).first().click();
  await page.getByRole('button', { name: 'Create blank' }).click();
  await expect(page.getByTestId('canvas-stage')).toBeVisible();
};

for (const size of [{ width: 1920, height: 880 }, { width: 1366, height: 768 }, { width: 1024, height: 700 }]) {
  test(`layout at ${size.width}px: only the page scrolls, at every zoom and device`, async ({ page }) => {
    await page.setViewportSize(size);
    await signUp(page);
    await openEditor(page, 'website-business');
    const stage = page.getByTestId('canvas-stage');

    const assertNoStageScroll = async () => {
      const metrics = await stage.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight }));
      expect(metrics.sw).toBeLessThanOrEqual(metrics.cw);
      expect(metrics.sh).toBeLessThanOrEqual(metrics.ch);
      const body = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight }));
      expect(body.sw).toBeLessThanOrEqual(body.cw);
      expect(body.sh).toBeLessThanOrEqual(body.ch);
    };

    await assertNoStageScroll();
    for (const zoom of ['Zoom out', 'Zoom out', 'Zoom out', 'Zoom in', 'Zoom in', 'Zoom in', 'Zoom in']) {
      await page.getByRole('button', { name: zoom }).click();
      await assertNoStageScroll();
    }
    await page.getByRole('button', { name: 'Reset zoom' }).click();

    for (const device of ['Tablet', 'Mobile', 'Desktop']) {
      await page.getByRole('button', { name: device, exact: true }).click();
      await assertNoStageScroll();
      // Desktop really is desktop, even on a small screen.
      if (device === 'Desktop') {
        const logicalWidth = await page.locator('iframe[title="Design canvas"]').evaluate((el: HTMLIFrameElement) => el.offsetWidth);
        expect(logicalWidth).toBeGreaterThan(991);
        await expect(canvas(page).getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' })).toBeVisible();
      }
      // The whole frame stays inside the stage.
      const frame = (await page.locator('iframe[title="Design canvas"]').boundingBox())!;
      const box = (await stage.boundingBox())!;
      expect(frame.x).toBeGreaterThanOrEqual(box.x);
      expect(frame.x + frame.width).toBeLessThanOrEqual(box.x + box.width + 1);
      expect(frame.y + frame.height).toBeLessThanOrEqual(box.y + box.height + 1);
    }

    // Long pages scroll inside the frame.
    const html = canvas(page).locator('html');
    await expect.poll(() => html.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await html.evaluate((el) => { el.scrollTop = 200; });
    expect(await html.evaluate((el) => el.scrollTop)).toBe(200);
  });
}

test('hidden layers disappear from the canvas and the live site, and can be shown again', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'website-business');
  const frame = canvas(page);
  const heading = frame.getByRole('heading', { name: 'What we do' });
  await expect(heading).toBeVisible();

  await heading.click();
  await page.getByRole('tab', { name: 'Layers' }).click();
  const selectedRow = page.getByRole('tabpanel', { name: 'Layers' }).locator('div.group:has(button[aria-current="true"])');
  await selectedRow.hover();
  await selectedRow.getByRole('button', { name: /^Hide/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Hidden from the page' })).toBeVisible();
  await expect(frame.getByRole('heading', { name: 'What we do' })).toHaveCount(0);
  await expect(frame.getByTestId('selection')).toHaveCount(0);

  await page.getByRole('status').filter({ hasText: 'Hidden from the page' }).getByRole('button', { name: 'Show' }).click();
  await expect(frame.getByRole('heading', { name: 'What we do' })).toBeVisible();

  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'What we do' })).toHaveCount(0);
});

test('menu editor: add Home, About and Blog, reorder, and create a page for an item', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'website-business');
  const frame = canvas(page);
  const nav = frame.getByRole('navigation', { name: 'Main' });

  // By default, it lists the pages.
  await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
  await nav.click({ position: { x: 500, y: 6 } });
  await page.getByRole('button', { name: 'Choose items myself' }).click();
  await expect(page.getByLabel('Menu item 1 label')).toHaveValue('Home');

  // A new item that gets its own new page.
  await page.getByRole('button', { name: 'Add menu item' }).click();
  await page.getByLabel('Menu item 4 label').fill('Blog');
  await expect(nav.getByRole('link', { name: 'Blog' })).toBeVisible();
  await page.getByLabel('Menu item 4 goes to').selectOption({ label: '+ Create a new page for this item' });
  await expect(page.getByLabel('Menu item 4 goes to')).toHaveValue('/blog');

  // Reorder.
  await page.getByRole('button', { name: 'Move Blog up' }).click();
  await expect(page.getByLabel('Menu item 3 label')).toHaveValue('Blog');

  // A link to another site.
  await page.getByRole('button', { name: 'Add menu item' }).click();
  await page.getByLabel('Menu item 5 label').fill('Shop');
  await page.getByLabel('Menu item 5 goes to').selectOption({ label: 'Web address...' });
  await page.getByLabel('Menu item 5 address').fill('https://shop.example.com');
  await expect(nav.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', 'https://shop.example.com');

  await page.getByRole('button', { name: 'Remove Contact' }).click();
  await expect(nav.getByRole('link', { name: 'Contact' })).toHaveCount(0);

  // The new page exists, and the menu survives a reload.
  await waitForSaved(page);
  await page.reload();
  await expect(frame.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Blog' })).toBeVisible();
  await page.getByRole('tab', { name: 'Pages' }).click();
  await expect(page.getByRole('button', { name: 'Blog /blog' })).toBeVisible();
});

test('menu module: template items are edited in details, or taken over in the block', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'menu-product');
  const nav = canvas(page).getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'Pricing' })).toBeVisible();
  await nav.click({ position: { x: 300, y: 5 } });
  await page.getByRole('button', { name: 'Edit them here instead' }).click();
  await page.getByRole('button', { name: 'Remove Docs' }).click();
  await expect(nav.getByRole('link', { name: 'Docs' })).toHaveCount(0);
});

test('mobile menu collapses behind a button on the live site', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'website-business');
  const slug = `mobile-${Date.now()}`;
  await page.getByRole('button', { name: /^Publish/ }).click();
  await page.getByLabel('Web address').fill(slug);
  await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`/s/${slug}`);
  const about = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' });
  await expect(about).toBeHidden();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await about.click();
  await expect(page).toHaveURL(new RegExp(`/s/${slug}/about$`));
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
  await expect(about).toBeHidden();
});

test('each module offers only the blocks that fit it', async ({ page }) => {
  await signUp(page);
  const offered = async (plural: string, label: string) => {
    await page.goto('/');
    await openBlank(page, plural, label);
    const buttons = page.getByRole('tabpanel', { name: 'Add' }).getByRole('button');
    return buttons.allTextContents();
  };

  const tour = await offered('Product tours', 'product tour');
  expect(tour).toContain('Tour step');
  expect(tour).not.toContain('Form');
  expect(tour).not.toContain('Demo screen');

  const form = await offered('Forms', 'form');
  expect(form).toContain('Form field');
  expect(form).not.toContain('Tour step');
  expect(form).not.toContain('Navigation');

  const website = await offered('Websites', 'website');
  expect(website).toContain('Section');
  expect(website).not.toContain('Tour step');
  expect(website).not.toContain('Popup');
});

test('blank website: empty blocks show where to drop, and the toolbar stays on screen', async ({ page }) => {
  await signUp(page);
  await openBlank(page, 'Websites', 'website');
  const frame = canvas(page);
  const empty = frame.locator('.fp-container:empty');
  await expect(empty).toBeVisible();
  expect((await empty.boundingBox())!.height).toBeGreaterThan(50);

  await frame.getByRole('navigation', { name: 'Main' }).click({ position: { x: 300, y: 5 } });
  const toolbar = (await frame.getByTestId('block-toolbar').boundingBox())!;
  const canvasBox = (await page.locator('iframe[title="Design canvas"]').boundingBox())!;
  expect(toolbar.y).toBeGreaterThanOrEqual(canvasBox.y);

  await frame.getByRole('button', { name: 'Select parent block' }).click();
  await expect(page.getByRole('navigation', { name: 'Selected block path' }).getByRole('button')).toHaveCount(1);
});

test('layers can be reordered by dragging', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'page-launch');
  await page.getByRole('tab', { name: 'Layers' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Layers' });
  const frame = canvas(page);

  const texts = frame.locator('.fp-box').first().locator('> *');
  const before = await texts.nth(0).evaluate((el) => el.tagName);
  expect(before).toBe('H1');

  await panel.getByRole('button', { name: 'Button', exact: true }).dragTo(panel.getByRole('button', { name: 'Heading', exact: true }).first(), {
    targetPosition: { x: 20, y: 1 },
  });
  await expect(texts.nth(0)).toHaveClass(/fp-btn/);
});

test('style panel: theme colors, device overrides and clearing', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'page-launch');
  const heading = canvas(page).getByRole('heading', { level: 1 });
  await heading.click();
  await page.getByRole('tab', { name: 'style' }).click();

  await page.getByRole('group', { name: 'Text color theme colors' }).getByRole('button', { name: 'Use theme Primary color' }).click();
  await expect(heading).toHaveCSS('color', 'rgb(79, 70, 229)');

  // Changing the theme updates blocks that use theme colors.
  await page.getByRole('tab', { name: 'Theme' }).click();
  await page.getByLabel('Primary color', { exact: true }).fill('#ff0000');
  await expect(heading).toHaveCSS('color', 'rgb(255, 0, 0)');

  await page.getByRole('button', { name: 'Clear Text color' }).click();
  await expect(heading).not.toHaveCSS('color', 'rgb(255, 0, 0)');
});

test('read-only: viewers see no editing controls', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'page-launch');
  const projectUrl = page.url();
  const projectId = projectUrl.split('/').pop();

  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('flowpilot_local_backend')!);
    state.members[0].role = 'viewer';
    localStorage.setItem('flowpilot_local_backend', JSON.stringify(state));
  });
  await page.goto(`/studio/${projectId}`);
  await expect(page.getByText('View only')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publish' })).toHaveCount(0);

  await canvas(page).getByRole('heading', { level: 1 }).click();
  await expect(canvas(page).getByRole('button', { name: 'Delete block' })).toHaveCount(0);
  await expect(canvas(page).getByRole('button', { name: 'Select parent block' })).toBeVisible();
});

test('keyboard shortcuts work with focus inside the canvas', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'page-launch');
  const frame = canvas(page);
  await frame.getByRole('heading', { name: 'Save time' }).click();
  await page.keyboard.press('Delete');
  await expect(frame.getByRole('heading', { name: 'Save time' })).toHaveCount(0);
  await page.keyboard.press('Control+z');
  await expect(frame.getByRole('heading', { name: 'Save time' })).toBeVisible();
});

test('the canvas renders in standards mode, like published pages', async ({ page }) => {
  await signUp(page);
  await openEditor(page, 'page-launch');
  const mode = await page.locator('iframe[title="Design canvas"]').evaluate((el: HTMLIFrameElement) => el.contentDocument!.compatMode);
  expect(mode).toBe('CSS1Compat');
});
