import { expect, Page, test } from '@playwright/test';
import { canvas, createFromTemplate, createInEditor, signUp, waitForSaved } from './helpers';

const HOST = 'http://localhost:5198';

/** The id in the project page's address. */
const projectIdOf = (page: Page) => page.url().match(/projects\/([\w-]+)/)![1];

test.describe('checking an install on a live site', () => {
  test('a page with the code answers, and the draft shows there', async ({ page, context }) => {
    await signUp(page);
    await createFromTemplate(page, 'form-contact');
    const id = projectIdOf(page);
    // The customer's page loads from its own address, and asks the backend for the project.
    await context.route('http://supabase.test/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
    await page.getByRole('tab', { name: 'Share and install' }).click();
    await page.getByRole('textbox', { name: 'Address of a page with the code' }).fill(`${HOST}/?project=${id}&inline=1&builder=1`);
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Check it on my site' }).click();
    const popup = await popupPromise;

    const result = page.getByRole('region', { name: 'Check result' });
    await expect(result.getByText('The FlowPilot script is on this page.')).toBeVisible();
    await expect(result.getByText('It asks for this project.')).toBeVisible();
    await expect(result.getByText('It has the spot where this appears.')).toBeVisible();
    await expect(result.getByText(/isn't published yet/)).toBeVisible();

    // The draft is shown on that page, for this person only.
    await expect(popup.getByText('FlowPilot check: only you can see this')).toBeVisible();
    await expect(popup.locator('[data-flowpilot-host]').last()).toBeAttached();
  });

  test('a strict security policy is explained, with what to add', async ({ page, context }) => {
    await signUp(page);
    await createFromTemplate(page, 'banner-announcement');
    const id = projectIdOf(page);
    await page.getByRole('tab', { name: 'Share and install' }).click();
    await page.getByRole('textbox', { name: 'Address of a page with the code' }).fill(`${HOST}/?project=${id}&builder=1&csp=1`);
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Check it on my site' }).click();
    const popup = await popupPromise;
    await expect(popup.locator('#title')).toBeVisible();

    const result = page.getByRole('region', { name: 'Check result' });
    await expect(result.getByText("FlowPilot didn't answer from that page")).toBeVisible({ timeout: 20_000 });
    await expect(result.getByText(/Your site's security settings block it/)).toBeVisible();
    await expect(result.getByText(/script-src: http:\/\/localhost:5199/)).toBeVisible();
    await expect(result.getByRole('button', { name: 'Copy Send this to whoever looks after your site' })).toBeVisible();
    await result.getByText("I'll change it myself").click();
    await expect(result.getByText(/next.config.js/).first()).toBeVisible();
  });
});

test('install guide: mobile apps and other frameworks', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'form-contact');
  await page.getByRole('tab', { name: 'Share and install' }).click();
  const guide = page.getByRole('region', { name: 'Put it on your live site' });
  await expect(guide.getByRole('heading', { name: 'In a mobile app' })).toBeVisible();
  await expect(guide.getByText("Once it's published, the code appears here with its web address.")).toBeVisible();
  await guide.getByRole('tab', { name: 'Vue or Angular' }).click();
  await expect(guide.getByText(/follows page changes in your app/)).toBeVisible();

  await createFromTemplate(page, 'banner-announcement');
  await page.getByRole('tab', { name: 'Share and install' }).click();
  await expect(page.getByText(/tours and banners can't float over them yet/)).toBeVisible();
});

test('own domain: add one, see exactly what to set, and where to buy one', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'website-business');
  await page.getByRole('tab', { name: 'Share and install' }).click();
  await expect(page.getByRole('heading', { name: 'Use your own domain' })).toBeVisible();

  await page.getByRole('tab', { name: 'I need a domain' }).click();
  await expect(page.getByRole('link', { name: /Namecheap/ })).toHaveAttribute('href', 'https://www.namecheap.com/');
  await page.getByRole('tab', { name: 'I have a domain' }).click();

  await page.getByRole('textbox', { name: 'Your domain' }).fill('not a domain');
  await page.getByRole('button', { name: 'Add domain' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Enter a domain such as' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Your domain' }).fill('https://WWW.Harbor-Plumbing.com/');
  await page.getByRole('button', { name: 'Add domain' }).click();
  const domain = page.getByRole('listitem').filter({ hasText: 'www.harbor-plumbing.com' });
  await expect(domain.getByText('Waiting for your DNS settings')).toBeVisible();
  await expect(domain.getByRole('cell', { name: 'CNAME', exact: true })).toBeVisible();
  await expect(domain.getByRole('cell', { name: 'cname.vercel-dns.com' })).toBeVisible();
  await expect(domain.getByRole('cell', { name: '_flowpilot.www' })).toBeVisible();
  await expect(domain.getByRole('cell', { name: /^flowpilot-verify=[0-9a-f]{32}$/ })).toBeVisible();

  // Demo mode can't go live, and says so rather than pretending.
  await domain.getByRole('button', { name: 'Connect domain' }).click();
  await expect(domain.getByRole('alert')).toContainText("needs FlowPilot's live setup");

  await page.getByRole('textbox', { name: 'Your domain' }).fill('www.harbor-plumbing.com');
  await page.getByRole('button', { name: 'Add domain' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'already connected' })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await domain.getByRole('button', { name: 'Remove' }).click();
  await expect(domain).toHaveCount(0);
});

test('blocks for articles and docs can be added and edited', async ({ page }) => {
  await signUp(page);
  await createInEditor(page, 'website-business');
  await page.getByRole('tab', { name: 'Add' }).click();
  const add = page.getByRole('tabpanel', { name: 'Add' });
  await expect(add.getByRole('region', { name: 'Articles and docs' })).toBeVisible();

  await add.getByRole('button', { name: 'Avatar', exact: true }).click();
  await expect(canvas(page).locator('.fp-avatar').getByText('AM')).toBeVisible();
  await add.getByRole('button', { name: 'Callout', exact: true }).click();
  await expect(canvas(page).getByText('Good to know')).toBeVisible();
  await add.getByRole('button', { name: 'Table', exact: true }).click();
  await expect(canvas(page).getByRole('cell', { name: 'Phone and email' })).toBeVisible();
  await add.getByRole('button', { name: 'Code', exact: true }).click();
  await expect(canvas(page).getByText('npm install your-package')).toBeVisible();

  await add.getByRole('button', { name: 'Icon', exact: true }).click();
  await page.getByRole('tab', { name: 'Edit' }).click();
  await page.getByRole('tab', { name: 'content' }).click();
  await page.getByRole('searchbox', { name: 'Search icons' }).fill('rock');
  await page.getByRole('button', { name: 'Rocket' }).click();
  await expect(page.getByRole('button', { name: 'Rocket' })).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas(page).locator('.fp-icon svg')).toBeVisible();

  await page.getByRole('tab', { name: 'Add' }).click();
  await add.getByRole('button', { name: 'List', exact: true }).click();
  await page.getByRole('tab', { name: 'Edit' }).click();
  await page.getByRole('tab', { name: 'content' }).click();
  await page.getByLabel('Style').selectOption('check');
  await expect(canvas(page).locator('.fp-list-check li')).toHaveCount(3);
  await waitForSaved(page);
});

test('data from an API: connect, show as cards, and it reaches the live site', async ({ page, context }) => {
  const products = { data: { items: [
    { title: 'Copper kettle', summary: 'Boils fast.', image_url: 'https://images.example.com/kettle.jpg', url: 'https://shop.example.com/kettle' },
    { title: 'Oak board', summary: 'Hand made.', image_url: 'https://images.example.com/board.jpg', url: 'https://shop.example.com/board' },
  ] }, meta: { total: 2 } };
  await context.route('https://api.example.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(products) }));
  await context.route('https://images.example.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' }));

  await signUp(page);
  await createInEditor(page, 'website-business');
  const panel = page.getByRole('region', { name: 'Data from your API' });
  await panel.getByRole('button', { name: 'Connect an API' }).click();
  await panel.getByLabel('What is it?').fill('Products');
  await panel.getByLabel('Address of your API').fill('http://api.example.com/products');
  await panel.getByRole('button', { name: 'Load it' }).click();
  await expect(panel.getByRole('alert')).toContainText('https://');

  await panel.getByLabel('Address of your API').fill('https://api.example.com/products');
  await panel.getByRole('button', { name: 'Load it' }).click();
  await expect(panel.getByRole('status')).toContainText('Found 2 items, each with: title, summary, image_url, url');
  await panel.getByRole('button', { name: 'Save' }).click();
  await expect(panel.getByText('2 items loaded')).toBeVisible();

  await panel.getByRole('button', { name: 'Show on the page' }).click();
  const cards = canvas(page).locator('.fp-card');
  await expect(cards.filter({ hasText: 'Copper kettle' })).toBeVisible();
  await expect(cards.filter({ hasText: 'Oak board' })).toBeVisible();
  await expect(canvas(page).getByRole('link', { name: 'Learn more' }).first()).toHaveAttribute('href', 'https://shop.example.com/kettle');

  // Any block can repeat over it too.
  await canvas(page).getByRole('heading', { name: 'What we do' }).click();
  await page.getByRole('tab', { name: 'Behavior' }).click();
  await expect(page.getByLabel(/^Repeat for each item in/).locator('option', { hasText: 'Products (from your API)' })).toHaveCount(1);
  await waitForSaved(page);

  await page.getByRole('button', { name: 'Back to project' }).click();
  const slug = `api-${Date.now()}`;
  await page.locator('header').getByRole('button', { name: /^Publish/ }).click();
  await page.getByLabel('Web address').fill(slug);
  await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
  await page.goto(`/s/${slug}`);
  await expect(page.getByRole('heading', { name: 'Copper kettle' })).toBeVisible();
  await expect(page.getByText('Hand made.')).toBeVisible();
});
