import { expect, Page, test } from '@playwright/test';
import { canvas, changeLocalData, createFromTemplate, createInEditor, publish, signUp, waitForSaved } from './helpers';

/** Leaves the app, so the next signUp makes a second, ordinary account. */
const logOut = async (page: Page) => {
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
};

test.describe('dashboard and empty pages', () => {
  test('dashboard shows stats, modules and help', async ({ page }) => {
    await signUp(page);
    await expect(page.getByRole('heading', { name: /^Welcome, Test/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Take a tour' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Websites: 0' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Free plan' }).getByRole('meter')).toHaveAttribute('aria-valuemax', '3');
    await expect(page.getByRole('link', { name: 'Contact support' })).toBeVisible();
  });

  test('an empty module page is a real banner, and its button works', async ({ page }) => {
    await signUp(page);
    await page.goto('/forms');
    await expect(page.getByRole('heading', { name: 'No forms yet' })).toBeVisible();
    // It's drawn by the same renderer customers' banners use.
    await expect(page.locator('.fp-root .fp-section').first()).toBeVisible();
    await page.getByRole('link', { name: 'Choose a template' }).click();
    await expect(page).toHaveURL(/\/create\?type=form/);
  });

  test('assets and analytics have banners when empty', async ({ page }) => {
    await signUp(page);
    await page.goto('/assets');
    await expect(page.getByRole('heading', { name: 'No assets yet' })).toBeVisible();
    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: 'No activity yet' })).toBeVisible();
  });
});

