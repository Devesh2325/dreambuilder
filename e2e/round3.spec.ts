import { expect, Page, test } from '@playwright/test';
import { canvas, createFromTemplate, createInEditor, publish, signUp, waitForSaved } from './helpers';

const HOST = 'http://localhost:5198';
const css = (locator: ReturnType<Page['locator']>, property: string, pseudo?: string) =>
  locator.evaluate((element, [name, after]) => getComputedStyle(element, after ?? undefined).getPropertyValue(name!), [property, pseudo] as const);

test.describe('storage', () => {
  test('demo mode holds far more than localStorage could', async ({ page }) => {
    await signUp(page);
    await page.goto('/assets');
    // localStorage stops at about 5 MB, and base64 makes this one about 9 MB.
    const big = Buffer.alloc(7 * 1024 * 1024, 1);
    await page.locator('input[type=file]').setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: big });
    await expect(page.getByText('big.png')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('big.png')).toBeVisible();
  });

  test('data saved the old way moves across, and frees the space', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('flowpilot_local_backend', JSON.stringify({
      users: [{ id: 'u1', email: 'old@example.com', fullName: 'Old User', password: 'a-long-enough-password' }],
      currentUserId: null,
      workspaces: [{ id: 'w1', name: 'Old Space', slug: 'old', plan: 'free', branding: {} }],
      members: [{ organizationId: 'w1', userId: 'u1', role: 'owner' }],
    })));
    await page.reload();
    await page.getByLabel('Email').fill('old@example.com');
    await page.getByLabel('Password').fill('a-long-enough-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome, Old' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('flowpilot_local_backend'))).toBeNull();
  });
});

test.describe('signing out', () => {
  test('the next person starts fresh, not on the last person\'s page', async ({ page }) => {
    await signUp(page, 'First Workspace');
    await createFromTemplate(page, 'form-contact');
    const firstProject = page.url();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
    await page.getByRole('link', { name: 'Create account' }).click();
    await page.getByLabel('Your name').fill('Second Person');
    await page.getByLabel('Workspace name').fill('Second Workspace');
    await page.getByLabel('Email').fill(`second${Date.now()}@example.com`);
    await page.getByLabel('Password').fill('a-long-enough-password');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome, Second' })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Second Workspace').first()).toBeVisible();
    await expect(page.getByText('First Workspace')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Recent projects' }).getByText('Your projects will appear here.')).toBeVisible();

    // The first person's project can't be opened by address either.
    await page.goto(firstProject);
    await expect(page.getByRole('heading', { name: 'Project not found' })).toBeVisible();
  });

  test('someone following a link while logged out still returns to it', async ({ page }) => {
    await page.goto('/team');
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
    await page.getByRole('link', { name: 'Create account' }).click();
    await page.getByLabel('Your name').fill('New Person');
    await page.getByLabel('Workspace name').fill('Space');
    await page.getByLabel('Email').fill(`link${Date.now()}@example.com`);
    await page.getByLabel('Password').fill('a-long-enough-password');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
  });
});

