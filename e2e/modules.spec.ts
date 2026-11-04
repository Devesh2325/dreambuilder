import { expect, Page, test } from '@playwright/test';
import { createFromTemplate, publish, signUp } from './helpers';
import { MODULE_LIST } from '../src/core/modules';
import { templatesFor } from '../src/templates';

const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' });

test('removed modules are gone everywhere', async ({ page }) => {
  await signUp(page);
  for (const name of ['Checklists', 'Surveys', 'Pricing tables', 'Testimonials']) {
    await expect(nav(page).getByRole('link', { name })).toHaveCount(0);
  }
  await page.goto('/templates');
  for (const name of ['Checklists', 'Surveys', 'Pricing tables', 'Testimonials']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  await page.goto('/docs/checklist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

for (const module of MODULE_LIST) {
  test(`${module.plural}: own page, own templates in the dialog`, async ({ page }) => {
    await signUp(page);
    await nav(page).getByRole('link', { name: module.plural, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${module.path}$`));
    await expect(page.getByRole('heading', { name: module.plural, level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: `No ${module.plural.toLowerCase()} yet` })).toBeVisible();

    await page.getByRole('button', { name: `New ${module.label.toLowerCase()}` }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: `New ${module.label.toLowerCase()}` })).toBeVisible();

    // Only this module's templates are offered.
    const templates = templatesFor(module.type);
    await expect(dialog.getByRole('listitem')).toHaveCount(templates.length);
    for (const template of templates) await expect(dialog.getByText(template.title, { exact: true })).toBeVisible();

    await dialog.getByText(templates[0].title, { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/new/${templates[0].id}$`));
    await page.getByRole('button', { name: /^Create / }).click();
    await expect(page.getByText(/is ready\. Publish it now/)).toBeVisible();

    await page.getByRole('link', { name: module.plural, exact: true }).first().click();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('table').getByRole('row')).toHaveCount(2);
  });
}

test('each module keeps its own data, with columns that fit it', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'tour-welcome');
  await createFromTemplate(page, 'form-contact');
  await createFromTemplate(page, 'website-restaurant');

  const headers = async () => (await page.getByRole('table').getByRole('columnheader').allTextContents()).map((text) => text.trim());
  const cell = (text: string) => page.getByRole('table').getByRole('cell', { name: text, exact: true });

  await nav(page).getByRole('link', { name: 'Product tours', exact: true }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('rowheader', { name: 'Welcome tour' })).toBeVisible();
  expect(await headers()).toEqual(expect.arrayContaining(['Steps', 'Appears on', 'How often']));
  await expect(cell('3')).toBeVisible();
  await expect(cell('All pages')).toBeVisible();

  await nav(page).getByRole('link', { name: 'Forms', exact: true }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('rowheader', { name: 'Contact us' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Fields' })).toBeVisible();
  expect(await headers()).toEqual(expect.arrayContaining(['Fields', 'Responses', 'Address']));
  await expect(page.getByRole('row', { name: /Contact us/ }).getByRole('cell', { name: '3', exact: true })).toBeVisible();

  await nav(page).getByRole('link', { name: 'Websites', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Websites', level: 1 })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Pages' })).toBeVisible();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2);
  expect(await headers()).toEqual(expect.arrayContaining(['Pages', 'Address']));

  await nav(page).getByRole('link', { name: 'All projects', exact: true }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(4);
  await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
});

test('table filters, search, sorting and actions', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'form-contact');
  await createFromTemplate(page, 'form-booking');
  await createFromTemplate(page, 'form-feedback');
  await page.goto('/forms');
  const rows = page.getByRole('table').locator('tbody tr');
  await expect(rows).toHaveCount(3);

  // Search.
  await page.getByRole('searchbox', { name: 'Search' }).fill('appointment');
  await expect(rows).toHaveCount(1);
  await expect(page.getByRole('rowheader', { name: 'Book an appointment' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search' }).fill('zzz');
  await expect(page.getByText('No results match your filters.')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search' }).fill('');

  // Sort by name, both ways.
  await page.getByRole('button', { name: 'Name' }).click();
  await expect(rows.first().getByRole('rowheader')).toHaveText('Book an appointment');
  await page.getByRole('button', { name: 'Name' }).click();
  await expect(rows.first().getByRole('rowheader')).toHaveText('How did we do?');

  // Status filter, after publishing one.
  await page.getByRole('rowheader', { name: 'Contact us' }).getByRole('link').click();
  await publish(page, `contact-${Date.now()}`);
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
  await page.getByRole('link', { name: 'Forms', exact: true }).first().click();
  await page.getByRole('button', { name: 'Live (1)' }).click();
  await expect(rows).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Open Contact us live' })).toBeVisible();
  await page.getByRole('button', { name: 'Draft (2)' }).click();
  await expect(rows).toHaveCount(2);
  await page.getByRole('button', { name: 'All (3)' }).click();

  // Duplicate makes a draft with the same content.
  await page.getByRole('button', { name: 'Duplicate Contact us' }).click();
  await expect(page.getByRole('rowheader', { name: 'Contact us (copy)' })).toBeVisible();
  await expect(page.getByRole('row', { name: /Contact us \(copy\)/ }).getByText('Draft')).toBeVisible();

  // Edit opens the editor.
  await page.getByRole('link', { name: 'Edit Contact us (copy)' }).click();
  await expect(page.getByTestId('canvas-stage')).toBeVisible();
  await page.getByRole('button', { name: 'Back to project' }).click();
  await page.getByRole('link', { name: 'Forms', exact: true }).first().click();

  // Delete asks first.
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Delete Contact us (copy)' }).click();
  await expect(page.getByRole('rowheader', { name: 'Contact us (copy)' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Contact us (copy)' }).click();
  await expect(page.getByRole('rowheader', { name: 'Contact us (copy)' })).toHaveCount(0);
});

test('responses are counted in the form table', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'form-contact');
  const slug = `count-${Date.now()}`;
  await publish(page, slug);
  await expect(page.getByText('Published! Your changes are live.')).toBeVisible();

  await page.goto(`/s/${slug}`);
  await page.getByLabel(/Name/).fill('Vera');
  await page.getByLabel(/Email/).fill('vera@example.com');
  await page.getByLabel(/Message/).fill('Hello');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText("Thanks! We'll be in touch.")).toBeVisible();

  await page.goto('/forms');
  const row = page.getByRole('row', { name: /Contact us/ });
  await expect(row.getByRole('cell', { name: '1', exact: true })).toBeVisible();
});

test('sidebar create dialog starts by choosing a type, and can start blank with a name', async ({ page }) => {
  await signUp(page);
  await nav(page).getByRole('button', { name: 'Create new' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'What do you want to create?' })).toBeVisible();
  await expect(dialog.getByRole('button')).toHaveCount(MODULE_LIST.length + 1);

  await dialog.getByRole('button', { name: /Product tour/ }).click();
  await dialog.getByLabel('Search templates').fill('feature');
  await expect(dialog.getByRole('listitem')).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Back to all types' }).click();
  await dialog.getByRole('button', { name: /^Form/ }).click();

  await dialog.getByLabel('Or start blank:').fill('My signup form');
  await dialog.getByRole('button', { name: 'Create blank' }).click();
  await expect(page.getByRole('heading', { name: 'My signup form' })).toBeVisible();
  await expect(page.getByTestId('canvas-stage')).toBeVisible();

  await page.keyboard.press('Escape');
  await page.goto('/forms');
  await expect(page.getByRole('rowheader', { name: 'My signup form' })).toBeVisible();
});

test('wizard project name is used in the table', async ({ page }) => {
  await signUp(page);
  await page.goto('/new/tour-welcome');
  await page.getByLabel('Project name (optional)').fill('Dashboard intro');
  await page.getByRole('button', { name: /^Create / }).click();
  await expect(page.getByText(/is ready/)).toBeVisible();
  await page.goto('/tours');
  await expect(page.getByRole('rowheader', { name: 'Dashboard intro' })).toBeVisible();
});

test('dialog closes with Escape and the close button', async ({ page }) => {
  await signUp(page);
  await page.goto('/forms');
  await page.getByRole('button', { name: 'New form' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'New form' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