test.describe('tours of FlowPilot', () => {
  test('the dashboard tour starts once, finishes, and can be started again', async ({ page }) => {
    await signUp(page, 'Tour Space', { tours: true });
    await expect(page.getByRole('heading', { name: 'Welcome to FlowPilot' })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Start here' })).toBeVisible();
    await expect(page.locator('[data-fp-spotlight]')).toBeVisible();
    for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.locator('[data-fp-tour]')).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('heading', { name: /^Welcome, Test/ })).toBeVisible();
    await expect(page.locator('[data-fp-tour]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Take a tour' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to FlowPilot' })).toBeVisible();
  });

  test('the editor tour points at the real tools and can be replayed', async ({ page }) => {
    await signUp(page, 'Tour Space', { tours: true });
    await expect(page.getByRole('heading', { name: 'Welcome to FlowPilot' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.goto('/new/website-business');
    await page.getByRole('button', { name: /^Create / }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to the editor' })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'This is your page' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-fp-tour]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Take a tour of the editor' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to the editor' })).toBeVisible();
  });
});

test.describe('installing on a live site', () => {
  test('a website gets its address, ways to use it, and an honest note on domains', async ({ page }) => {
    await signUp(page);
    await createFromTemplate(page, 'website-business');
    await page.getByRole('tab', { name: 'Share and install' }).click();
    await expect(page.getByRole('note').filter({ hasText: 'Publish first' })).toBeVisible();
    await page.getByRole('button', { name: 'Publish now' }).click();
    await page.getByLabel('Web address').fill(`site-${Date.now()}`);
    await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
    await page.getByRole('tab', { name: 'Share and install' }).click();
    await expect(page.getByRole('heading', { name: 'Put it on your live site' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy Web address' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy Show it inside a page' })).toBeVisible();
    await expect(page.getByText(/own domain to FlowPilot isn't available yet/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Take payments on your site' })).toBeVisible();
  });

  test('a script module has steps for each platform, including where to place it', async ({ page }) => {
    await signUp(page);
    await createFromTemplate(page, 'form-contact');
    await page.getByRole('tab', { name: 'Share and install' }).click();
    const guide = page.getByRole('region', { name: 'Put it on your live site' });
    await expect(guide.getByRole('tab')).toHaveCount(8);
    await guide.getByRole('tab', { name: 'Shopify' }).click();
    await expect(guide.getByText('Open theme.liquid')).toBeVisible();
    await guide.getByRole('tab', { name: 'WordPress' }).click();
    await expect(guide.getByText(/footer as its location/)).toBeVisible();
    await guide.getByRole('tab', { name: 'React or Next.js' }).click();
    await expect(guide.getByText("import Script from 'next/script'")).toBeVisible();
    await expect(guide.getByText('Place where it should appear')).toBeVisible();
    await expect(guide.getByRole('heading', { name: 'Check that it works' })).toBeVisible();
  });
});

test('landing page: the interactive demo plays through', async ({ page }) => {
  await page.goto('/welcome');
  const demo = page.locator('#demo');
  await demo.scrollIntoViewIfNeeded();
  await expect(demo.getByText('Step 1 of 4')).toBeVisible();
  await demo.getByRole('img', { name: /Choosing a template/ }).isVisible();
  await demo.getByRole('button', { name: 'Use this one' }).click();
  await expect(demo.getByText('Step 2 of 4')).toBeVisible();
  await demo.locator('.fp-demo-bar').getByRole('button', { name: 'Next' }).click();
  await demo.locator('.fp-demo-bar').getByRole('button', { name: 'Next' }).click();
  await expect(demo.getByText('Step 4 of 4')).toBeVisible();
  await demo.locator('.fp-demo-bar').getByRole('button', { name: 'Finish' }).click();
  await expect(demo.locator('.fp-demo-bar').getByRole('button', { name: 'Restart' })).toBeVisible();
});

test('profile: name and time zone apply across the app', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'form-contact');
  await page.getByRole('link', { name: 'Your profile' }).click();
  await page.getByLabel('Your name').fill('Priya Shah');
  await page.getByLabel('Job title').fill('Founder');
  await page.getByLabel('Time zone').selectOption('Pacific/Kiritimati');
  const kiritimati = await page.getByTestId('time-preview').innerText();
  await page.getByLabel('Time zone').selectOption('Pacific/Pago_Pago');
  // These two are a full day apart, so the date can't be the same.
  await expect(page.getByTestId('time-preview')).not.toHaveText(kiritimati);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Time zone')).toHaveValue('Pacific/Pago_Pago');
  await expect(page.getByLabel('Job title')).toHaveValue('Founder');
  await expect(page.getByLabel('Main').getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('complementary').getByText('Priya Shah')).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome, Priya' })).toBeVisible();
});

test.describe('plans, quotas and super admin', () => {
  test('someone who is not a super admin is refused, and sees no link', async ({ page }) => {
    await signUp(page, 'First');
    await logOut(page);
    await signUp(page, 'Second');
    await expect(page.getByRole('link', { name: 'Super admin' })).toHaveCount(0);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'This page is only for super admins' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Users' })).toHaveCount(0);
  });

  test('a quota set by the super admin stops creation for that module only', async ({ page }) => {
    await signUp(page, 'Admin space');
    await page.getByRole('link', { name: 'Super admin' }).click();
    await page.getByRole('tab', { name: 'Plans and limits' }).click();
    const box = page.getByRole('spinbutton', { name: 'Free: Forms' });
    await box.fill('1');
    await box.blur();
    await expect(box).toHaveValue('1');

    await page.goto('/new/form-contact');
    await page.getByRole('button', { name: /^Create / }).click();
    await expect(page.getByTestId('canvas-stage')).toBeVisible();

    await page.goto('/plans');
    await expect(page.getByRole('meter', { name: 'Forms' })).toHaveAttribute('aria-valuemax', '1');
    await expect(page.getByRole('listitem', { name: 'Free plan' }).getByText('Up to 1 forms')).toBeVisible();

    await page.goto('/new/form-contact');
    await page.getByRole('button', { name: /^Create / }).click();
    await expect(page.getByRole('alert')).toContainText('allows 1 of this kind');

    await page.goto('/new/website-business');
    await page.getByRole('button', { name: /^Create / }).click();
    await expect(page.getByTestId('canvas-stage')).toBeVisible();
  });

  test('the super admin sees every user, changes a plan and nudges them', async ({ page }) => {
    await signUp(page, 'Admin space');
    await logOut(page);
    await signUp(page, 'Customer space');
    await logOut(page);
    await page.goto('/login');
    const adminEmail = await page.evaluate(() => new Promise<string>((resolve) => {
      const open = indexedDB.open('flowpilot_local', 1);
      open.onsuccess = () => {
        const request = open.result.transaction('state').objectStore('state').get('backend');
        request.onsuccess = () => resolve(request.result.users[0].email);
      };
    }));
    await page.getByLabel('Email').fill(adminEmail);
    await page.getByLabel('Password').fill('a-long-enough-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await page.getByRole('link', { name: 'Super admin' }).click();
    await page.getByRole('tab', { name: 'Users' }).click();
    const rows = page.getByRole('row').filter({ hasText: 'Customer space' });
    await expect(rows).toHaveCount(1);
    await page.getByRole('searchbox', { name: 'Search users' }).fill('Customer');
    await expect(page.getByRole('row').filter({ hasText: 'Admin space' })).toHaveCount(0);

    await rows.getByRole('combobox').selectOption({ label: 'Pro' });
    await expect(rows.getByRole('combobox')).toHaveValue('pro');
    const customerEmail = await rows.getByRole('rowheader').locator('span').last().innerText();

    await rows.getByRole('button', { name: /^Nudge/ }).click();
    const form = page.getByRole('form', { name: /^Nudge/ });
    await form.getByLabel('Title').fill('Your site is nearly ready');
    await form.getByLabel('Message').fill('Publish it to go live.');
    await form.getByLabel('Link (optional)').fill('/plans');
    await form.getByRole('button', { name: 'Send nudge' }).click();
    await expect(form.getByRole('status')).toContainText('Sent to 1 person');

    await logOut(page);
    await page.goto('/login');
    await page.getByLabel('Email').fill(customerEmail);
    await page.getByLabel('Password').fill('a-long-enough-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    const nudge = page.getByRole('complementary', { name: 'Message from FlowPilot' });
    await expect(nudge.getByText('Your site is nearly ready')).toBeVisible();
    await nudge.getByRole('link', { name: 'Open' }).click();
    await expect(page).toHaveURL(/\/plans$/);
    await expect(page.getByRole('heading', { name: "You're on the Pro plan" })).toBeVisible();
    await nudge.getByRole('button', { name: /^Close/ }).click();
    await expect(nudge).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('heading', { name: "You're on the Pro plan" })).toBeVisible();
    await expect(nudge).toHaveCount(0);
  });

  test('asking for a plan reaches the super admin, and approving it changes the plan', async ({ page }) => {
    await signUp(page, 'Admin space');
    await page.getByRole('link', { name: 'Plans', exact: true }).click();
    await page.getByRole('button', { name: 'Ask for the Starter plan' }).click();
    await page.getByLabel('Anything we should know?').fill('We need more projects');
    await page.getByRole('button', { name: 'Send request' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'You asked for the Starter plan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ask for the Pro plan' })).toBeDisabled();

    await page.goto('/admin');
    await page.getByRole('tab', { name: 'Plan requests' }).click();
    await expect(page.getByText('We need more projects')).toBeVisible();
    await page.getByRole('button', { name: 'Approve Admin space' }).click();
    await expect(page.getByRole('button', { name: 'Approve Admin space' })).toHaveCount(0);

    await page.goto('/plans');
    await expect(page.getByRole('heading', { name: "You're on the Starter plan" })).toBeVisible();
    await expect(page.getByRole('listitem', { name: 'Your requests' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Your requests' }).getByText('Approved')).toBeVisible();
  });
});

test('support: a customer asks, the team replies, and it can be closed', async ({ page }) => {
  await signUp(page, 'Admin space');
  await page.getByRole('link', { name: 'Support', exact: true }).click();
  await expect(page.getByRole('heading', { name: "We're here to help" })).toBeVisible();
  await expect(page.getByRole('link', { name: /Something isn't working/ })).toBeVisible();
  await page.getByLabel("What's it about?").fill('My tour does not start');
  await page.getByLabel('Your message').fill('It should appear on the pricing page.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('region', { name: 'My tour does not start' }).getByText('Waiting for us')).toBeVisible();

  await page.goto('/admin');
  await page.getByRole('tab', { name: 'Support inbox' }).click();
  await expect(page.getByText('It should appear on the pricing page.')).toBeVisible();
  await page.getByLabel('Reply to the customer').fill('Check the page address rule.');
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.getByText('Check the page address rule.')).toBeVisible();

  await page.goto('/support');
  const thread = page.getByRole('region', { name: 'My tour does not start' });
  await expect(thread.getByText('Answered')).toBeVisible();
  await expect(thread.getByText('Check the page address rule.')).toBeVisible();
  await expect(thread.getByText(/^FlowPilot support/)).toBeVisible();

  await page.goto('/admin');
  await page.getByRole('tab', { name: 'Support inbox' }).click();
  await page.getByRole('button', { name: 'Close request' }).click();
  await expect(page.getByRole('button', { name: 'Reopen' })).toBeVisible();

  await page.goto('/support');
  await expect(page.getByText('This request is closed.')).toBeVisible();
  await expect(page.getByLabel('Your reply')).toHaveCount(0);
});

test('analytics: compares periods, switches measure and view, and exports', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'website-business');
  await changeLocalData(page, `
    const project = state.projects[0];
    const add = (daysAgo, type, count) => {
      const day = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
      for (let i = 0; i < count; i++) state.events.push({ projectId: project.id, type, day, visitorId: 'v' + i });
    };
    add(1, 'page_viewed', 30);
    add(2, 'page_viewed', 10);
    add(1, 'cta_clicked', 4);
    add(1, 'payment_clicked', 2);
    add(1, 'form_submitted', 3);
    add(1, 'tour_completed', 3);
    add(1, 'tour_skipped', 1);
    add(35, 'page_viewed', 20);
  `);
  await page.goto('/analytics');

  const views = page.getByRole('term').filter({ hasText: 'Views' }).locator('..');
  await expect(views).toContainText('40');
  await expect(views).toContainText('+100%');
  await expect(page.getByRole('term').filter({ hasText: 'Button clicks' }).locator('..')).toContainText('6');

  // Hovering a day's bar says exactly what it holds.
  const bars = page.getByRole('list', { name: 'views per day' }).getByRole('listitem');
  await expect(bars).toHaveCount(30);
  await bars.nth(28).hover();
  await expect(page.getByRole('tooltip')).toContainText('30 views');

  await expect(page.getByRole('cell', { name: 'Pay button clicks' })).toBeVisible();
  await expect(page.getByText('3 of 4 tours people finished or closed')).toBeVisible();
  await expect(page.getByRole('region', { name: 'By project' }).getByRole('link', { name: 'Harbor Plumbing' })).toBeVisible();

  await page.getByRole('combobox', { name: 'What to show' }).selectOption('clicks');
  await expect(page.getByRole('heading', { name: 'Button clicks per day' })).toBeVisible();
  await page.getByRole('button', { name: 'table' }).click();
  await expect(page.getByRole('columnheader', { name: 'Button clicks' })).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/flowpilot-analytics-30-days\.csv/);

  await page.getByRole('combobox', { name: 'Period' }).selectOption('7');
  await expect(page.getByRole('term').filter({ hasText: 'Views' }).locator('..')).toContainText('40');
});

test.describe('editor', () => {
  test('left menu is grouped, and its panels explain themselves', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    const rail = page.getByRole('tablist', { name: 'Tools' });
    await expect(rail.getByRole('tab')).toHaveText(['Edit', 'Add', 'Variables', 'Layers', 'Pages', 'Theme']);
    await rail.getByRole('tab', { name: 'Theme' }).click();
    await expect(page.getByText('Colors and fonts for the whole project.')).toBeVisible();
    await page.getByRole('button', { name: 'Close panel' }).click();
    await expect(page.getByRole('tabpanel')).toHaveCount(0);
    await page.getByRole('button', { name: 'Show panel' }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('variables: search by name or value, see where it is used, and jump between uses', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    const search = page.getByRole('searchbox', { name: 'Search variables' });
    await search.fill('zzz-nothing');
    await expect(page.getByText('Nothing matches "zzz-nothing".')).toBeVisible();
    await search.fill('Harbor Plumb');
    await expect(page.locator('[data-var]')).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Business name' })).toBeVisible();
    await search.fill('');
    await expect(page.locator('[data-var]').nth(3)).toBeVisible();

    const field = page.locator('[data-var="brand.name"]');
    await field.hover();
    const usage = canvas(page).getByTestId('variable-usage');
    await expect.poll(() => usage.count()).toBeGreaterThan(0);
    await page.getByTestId('canvas-stage').hover();
    await expect(usage).toHaveCount(0);

    await field.getByRole('button', { name: 'Show on page' }).click();
    await expect(canvas(page).getByTestId('selection')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Variables' })).toHaveAttribute('aria-selected', 'true');
  });

  test('"Change it" on a block goes straight to that variable', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    await canvas(page).locator('.fp-navbar-brand, .fp-nav-brand').first().click();
    await page.getByRole('tab', { name: 'content' }).click();
    await page.getByRole('button', { name: 'Change it' }).first().click();
    await expect(page.getByRole('tab', { name: 'Variables' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('textbox', { name: 'Business name' })).toBeFocused();
  });

  test('layers and blocks can be searched', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    await page.getByRole('tab', { name: 'Layers' }).click();
    await page.getByRole('searchbox', { name: 'Search layers' }).fill('what we do');
    const found = page.getByRole('list', { name: 'Matching blocks' }).getByRole('button');
    await expect(found).toHaveCount(1);
    await found.click();
    await expect(canvas(page).getByTestId('selection')).toBeVisible();

    await page.getByRole('tab', { name: 'Add' }).click();
    await page.getByRole('searchbox', { name: 'Search blocks' }).fill('pay');
    await expect(page.getByRole('button', { name: 'Pay button' })).toBeVisible();
    await expect(page.getByRole('tabpanel', { name: 'Add' }).getByRole('button', { name: 'Heading' })).toHaveCount(0);
  });

  test('the jump link field explains itself and accepts only a clean name', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    await canvas(page).locator('.fp-section').nth(1).click({ position: { x: 8, y: 8 } });
    await page.getByRole('tab', { name: 'content' }).click();
    const field = page.getByRole('textbox', { name: 'Jump link name (optional)' });
    await expect(page.getByText(/Most people can leave this empty/)).toBeVisible();
    await field.fill('Our Prices!');
    await expect(field).toHaveValue('our-prices-');
    await expect(page.getByText(/Link to this section with #our-prices-/)).toBeVisible();
    await expect(page.getByLabel(/Insert a variable into Jump link/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Make this a variable' })).toHaveCount(0);
    await expect(canvas(page).locator('section#our-prices-')).toHaveCount(1);
  });

  test('color picker: dragging the square, the sliders and theme colors all apply', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    await canvas(page).locator('.fp-section').nth(1).click({ position: { x: 8, y: 8 } });
    await page.getByRole('tab', { name: 'style' }).click();
    await page.getByRole('tab', { name: 'color' }).click();
    await page.getByRole('button', { name: 'Background picker' }).click();
    const panel = page.getByTestId('color-panel');
    await expect(panel).toBeVisible();

    const section = canvas(page).locator('.fp-section').nth(1);
    const before = await section.evaluate((el) => getComputedStyle(el).backgroundColor);
    const square = page.getByTestId('color-square');
    const box = (await square.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.2);
    await page.mouse.up();
    await expect.poll(() => section.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(before);
    const text = page.getByRole('textbox', { name: 'Background' });
    await expect(text).toHaveValue(/^#[0-9a-f]{6}$/);

    // See-through turns it into rgba.
    await panel.getByRole('slider', { name: 'Background: see-through' }).fill('50');
    await expect(text).toHaveValue(/^rgba\(/);

    await panel.getByRole('button', { name: 'Use #16a34a' }).click();
    await expect(text).toHaveValue('#16a34a');
    await expect.poll(() => section.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(22, 163, 74)');

    // Just-used colors are offered again.
    await expect(panel.getByText('Recent')).toBeVisible();

    await panel.getByRole('button', { name: 'Use theme Primary color' }).click();
    await expect(text).toHaveValue('var(--fp-primary)');
  });

  test('gradient: presets, adding and removing colors, direction and type', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    await canvas(page).locator('.fp-section').nth(1).click({ position: { x: 8, y: 8 } });
    await page.getByRole('tab', { name: 'style' }).click();
    await page.getByRole('tab', { name: 'gradient' }).click();
    const section = canvas(page).locator('.fp-section').nth(1);
    const applied = () => section.evaluate((el) => getComputedStyle(el).backgroundImage);

    await page.getByRole('button', { name: 'Gradient 1', exact: true }).click();
    await expect.poll(applied).toContain('linear-gradient');

    await expect(page.getByRole('button', { name: /^Color stop/ })).toHaveCount(2);
    const bar = (await page.getByTestId('gradient-bar').boundingBox())!;
    await page.mouse.click(bar.x + bar.width / 2, bar.y + bar.height / 2);
    await expect(page.getByRole('button', { name: /^Color stop/ })).toHaveCount(3);
    await page.getByRole('button', { name: 'Remove this color' }).click();
    await expect(page.getByRole('button', { name: /^Color stop/ })).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Remove this color' })).toBeDisabled();

    await page.getByRole('button', { name: '90 degrees' }).click();
    await expect.poll(applied).toMatch(/90deg|linear-gradient\(/);
    await expect(page.getByLabel(/^Direction: 90 degrees/)).toBeVisible();

    await page.getByRole('button', { name: 'Use #dc2626' }).first().click();
    await expect.poll(applied).toContain('rgb(220, 38, 38)');

    await page.getByRole('button', { name: 'From the center' }).click();
    await expect.poll(applied).toContain('radial-gradient');
    await waitForSaved(page);
  });

  test('spacing shows real values, and one box clears every side at once', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    await canvas(page).locator('.fp-section').nth(1).click({ position: { x: 8, y: 8 } });
    await page.getByRole('tab', { name: 'style' }).click();
    const section = canvas(page).locator('.fp-section').nth(1);

    // Sections have 72px and 24px of padding by default, which is what must be shown.
    await expect(page.getByRole('textbox', { name: 'Padding top' })).toHaveAttribute('placeholder', '72');
    await expect(page.getByRole('textbox', { name: 'Padding left' })).toHaveAttribute('placeholder', '24');
    await expect(page.getByRole('textbox', { name: 'All padding' })).toHaveAttribute('placeholder', 'Mixed');
    await expect(page.getByRole('textbox', { name: 'Margin top' })).toHaveAttribute('placeholder', '0');

    await page.getByRole('button', { name: 'All padding: None' }).click();
    await expect.poll(() => section.evaluate((el) => getComputedStyle(el).paddingTop)).toBe('0px');
    await expect.poll(() => section.evaluate((el) => getComputedStyle(el).paddingLeft)).toBe('0px');
    await expect(page.getByRole('textbox', { name: 'Padding top' })).toHaveAttribute('placeholder', '0');

    await page.getByRole('button', { name: 'All padding: L' }).click();
    await expect.poll(() => section.evaluate((el) => getComputedStyle(el).paddingBottom)).toBe('32px');

    // One side can still differ, and typing replaces a value from "all".
    await page.getByRole('textbox', { name: 'Padding top' }).fill('5');
    await expect.poll(() => section.evaluate((el) => getComputedStyle(el).paddingTop)).toBe('5px');
    await expect.poll(() => section.evaluate((el) => getComputedStyle(el).paddingBottom)).toBe('32px');

    await page.getByRole('button', { name: 'Back to the default spacing' }).click();
    await expect.poll(() => section.evaluate((el) => getComputedStyle(el).paddingTop)).toBe('72px');
  });

  test('gap says when it can not work, and offers the fix', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    await page.getByRole('tab', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Box', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByRole('tab', { name: 'style' }).click();
    await page.getByRole('button', { name: 'Display: Block' }).click();
    await page.getByRole('button', { name: 'More items' }).click();
    await page.getByRole('button', { name: 'More items' }).click();
    await expect(page.getByText('Gap only works when Display is Flex or Grid.')).toBeVisible();
    await page.getByRole('button', { name: 'Turn on Flex' }).click();
    await expect(page.getByText('Gap only works when Display is Flex or Grid.')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Display: Flex' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('Behavior tab is sorted into plain sections, and its actions work', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    await canvas(page).locator('.fp-section').nth(1).click({ position: { x: 8, y: 8 } });
    await page.getByRole('tab', { name: 'Behavior' }).click();
    for (const name of ['Name', 'Show or hide', 'Protect', 'Actions']) await expect(page.getByRole('region', { name, exact: true })).toBeVisible();
    await expect(page.getByText("Keeps it here, but visitors won't see it.")).toBeVisible();

    const sections = canvas(page).locator('.fp-section');
    const count = await sections.count();
    await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
    await expect(sections).toHaveCount(count + 1);
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(sections).toHaveCount(count);
  });
});

test('payments: a pay button guides setup, and only appears live with a secure link', async ({ page }) => {
  await signUp(page);
  await createInEditor(page, 'website-business');
  await page.getByRole('tab', { name: 'Add' }).click();
  await page.getByRole('button', { name: 'Pay button' }).click();
  await page.getByRole('tab', { name: 'Edit' }).click();
  await page.getByRole('tab', { name: 'content' }).click();
  const guide = page.getByRole('region', { name: 'How to connect payments' });
  await expect(guide.getByText('Log in to Stripe, and open Payment Links.')).toBeVisible();
  await expect(guide.getByText("Visitors won't see this button until it has a link.")).toBeVisible();
  await expect(guide.getByText(/never sees card details/)).toBeVisible();

  await page.getByLabel('Who takes the payment').selectOption('razorpay');
  await expect(guide.getByText('Log in to Razorpay, and open Payment Pages.')).toBeVisible();
  await page.getByLabel('Who takes the payment').selectOption('paypal');
  await expect(guide.getByRole('link', { name: 'Open PayPal' })).toHaveAttribute('href', /paypal\.com/);

  await page.getByRole('textbox', { name: 'Payment link', exact: true }).fill('http://insecure.example');
  await expect(guide.getByRole('alert')).toContainText('must start with https://');
  await page.getByRole('textbox', { name: 'Button label' }).fill('Book now');
  await page.getByRole('textbox', { name: 'Price shown beside it' }).fill('$25');
  await page.getByRole('textbox', { name: 'Payment link', exact: true }).fill('https://buy.example.com/abc');
  await waitForSaved(page);

  await page.getByRole('button', { name: 'Back to project' }).click();
  const slug = `pay-${Date.now()}`;
  await publish(page, slug);
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
  await page.goto(`/s/${slug}`);
  const link = page.getByRole('link', { name: 'Book now' });
  await expect(link).toHaveAttribute('href', 'https://buy.example.com/abc');
  await expect(link).toHaveAttribute('rel', /noopener/);
  await expect(page.getByText('$25')).toBeVisible();
});

test('integrations: another project shows inside a page with its own look and its own answers', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'form-contact');
  const formSlug = `form-${Date.now()}`;
  await publish(page, formSlug);
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();

  await createInEditor(page, 'website-business');
  await page.getByRole('tab', { name: 'Add' }).click();
  await page.getByRole('tab', { name: 'projects' }).click();
  await page.getByRole('button', { name: /Contact/ }).first().click();
  await expect(canvas(page).locator('.fp-embed form')).toBeVisible();

  // Clicking inside it selects the block itself, not something inside the other project.
  await canvas(page).locator('.fp-embed').click();
  await expect(page.getByLabel('Which project')).toBeVisible();
  await waitForSaved(page);

  await page.getByRole('button', { name: 'Back to project' }).click();
  const siteSlug = `site-${Date.now()}`;
  await publish(page, siteSlug);
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();

  await page.goto(`/s/${siteSlug}`);
  const form = page.locator('.fp-embed form');
  await expect(form).toBeVisible();
  // The host page keeps its own heading styles, and its theme isn't replaced by the form's.
  await expect(page.getByRole('heading', { name: 'Your trusted local experts' })).toBeVisible();
  const inputs = form.locator('input:not([tabindex="-1"]):not([type="hidden"]), textarea').filter({ visible: true });
  for (let i = 0; i < await inputs.count(); i += 1) {
    const input = inputs.nth(i);
    const type = await input.getAttribute('type');
    await input.fill(type === 'email' ? 'a@example.com' : 'Hello');
  }
  await form.getByRole('button').last().click();
  await expect(page.getByText(/Thanks|received/i).first()).toBeVisible();

  // The answer belongs to the form, not the website.
  await page.goto('/forms');
  await page.getByRole('link', { name: /Contact/ }).first().click();
  await page.getByRole('tab', { name: /^Responses/ }).click();
  await expect(page.getByRole('region', { name: 'Responses' }).getByRole('cell', { name: 'a@example.com' })).toBeVisible();
});

test('integrations: an unpublished project warns in the editor, and is simply absent for visitors', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'form-contact');
  await createInEditor(page, 'website-business');
  await page.getByRole('tab', { name: 'Add' }).click();
  await page.getByRole('tab', { name: 'projects' }).click();
  await expect(page.getByText('Not published yet')).toBeVisible();
  await page.getByRole('button', { name: /Contact/ }).first().click();
  await page.getByRole('tab', { name: 'Edit' }).click();
  await page.getByRole('tab', { name: 'content' }).click();
  await expect(page.getByRole('status').filter({ hasText: "isn't published yet" })).toBeVisible();
  await waitForSaved(page);
  await page.getByRole('button', { name: 'Back to project' }).click();
  const slug = `absent-${Date.now()}`;
  await publish(page, slug);
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
  await page.goto(`/s/${slug}`);
  await expect(page.getByRole('heading', { name: 'Your trusted local experts' })).toBeVisible();
  await expect(page.locator('.fp-embed form')).toHaveCount(0);
});