test.describe('left menu', () => {
  test('has no visible scrollbar, and a panel icon to collapse it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await signUp(page);
    const nav = page.getByRole('navigation', { name: 'Main' });
    // It really does need to scroll at this height.
    expect(await nav.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    expect(await css(nav as never, 'scrollbar-width')).toBe('none');

    const sidebar = (await page.getByRole('complementary').boundingBox())!;
    const button = page.getByRole('button', { name: 'Collapse sidebar' });
    const box = (await button.boundingBox())!;
    // Inside the sidebar's header, not hanging off its edge.
    expect(box.x + box.width).toBeLessThanOrEqual(sidebar.x + sidebar.width);
    expect(box.y).toBeLessThan(56);
    await button.click();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
    expect((await page.getByRole('complementary').boundingBox())!.width).toBeLessThan(70);
  });

  test('creating starts from the guide or a module, not a global button', async ({ page }) => {
    await signUp(page);
    await expect(page.getByRole('complementary').getByRole('button', { name: 'Create new' })).toHaveCount(0);
    await page.getByRole('region', { name: /Get started/ }).getByRole('button', { name: 'Choose a template' }).click();
    await expect(page.getByRole('heading', { name: 'What do you want to create?' })).toBeVisible();
    await page.getByRole('list', { name: 'What to create' }).getByRole('button', { name: /^Form/ }).click();
    await expect(page).toHaveURL(/type=form/);
    await expect(page.getByRole('list', { name: 'Templates' }).getByText('Contact form')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Templates' }).getByText('Local business')).toHaveCount(0);
  });
});

test.describe('columns, items and devices', () => {
  const openGrid = async (page: Page) => {
    await createInEditor(page, 'page-launch');
    await page.getByRole('tab', { name: 'Add' }).click();
    const add = page.getByRole('tabpanel', { name: 'Add' });
    await add.getByRole('button', { name: 'Grid', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByRole('tab', { name: 'style' }).click();
    return canvas(page).locator('.fp-grid').last();
  };
  const columns = async (locator: ReturnType<Page['locator']>) => (await css(locator, 'grid-template-columns')).split(' ').length;

  test('items and columns go up and down with buttons, and phones stack by themselves', async ({ page }) => {
    await signUp(page);
    const grid = await openGrid(page);

    await page.getByRole('button', { name: 'More items' }).click();
    await page.getByRole('button', { name: 'More items' }).click();
    await page.getByRole('button', { name: 'More items' }).click();
    await page.getByRole('button', { name: 'More items' }).click();
    await expect(grid.locator('> *')).toHaveCount(4);
    await page.getByRole('button', { name: 'Fewer items' }).click();
    await expect(grid.locator('> *')).toHaveCount(3);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(grid.locator('> *')).toHaveCount(4);

    for (let n = 0; n < 4; n += 1) await page.getByRole('button', { name: 'More columns' }).click();
    await expect.poll(() => columns(grid)).toBe(4);
    await page.getByRole('button', { name: 'Fewer columns' }).click();
    await expect.poll(() => columns(grid)).toBe(3);
    await page.getByRole('button', { name: 'More columns' }).click();

    // Each device has its own count, and starts from a sensible one.
    await page.getByRole('button', { name: 'Tablet' }).click();
    await expect.poll(() => columns(grid)).toBe(2);
    await page.getByRole('button', { name: 'Mobile' }).click();
    await expect.poll(() => columns(grid)).toBe(1);
    await page.getByRole('button', { name: 'More columns' }).click();
    await expect.poll(() => columns(grid)).toBe(2);
    await page.getByRole('button', { name: 'Desktop', exact: true }).click();
    await expect.poll(() => columns(grid)).toBe(4);
  });

  test('a row can have items added too', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    await page.getByRole('tab', { name: 'Add' }).click();
    await page.getByRole('tabpanel', { name: 'Add' }).getByRole('button', { name: 'Row', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByRole('tab', { name: 'style' }).click();
    const row = canvas(page).locator('.fp-row').last();
    await page.getByRole('button', { name: 'More items' }).click();
    await page.getByRole('button', { name: 'More items' }).click();
    await expect(row.locator('> *')).toHaveCount(2);
  });

  test('a design for each device: overrides, what carries down, and reset', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const heading = canvas(page).getByRole('heading', { level: 1 });
    await heading.click();
    await page.getByRole('tab', { name: 'style' }).click();
    const size = page.getByRole('textbox', { name: 'Font size' });
    await size.fill('50');

    // A smaller screen shows the larger screen's value as a hint, not as its own.
    await page.getByRole('button', { name: 'Tablet' }).click();
    await expect(size).toHaveValue('');
    await expect(size).toHaveAttribute('placeholder', '50');
    await size.fill('40');
    await expect.poll(() => css(heading, 'font-size')).toBe('40px');

    // A tablet change carries to phones, until phones get their own.
    await page.getByRole('button', { name: 'Mobile' }).click();
    await expect(size).toHaveAttribute('placeholder', '40');
    await expect.poll(() => css(heading, 'font-size')).toBe('40px');
    await size.fill('30');
    await expect.poll(() => css(heading, 'font-size')).toBe('30px');
    await expect(page.getByText('Designing for mobile')).toBeVisible();

    await page.getByRole('button', { name: /^Reset 1 mobile change/ }).click();
    await expect.poll(() => css(heading, 'font-size')).toBe('40px');
    await page.getByRole('button', { name: 'Desktop', exact: true }).click();
    await expect.poll(() => css(heading, 'font-size')).toBe('50px');
  });

  test('a block can be left off a device, in the editor and on the live page', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const frame = canvas(page);
    await frame.getByRole('heading', { level: 1 }).click();
    await page.getByRole('tab', { name: 'style' }).click();
    await page.getByRole('region', { name: 'Devices' }).getByRole('checkbox', { name: 'mobile' }).uncheck();

    await expect(frame.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Mobile' }).click();
    await expect(frame.getByRole('heading', { level: 1 })).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: 'Hidden on mobile' })).toBeVisible();
    await expect(page.getByText('mobile: 390 px wide')).toBeVisible();
    await page.getByRole('button', { name: 'Tablet' }).click();
    await expect(frame.getByRole('heading', { level: 1 })).toBeVisible();

    await waitForSaved(page);
    const slug = `devices-${Date.now()}`;
    await publish(page, slug);
    await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
    await page.goto(`/s/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.getByRole('heading', { level: 1 })).toBeHidden();
  });
});

test.describe('preview', () => {
  test('covers the editor, with one clear set of controls', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'demo-walkthrough');
    await page.getByRole('button', { name: 'Preview' }).click();
    const preview = page.getByRole('dialog', { name: 'Preview' });
    await expect(preview).toBeVisible();
    const box = (await preview.boundingBox())!;
    const view = page.viewportSize()!;
    expect(box.width).toBe(view.width);
    expect(box.height).toBe(view.height);

    // The editor's own controls and notes are out of the way.
    await expect(page.getByRole('button', { name: 'Publish' })).not.toBeInViewport({ ratio: 1 }).catch(() => undefined);
    await expect(preview.getByRole('button', { name: 'Replay' })).toHaveCount(0);

    // A demo fits on the screen without scrolling.
    const frame = preview.frameLocator('iframe');
    await expect(frame.getByText('Step 1 of 3')).toBeVisible();
    const scrolls = await frame.locator('html').evaluate((el) => el.scrollHeight > el.clientHeight + 2);
    expect(scrolls).toBe(false);

    await frame.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(frame.getByText('Step 2 of 3')).toBeVisible();
    await preview.getByRole('button', { name: 'Restart' }).click();
    await expect(frame.getByText('Step 1 of 3')).toBeVisible();

    await preview.getByRole('button', { name: 'Mobile' }).click();
    await expect(preview.locator('iframe')).toHaveJSProperty('offsetWidth', 390);

    await page.keyboard.press('Escape');
    await expect(preview).toHaveCount(0);
    await expect(page.getByTestId('canvas-stage')).toBeVisible();
  });
});

test.describe('demo on your own screens', () => {
  test('add a screenshot and a tooltip, place it, and choose its arrow', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'demo-walkthrough');
    const frame = canvas(page);

    // The screenshot fills the canvas, rather than collapsing around itself.
    const screen = (await frame.locator('.fp-screen').boundingBox())!;
    expect(screen.width).toBeGreaterThan(400);
    expect(screen.height).toBeGreaterThan(200);

    // The panel leads with what to do.
    const panel = page.getByRole('region', { name: 'This screen' });
    await expect(panel.getByText('Add a screenshot of your app.')).toBeVisible();
    await panel.getByRole('textbox').first().fill('https://images.example.com/my-app.png');
    await expect(frame.locator('.fp-screen > img')).toHaveAttribute('src', 'https://images.example.com/my-app.png');

    await panel.getByRole('button', { name: 'Add tooltip' }).click();
    await expect(frame.locator('.fp-hotspot')).toHaveCount(2);
    await page.getByLabel('Title', { exact: true }).fill('Reports live here');
    const tips = frame.locator('.fp-hotspot-tip');
    const tip = tips.last();
    // Light, so it stands out on the dark parts of a screenshot.
    expect(await css(tip, 'background-color')).toBe('rgb(255, 255, 255)');
    await expect(tip.getByText('Reports live here')).toBeVisible();

    // Which side it sits on, and where its arrow is.
    await page.getByRole('button', { name: 'Tooltip on the right' }).click();
    await expect(tip).toHaveAttribute('data-side', 'right');
    await page.getByRole('button', { name: 'Arrow at start' }).click();
    await expect(tip).toHaveAttribute('data-caret', 'start');
    expect(await css(tip, 'content', '::after')).not.toBe('none');
    const dot = (await frame.locator('.fp-hotspot').last().boundingBox())!;
    const box = (await tip.boundingBox())!;
    expect(box.x).toBeGreaterThan(dot.x + dot.width - 1);

    await page.getByRole('button', { name: 'Tooltip above' }).click();
    await expect(tip).toHaveAttribute('data-side', 'top');
    expect((await tip.boundingBox())!.y + (await tip.boundingBox())!.height).toBeLessThan(dot.y + 1);

    // The block's toolbar stays out of the tooltip's way, on whichever side it sits.
    const toolbar = (await frame.getByTestId('block-toolbar').boundingBox())!;
    const tipBox = (await tip.boundingBox())!;
    expect(toolbar.y >= tipBox.y + tipBox.height || toolbar.y + toolbar.height <= tipBox.y).toBe(true);

    // Dragging the tooltip itself moves it.
    const before = (await tip.boundingBox())!;
    await page.mouse.move(before.x + 20, before.y + 12);
    await page.mouse.down();
    await page.mouse.move(before.x + 120, before.y + 70, { steps: 5 });
    await page.mouse.up();
    await expect.poll(async () => (await tip.boundingBox())!.x).toBeGreaterThan(before.x + 40);
  });

  test('visitors can move on from the tooltip\'s own button', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'demo-walkthrough');
    await page.getByRole('button', { name: /Tooltip/ }).first().click();
    await page.getByRole('textbox', { name: 'Button label' }).fill('Show me');
    await page.getByRole('button', { name: 'Preview' }).click();
    const frame = page.getByRole('dialog', { name: 'Preview' }).frameLocator('iframe');
    await frame.getByRole('button', { name: 'Show me' }).click();
    await expect(frame.getByText('Step 2 of 3')).toBeVisible();
  });
});

test.describe('tour layouts and video', () => {
  test('a step can be a pop-up, slide-out or side panel', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'tour-feature');
    const frame = canvas(page);
    await frame.locator('.fp-step').click({ position: { x: 5, y: 5 } });
    const step = frame.locator('.fp-step');
    await page.getByRole('tab', { name: 'content' }).click();
    await expect(step).toHaveAttribute('data-layout', 'tooltip');
    await expect(page.getByRole('button', { name: 'Tooltip below' })).toBeVisible();

    await page.getByLabel('Layout').selectOption('modal');
    await expect(step).toHaveAttribute('data-layout', 'modal');
    // Position only means something for a tooltip.
    await expect(page.getByRole('button', { name: 'Tooltip below' })).toHaveCount(0);

    await page.getByLabel('Layout').selectOption('slideout');
    const frameBox = (await page.locator('iframe[title="Design canvas"]').boundingBox())!;
    const box = (await step.boundingBox())!;
    expect(box.x + box.width).toBeGreaterThan(frameBox.x + frameBox.width - 40);

    await page.getByLabel('Layout').selectOption('sidebar');
    await expect(step).toHaveAttribute('data-layout', 'sidebar');
    await page.getByLabel('Size', { exact: true }).selectOption('large');
    await expect.poll(() => css(step, 'width')).toBe('520px');
  });

  test('a YouTube link becomes a player, and other links do not', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'tour-welcome');
    await canvas(page).getByRole('heading', { name: /Welcome to/ }).click();
    await page.getByRole('tab', { name: 'Add' }).click();
    await page.getByRole('tabpanel', { name: 'Add' }).getByRole('button', { name: 'Video', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    const video = canvas(page).locator('.fp-video');
    await expect(video).toContainText('Paste a YouTube');

    await page.getByRole('textbox', { name: 'Video link' }).fill('https://evil.example/page');
    await expect(video.locator('iframe')).toHaveCount(0);
    await page.getByRole('textbox', { name: 'Video link' }).fill('javascript:alert(1)');
    await expect(video.locator('iframe')).toHaveCount(0);
    await page.getByRole('textbox', { name: 'Video link' }).fill('https://www.youtube.com/watch?v=jNQXAC9IVRw&t=4');
    await expect(video.locator('iframe')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?rel=0');
    await page.getByRole('textbox', { name: 'Video link' }).fill('https://youtu.be/jNQXAC9IVRw');
    await expect(video.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/jNQXAC9IVRw/);
    await page.getByRole('textbox', { name: 'Video link' }).fill('https://cdn.example.com/intro.mp4');
    await expect(video.locator('video')).toHaveAttribute('src', 'https://cdn.example.com/intro.mp4');
  });

  test('long steps scroll inside themselves, and never run off the screen', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'tour-long-guide');
    await page.getByRole('button', { name: 'Preview' }).click();
    const frame = page.getByRole('dialog', { name: 'Preview' }).frameLocator('iframe');
    const step = frame.locator('.fp-step');
    await expect(step).toBeVisible();
    await expect(step.getByText('Choose your data')).toBeVisible();
    const box = (await step.boundingBox())!;
    const iframe = (await page.getByRole('dialog', { name: 'Preview' }).locator('iframe').boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(iframe.y + iframe.height + 1);
    expect(box.x + box.width).toBeGreaterThan(iframe.x + iframe.width - 3);
  });
});

test.describe('building a tour on your own site', () => {
  const openSettings = async (page: Page) => {
    await createInEditor(page, 'tour-feature');
    await page.getByRole('tab', { name: 'Edit' }).click();
    await expect(page.getByRole('region', { name: 'Your site' })).toBeVisible();
  };

  test('clicking things on the real site adds steps to the tour', async ({ page, context }) => {
    await signUp(page);
    await openSettings(page);
    const bar = page.getByTestId('step-bar');
    await expect(bar.getByRole('button', { name: /^Step \d$/ })).toHaveCount(1);

    await page.getByLabel('Address of your app').fill(`${HOST}/app?builder=1`);
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Build on my site' }).click();
    const site = await popupPromise;
    await expect(site.getByText('Click an element to add a step')).toBeVisible();
    expect(site.url()).not.toContain('fp-build');
    await expect(page.getByRole('status').filter({ hasText: 'Connected' })).toBeVisible();

    await site.locator('#open-reports').click();
    await expect(site.getByText('(1 added)')).toBeVisible();
    await expect(bar.getByRole('button', { name: /^Step \d$/ })).toHaveCount(2);
    const frame = canvas(page);
    await expect(frame.getByRole('heading', { name: 'Reports' })).toBeVisible();
    await page.getByRole('tab', { name: 'content' }).click();
    await expect(page.getByRole('textbox', { name: 'Element to point at' })).toHaveValue('#open-reports');

    // "Use my site" lets clicks through, so people can reach other screens.
    await site.getByRole('button', { name: 'Use my site' }).click();
    await site.locator('#spa-link').click();
    await expect(site).toHaveURL(/\/other$/);
    await site.getByRole('button', { name: 'Add steps' }).click();
    await site.locator('#title').click();
    await expect(bar.getByRole('button', { name: /^Step \d$/ })).toHaveCount(3);

    await site.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('status').filter({ hasText: /tab is closed/ })).toBeVisible();
  });

  test('a draft can be tried on the real site before publishing', async ({ page, context }) => {
    await signUp(page);
    await openSettings(page);
    await page.getByLabel('Address of your app').fill(`${HOST}/app?builder=1`);
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Test on my site' }).click();
    const site = await popupPromise;
    await expect(site.getByText('Test mode: only you can see this')).toBeVisible();
    await expect(site.getByRole('heading', { name: /^New: / })).toBeVisible();
  });

  test('says how to fix it when the script is not on the site', async ({ page, context }) => {
    await signUp(page);
    await openSettings(page);
    await page.getByLabel('Address of your app').fill(`${HOST}/app?noscript=1`);
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Build on my site' }).click();
    await popupPromise;
    await expect(page.getByRole('status').filter({ hasText: 'Connecting' })).toBeVisible();
    const help = page.getByRole('alert').filter({ hasText: "We couldn't find FlowPilot" });
    await expect(help).toBeVisible({ timeout: 12_000 });
    await expect(help).toContainText('flowpilot.js');
  });

  test('another site cannot drive a customer\'s page', async ({ page, context }) => {
    // Without the builder allowed, the script belongs to its own origin, so this app is refused.
    await signUp(page);
    await openSettings(page);
    await page.getByLabel('Address of your app').fill(`${HOST}/app`);
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Build on my site' }).click();
    const site = await popupPromise;
    await site.waitForLoadState();
    await page.waitForTimeout(800);
    await expect(site.getByText('Click an element to add a step')).toHaveCount(0);
  });

  test('a rejected address is explained', async ({ page }) => {
    await signUp(page);
    await openSettings(page);
    await page.getByLabel('Address of your app').fill('not a web address');
    await page.getByRole('button', { name: 'Build on my site' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'starting with https://' })).toBeVisible();
  });

  test('tour options show in the canvas', async ({ page }) => {
    await signUp(page);
    await openSettings(page);
    const options = page.getByRole('region', { name: 'Tour options' });
    await options.getByRole('checkbox', { name: /Show progress/ }).check();
    await options.getByLabel(/How long it takes/).fill('About 2 minutes');
    await expect(canvas(page).locator('.fp-step-progress')).toHaveText(/Step 1 of 1.*About 2 minutes/);
    await options.getByRole('checkbox', { name: 'Show a close button' }).check();
    await expect(canvas(page).getByRole('button', { name: 'Close' })).toBeVisible();
    await page.getByLabel(/^Starts/).selectOption('click');
    await page.getByRole('textbox', { name: 'Element they click' }).fill('#help');
    await waitForSaved(page);
    await page.reload();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await expect(page.getByRole('textbox', { name: 'Element they click' })).toHaveValue('#help');
  });
});

test.describe('variables for everyone', () => {
  test('mixed text shows names instead of code, in both directions', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'tour-welcome');
    const frame = canvas(page);
    await frame.getByRole('heading', { name: 'Welcome to Acme!' }).click();
    await page.getByRole('tab', { name: 'content' }).click();
    const field = page.getByLabel('Text', { exact: true });
    await expect(field).toHaveValue('Welcome to [Product name]!');
    await expect(page.getByText('Shows: Welcome to Acme!')).toBeVisible();

    // Typing a name in brackets, or changing the words around it, keeps it linked.
    await field.fill('Hello from [Product name]');
    await expect(frame.getByRole('heading', { name: 'Hello from Acme' })).toBeVisible();
    await page.getByRole('tab', { name: 'Variables' }).click();
    await page.getByRole('tabpanel', { name: 'Variables' }).getByLabel('Product name').fill('Zenith');
    await expect(frame.getByRole('heading', { name: 'Hello from Zenith' })).toBeVisible();
    await expect(page.getByText(/\{\{/)).toHaveCount(0);
  });

  test('explains itself, and says where each value is used', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const panel = page.getByRole('tabpanel', { name: 'Variables' });
    await expect(panel.getByText('One change, updated everywhere')).toBeVisible();
    await expect(panel.getByText(/^Used in \d+ place/).first()).toBeVisible();

    await panel.getByRole('button', { name: 'New variable' }).click();
    await panel.getByLabel('What is it called?').fill('Opening hours');
    await panel.getByLabel('What is its value?').fill('9 to 5');
    await panel.getByRole('button', { name: 'Add variable' }).click();
    await expect(panel.getByRole('textbox', { name: 'Opening hours' })).toHaveValue('9 to 5');
    await expect(panel.getByRole('status').filter({ hasText: 'Insert a variable' })).toBeVisible();
    await expect(panel.getByText('Not used yet')).toBeVisible();
  });

  test('list items are named by their own words', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'faq-general');
    const panel = page.getByRole('tabpanel', { name: 'Variables' });
    await expect(panel.getByText('How do I get started?').first()).toBeVisible();
    await expect(panel.getByText('Item 1', { exact: true })).toHaveCount(0);
  });
});

test.describe('fonts', () => {
  test('each font in the list is shown in its own style', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const heading = canvas(page).getByRole('heading', { level: 1 });
    await heading.click();
    await page.getByRole('tab', { name: 'style' }).click();
    await page.getByRole('button', { name: 'Font', exact: true }).click();
    const list = page.getByRole('listbox', { name: 'Font' });
    for (const font of ['Playfair Display', 'JetBrains Mono', 'Poppins']) {
      expect(await css(list.getByRole('option', { name: font, exact: true }) as never, 'font-family')).toContain(font);
    }
    await expect(page.locator('link[href*="fonts.googleapis.com/css2"][href*="Playfair"]').first()).toBeAttached();

    await list.getByRole('option', { name: 'Playfair Display' }).click();
    await expect(list).toHaveCount(0);
    await expect.poll(() => css(heading, 'font-family')).toContain('Playfair Display');
    expect(await css(page.getByRole('button', { name: 'Font', exact: true }) as never, 'font-family')).toContain('Playfair Display');

    await page.getByRole('button', { name: 'Font', exact: true }).click();
    await page.getByRole('listbox', { name: 'Font' }).getByRole('option', { name: 'Theme font' }).click();
    await expect.poll(() => css(heading, 'font-family')).not.toContain('Playfair Display');
  });

  test('the theme and brand kit use the same list', async ({ page }) => {
    await signUp(page);
    await page.goto('/brand');
    await page.getByRole('button', { name: 'Font', exact: true }).click();
    await page.getByRole('option', { name: 'Lora' }).click();
    await expect(page.getByRole('button', { name: 'Font', exact: true })).toHaveText('Lora');
    await createInEditor(page, 'page-launch');
    await page.getByRole('tab', { name: 'Theme' }).click();
    await page.getByRole('button', { name: 'Heading font' }).click();
    await expect(page.getByRole('listbox', { name: 'Heading font' }).getByRole('option', { name: 'Syne' })).toBeVisible();
  });
});

test.describe('order of the panels', () => {
  const titles = (page: Page) => page.locator('section[aria-label]').evaluateAll((items) => items.map((item) => item.getAttribute('aria-label')).filter((name) => ['Layout', 'Spacing', 'Size', 'Typography', 'Fill', 'Border', 'Effects', 'Position'].includes(name!)));

  test('tools and style groups put the most used first', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const tools = await page.getByRole('tablist', { name: 'Tools' }).getByRole('tab').allTextContents();
    expect(tools.slice(0, 2)).toEqual(['Edit', 'Add']);

    await canvas(page).getByRole('heading', { level: 1 }).click();
    await page.getByRole('tab', { name: 'style' }).click();
    expect((await titles(page))[0]).toBe('Typography');
    expect((await titles(page)).at(-1)).toBe('Layout');

    await canvas(page).getByRole('button', { name: 'Select parent block' }).click();
    expect((await titles(page))[0]).toBe('Layout');

    await page.getByRole('tab', { name: 'Add' }).click();
    await page.getByRole('tabpanel', { name: 'Add' }).getByRole('button', { name: 'Image', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    expect((await titles(page))[0]).toBe('Size');
    expect(await titles(page)).not.toContain('Typography');
  });
});

test.describe('tours on a customer site', () => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  const step = (id: string, props: Record<string, unknown>, label = 'Next') => ({
    [id]: { id, type: 'TourStep', props: { spotlight: true, ...props }, styles: {}, children: [`${id}h`, `${id}b`] },
    [`${id}h`]: { id: `${id}h`, type: 'Heading', props: { text: `Heading ${id}`, level: 'h4' }, styles: {}, children: [] },
    [`${id}b`]: { id: `${id}b`, type: 'Button', props: { text: label, action: 'next' }, styles: {}, children: [] },
  });

  const serve = async (page: Page, steps: Record<string, unknown>[], ids: string[], settings: Record<string, unknown> = {}) => {
    const snapshot = {
      project: {
        id: 'project-1', type: 'tour', title: 'T', slug: 'a', variables: {},
        theme: { primary: '#4f46e5', secondary: '#111111', background: '#ffffff', surface: '#f8fafc', text: '#0f172a', muted: '#64748b', radius: '8px', fontHeading: 'Inter', fontBody: 'Inter' },
        settings: { triggers: { urlRules: [], delaySeconds: 0, frequency: 'always' }, ...settings },
      },
      documents: [{
        id: 'd', kind: 'experience', title: 'Main', slug: '', position: 0, seo: {},
        content: { rootId: 'root', nodes: { root: { id: 'root', type: 'Root', props: {}, styles: {}, children: ids }, ...Object.assign({}, ...steps) } },
      }],
    };
    await page.route('http://supabase.test/rest/v1/rpc/**', async (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const name = route.request().url().split('/').pop();
      return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(name === 'get_published_experience' ? snapshot : null) });
    });
  };

  test('progress, close button, arrow keys and Esc', async ({ page }) => {
    await serve(page, [step('a', {}), step('b', {})], ['a', 'b'], { tour: { showProgress: true, estimatedTime: 'About 1 minute', showClose: true } });
    await page.goto(`${HOST}/app`);
    await expect(page.getByText(/Step 1 of 2.*About 1 minute/)).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { name: 'Heading b' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('heading', { name: 'Heading a' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Heading a' })).toHaveCount(0);
  });

  test('the arrow points from the side it really ended up on', async ({ page }) => {
    await serve(page, [step('a', { selector: '#main-nav', placement: 'top' })], ['a']);
    await page.goto(`${HOST}/app`);
    const card = page.locator('.fp-step');
    await expect(card).toBeVisible();
    // No room above the top navigation, so it flips below.
    await expect(card).toHaveAttribute('data-side', 'bottom');
    expect(await css(card, 'content', '::after')).not.toBe('none');
  });

  test('a step can wait for the element itself to be clicked', async ({ page }) => {
    await serve(page, [step('a', { selector: '#open-reports', advance: 'target' }), step('b', {})], ['a', 'b']);
    await page.goto(`${HOST}/app`);
    await expect(page.getByRole('heading', { name: 'Heading a' })).toBeVisible();
    await page.locator('#open-reports').click();
    await expect(page.getByRole('heading', { name: 'Heading b' })).toBeVisible();
  });

  test('clicking outside closes it, when that is turned on', async ({ page }) => {
    await serve(page, [step('a', {})], ['a'], { tour: { closeOnBackdrop: true } });
    await page.goto(`${HOST}/app`);
    await expect(page.getByRole('heading', { name: 'Heading a' })).toBeVisible();
    await page.mouse.click(5, 500);
    await expect(page.getByRole('heading', { name: 'Heading a' })).toHaveCount(0);
  });

  test('after the last step it can go to another page', async ({ page }) => {
    await serve(page, [step('a', {}, 'Finish')], ['a'], { tour: { finishUrl: '/finished' } });
    await page.goto(`${HOST}/app`);
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page).toHaveURL(/\/finished$/);
  });

  test('steps can live on different pages, and a redirect cannot loop', async ({ page }) => {
    await serve(page, [step('a', {}), step('b', { path: '/reports' })], ['a', 'b']);
    await page.goto(`${HOST}/app`);
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveURL(/\/reports$/);
    await expect(page.getByRole('heading', { name: 'Heading b' })).toBeVisible();
  });

  test('start on click, and only from code', async ({ page }) => {
    await serve(page, [step('a', {})], ['a'], { triggers: { urlRules: [], delaySeconds: 0, frequency: 'always', clickSelector: '#open-reports' } });
    await page.goto(`${HOST}/app`);
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Heading a' })).toHaveCount(0);
    await page.locator('#open-reports').click();
    await expect(page.getByRole('heading', { name: 'Heading a' })).toBeVisible();
  });

  test('manual tours wait for FlowPilot.start', async ({ page }) => {
    await serve(page, [step('a', {})], ['a'], { triggers: { urlRules: [], delaySeconds: 0, frequency: 'always', manualOnly: true } });
    await page.goto(`${HOST}/app`);
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Heading a' })).toHaveCount(0);
    await page.evaluate(() => (window as unknown as { FlowPilot: { start: (id: string) => Promise<void> } }).FlowPilot.start('project-1'));
    await expect(page.getByRole('heading', { name: 'Heading a' })).toBeVisible();
  });

  test('video plays inside a published step, from an allowed player', async ({ page }) => {
    await serve(page, [{
      a: { id: 'a', type: 'TourStep', props: { layout: 'modal', size: 'xlarge' }, styles: {}, children: ['v'] },
      v: { id: 'v', type: 'Video', props: { url: 'https://youtu.be/jNQXAC9IVRw' }, styles: {}, children: [] },
    }], ['a']);
    await page.goto(`${HOST}/app`);
    const player = page.locator('.fp-video iframe');
    await expect(player).toHaveAttribute('src', /youtube-nocookie\.com/);
    await expect(player).toHaveAttribute('sandbox', /allow-scripts/);
    await expect.poll(() => css(page.locator('.fp-step'), 'width')).toBe('760px');
  });
});
