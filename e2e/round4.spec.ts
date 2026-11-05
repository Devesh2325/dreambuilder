import { expect, Page, test } from '@playwright/test';
import { canvas, changeLocalData, createFromTemplate, createInEditor, publish, signUp, waitForSaved } from './helpers';

const css = (locator: ReturnType<Page['locator']>, property: string) =>
  locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

const addVariable = async (page: Page, name: string, value?: string) => {
  const panel = page.getByRole('tabpanel', { name: 'Variables' });
  await panel.getByRole('button', { name: 'New variable' }).click();
  await panel.getByLabel('What is it called?').fill(name);
  if (value) await panel.getByLabel('What is its value?').fill(value);
  return panel;
};

test.describe('landing page', () => {
  test('explains the product to people who are not signed in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Build it in minutes');
    await expect(page).toHaveTitle(/FlowPilot/);
    for (const section of ['One builder for everything you need', 'From idea to live in three steps', 'Powerful, without being complicated', 'Start from something great', 'Add it to the site you already have', 'Common questions']) {
      await expect(page.getByRole('heading', { name: section })).toBeVisible();
    }
    // Every module is explained, and real numbers are shown.
    await expect(page.getByRole('heading', { name: 'Product tours', level: 3 })).toBeVisible();
    await expect(page.getByText(/^\d+ templates$/)).toBeVisible();

    await page.getByText('Do I need to know how to code?').click();
    await expect(page.getByText(/You choose a template, fill in a form/)).toBeVisible();

    await page.getByRole('link', { name: 'Start free' }).click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  });

  test('anchors move within the page, and it scrolls', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Landing page' }).getByRole('link', { name: 'Features' }).click();
    await expect(page.getByRole('heading', { name: 'Powerful, without being complicated' })).toBeInViewport();
  });

  test('works on a phone without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const box = page.locator('.h-screen').first();
    expect(await box.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  });

  test('signed-in people get the dashboard at the same address, and the page at /welcome', async ({ page }) => {
    await signUp(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /^Welcome/ })).toBeVisible();
    await page.goto('/welcome');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Build it in minutes');
  });

  test('signing out goes to log in, not back to the sales page', async ({ page }) => {
    await signUp(page);
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  });
});

test.describe('industry templates', () => {
  test('websites and pages are chosen by industry', async ({ page }) => {
    await signUp(page);
    for (const type of ['website', 'page']) {
      await page.goto(`/create?type=${type}`);
      const filter = page.getByRole('navigation', { name: 'Filter templates' });
      await expect(filter.getByRole('heading', { name: 'Your industry' })).toBeVisible();
      await filter.getByRole('button', { name: 'Finance and insurance', exact: true }).click();
      const list = page.getByRole('list', { name: 'Templates' });
      await expect(list.getByRole('listitem').first()).toBeVisible();
      for (const category of await list.locator('h3 + span').allTextContents()) expect(category).toBe('Finance and insurance');
    }
    await page.goto('/create?type=page');
    await page.getByRole('navigation', { name: 'Filter templates' }).getByRole('button', { name: 'Events', exact: true }).click();
    await expect(page.getByRole('list', { name: 'Templates' }).getByText('Wedding or event')).toBeVisible();
  });

  for (const id of ['page-fintech-app', 'page-restaurant-opening', 'page-school-admissions', 'website-accounting', 'website-travel-agency', 'website-bakery']) {
    test(`${id} publishes with every section filled in`, async ({ page }) => {
      await signUp(page);
      await createFromTemplate(page, id);
      const slug = `${id}-${Date.now()}`;
      await publish(page, slug);
      await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
      await page.goto(`/s/${slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('body')).not.toContainText('{{');
      await expect(page.locator('.fp-marquee')).toBeVisible();
      await expect(page.locator('.fp-carousel')).toBeVisible();
      await expect(page.locator('.fp-accordion').first()).toBeVisible();
    });
  }

  test('the older page templates gained sections too', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const frame = canvas(page);
    await expect(frame.locator('.fp-marquee')).toBeVisible();
    await expect(frame.locator('.fp-accordion').first()).toBeVisible();
    await expect(frame.getByRole('heading', { name: 'Ready to get started?' })).toBeVisible();
    await expect(frame.getByRole('heading', { name: 'Your business' })).toBeVisible();
    await expect(page.getByRole('tabpanel', { name: 'Variables' }).getByRole('textbox', { name: 'Closing message' })).toHaveValue('Ready to get started?');
  });
});

test.describe('marquee and carousel', () => {
  test('a marquee stands still to edit, and moves for visitors', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-fintech-app');
    const editing = canvas(page).locator('.fp-marquee-track').first();
    expect(await css(editing, 'animation-name')).toBe('none');
    await expect(canvas(page).getByText('No monthly fees')).toHaveCount(1);

    const slug = `marquee-${Date.now()}`;
    await publish(page, slug);
    await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
    await page.goto(`/s/${slug}`);
    const live = page.locator('.fp-marquee-track').first();
    expect(await css(live, 'animation-name')).toBe('fp-marquee');
    await expect(page.locator('.fp-marquee-set[aria-hidden=true]')).toHaveAttribute('inert', '');
    const first = await live.boundingBox();
    await page.waitForTimeout(500);
    expect((await live.boundingBox())!.x).toBeLessThan(first!.x);
  });

  test('they can be added from the blocks and from the section library', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-coming-soon');
    await page.getByRole('tab', { name: 'Add' }).click();
    const panel = page.getByRole('tabpanel', { name: 'Add' });
    await panel.getByRole('button', { name: 'Scrolling strip', exact: true }).click();
    await expect(canvas(page).locator('.fp-marquee')).toBeVisible();

    await panel.getByRole('tab', { name: 'sections' }).click();
    await panel.getByRole('button', { name: 'Add Hero carousel' }).click();
    await expect(canvas(page).getByRole('heading', { name: 'Your first big message' })).toBeVisible();
    await panel.getByRole('button', { name: 'Add Footer with columns' }).click();
    await expect(canvas(page).getByRole('heading', { name: 'Product', exact: true })).toBeVisible();
    await panel.getByRole('button', { name: 'Add Six features' }).click();
    await expect(canvas(page).getByRole('heading', { name: 'Supported' })).toBeVisible();
    await panel.getByRole('button', { name: 'Add Bold scrolling banner' }).click();
    await expect(canvas(page).getByText('Limited places').first()).toBeVisible();
  });

  test('carousel slides have their own step bar in a page', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-fintech-app');
    const bar = page.getByTestId('step-bar');
    await expect(bar.getByRole('button', { name: 'Slide 2' })).toBeVisible();
    await bar.getByRole('button', { name: 'Slide 2' }).click();
    await expect(canvas(page).getByText("Finally, an app that doesn't make money confusing.")).toBeInViewport();
  });
});

test.describe('variables', () => {
  test('the header has a Save button, for anyone who wants to be sure', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const save = page.locator('header').getByRole('button', { name: 'Save', exact: true });
    await expect(save).toBeDisabled();
    await page.getByRole('tabpanel', { name: 'Variables' }).getByLabel('Headline').fill('Changed by me');
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByRole('status').filter({ hasText: /^Saved$/ })).toBeVisible();
    await expect(save).toBeDisabled();
    await page.reload();
    await expect(canvas(page).getByRole('heading', { name: 'Changed by me' })).toBeVisible();
  });

  test('a new variable saves with its value, and can be renamed without breaking', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const panel = await addVariable(page, 'Support phone', '555-0100');
    await panel.getByRole('button', { name: 'Save variable' }).click();
    await expect(panel.getByRole('status').filter({ hasText: 'Support phone is saved' })).toBeVisible();

    await canvas(page).getByText('Our newest release saves your team hours every week.').click();
    await page.getByRole('tab', { name: 'content' }).click();
    await page.getByRole('button', { name: 'Type your own Text' }).click();
    await page.getByRole('textbox', { name: 'Text', exact: true }).fill('Call ');
    await page.getByLabel('Insert a variable into Text').selectOption({ label: 'Support phone' });
    await expect(canvas(page).getByText('Call 555-0100')).toBeVisible();

    await page.getByRole('tab', { name: 'Variables' }).click();
    await panel.getByRole('button', { name: 'Edit Support phone' }).click();
    await page.getByRole('textbox', { name: 'Variable name' }).fill('Help line');
    await panel.getByRole('button', { name: 'Save changes' }).click();
    await expect(panel.getByRole('textbox', { name: 'Help line', exact: true })).toHaveValue('555-0100');
    await expect(canvas(page).getByText('Call 555-0100')).toBeVisible();

    await waitForSaved(page);
    await page.reload();
    await expect(page.getByRole('tabpanel', { name: 'Variables' }).getByRole('textbox', { name: 'Help line', exact: true })).toHaveValue('555-0100');
  });

  test('any text can be made into a variable, in one click', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    await page.getByRole('tab', { name: 'Add' }).click();
    await page.getByRole('tabpanel', { name: 'Add' }).getByRole('button', { name: 'Text', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByRole('textbox', { name: 'Text', exact: true }).fill('Open every day');
    await page.getByRole('button', { name: 'Make this a variable' }).click();
    await page.getByLabel('Name for this variable').fill('Opening hours');
    await page.getByRole('button', { name: 'Save', exact: true }).last().click();
    await expect(page.getByText('Uses your Opening hours')).toBeVisible();
    await page.getByRole('button', { name: 'Change it' }).first().click();
    const field = page.getByRole('tabpanel', { name: 'Variables' }).getByRole('textbox', { name: 'Opening hours' });
    await expect(field).toHaveValue('Open every day');
    await field.fill('Closed Mondays');
    await expect(canvas(page).getByText('Closed Mondays')).toBeVisible();
  });

  test('a repeating list makes a block appear once per item', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-coming-soon');
    const panel = await addVariable(page, 'Team members');
    await panel.getByLabel('What kind of thing is it?').selectOption('list');
    await panel.getByLabel('Part 1 name').fill('Name');
    // The form stays inside the panel.
    const scroller = panel.locator('.overflow-y-auto').first();
    expect(await scroller.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect((await panel.getByLabel('Part 1 type').boundingBox())!.x + 96).toBeLessThanOrEqual((await panel.boundingBox())!.x + (await panel.boundingBox())!.width);
    await panel.getByRole('button', { name: '+ Add a part' }).click();
    await panel.getByLabel('Part 2 name').fill('Role');
    await panel.getByRole('button', { name: 'Save variable' }).click();
    await expect(panel.getByRole('status')).toContainText('Repeat for each item in');

    await panel.getByLabel('Name', { exact: true }).fill('Sam');
    await panel.getByLabel('Role', { exact: true }).fill('Founder');
    await panel.getByRole('button', { name: 'Add item' }).click();
    await panel.getByLabel('Name', { exact: true }).nth(1).fill('Maya');

    // A card, set to repeat, with an item's part inside it.
    await page.getByRole('tab', { name: 'Add' }).click();
    const add = page.getByRole('tabpanel', { name: 'Add' });
    await add.getByRole('button', { name: 'Card', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByRole('tab', { name: 'advanced' }).click();
    await page.getByLabel(/^Repeat for each item in/).selectOption({ label: 'Team members' });
    await page.getByRole('tab', { name: 'Add' }).click();
    await add.getByRole('button', { name: 'Text', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByRole('tab', { name: 'content' }).click();
    await page.getByRole('textbox', { name: 'Text', exact: true }).fill('Meet ');
    await page.getByLabel('Insert a variable into Text').selectOption({ label: 'Name' });

    await expect(canvas(page).getByText('Meet Sam')).toBeVisible();
    await expect(canvas(page).getByText('Meet Maya')).toBeVisible();
  });

  test('a global variable reaches every project, and only admins can change it', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const panel = await addVariable(page, 'Head office', 'London');
    await panel.getByRole('checkbox', { name: /^Global/ }).check();
    await panel.getByRole('button', { name: 'Save variable' }).click();
    const globals = page.getByRole('region', { name: 'Global variables' });
    await expect(globals.getByRole('textbox', { name: 'Head office' })).toHaveValue('London');

    // A different project can use it.
    await createInEditor(page, 'page-coming-soon');
    await expect(globals.getByRole('textbox', { name: 'Head office' })).toHaveValue('London');
    await page.getByRole('tab', { name: 'Add' }).click();
    await page.getByRole('tabpanel', { name: 'Add' }).getByRole('button', { name: 'Text', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByRole('textbox', { name: 'Text', exact: true }).fill('Based in ');
    await page.getByLabel('Insert a variable into Text').selectOption({ label: 'Head office' });
    await expect(canvas(page).getByText('Based in London')).toBeVisible();
    await page.getByRole('tab', { name: 'Variables' }).click();

    // One change, everywhere.
    await globals.getByRole('textbox', { name: 'Head office' }).fill('Paris');
    await globals.getByRole('button', { name: 'Save for all projects' }).click();
    await expect(canvas(page).getByText('Based in Paris')).toBeVisible();

    // What's published includes it.
    await waitForSaved(page);
    const slug = `global-${Date.now()}`;
    await publish(page, slug);
    await expect(page.getByText('Published! Your changes are live.')).toBeVisible();
    const projectUrl = page.url();
    await page.goto(`/s/${slug}`);
    await expect(page.getByText('Based in Paris')).toBeVisible();

    // Editors can use it, but not change it.
    await page.goto(projectUrl);
    await changeLocalData(page, `state.members[0].role = 'editor';`);
    await page.goto(`/studio/${projectUrl.split('/').pop()}`);
    await expect(globals.getByText('Only workspace owners and admins can change these.')).toBeVisible();
    await expect(globals.getByRole('textbox', { name: 'Head office' })).toBeDisabled();
  });
});

test.describe('saving a template', () => {
  test('the admin decides what people fill in', async ({ page }) => {
    await signUp(page);
    await page.goto('/create?type=page');
    await page.getByRole('button', { name: /Start blank/ }).click();
    await page.getByRole('dialog').getByLabel('Name').fill('Offer page');
    await page.getByRole('button', { name: 'Create and open editor' }).click();
    await expect(page.getByTestId('canvas-stage')).toBeVisible();

    // A blank project opens on Add.
    const add = page.getByRole('tabpanel', { name: 'Add' });
    await add.getByRole('button', { name: 'Heading', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByRole('textbox', { name: 'Text', exact: true }).fill('Summer sale');

    await page.getByRole('button', { name: 'Save as template' }).click();
    const dialog = page.getByRole('dialog');

    // Page text becomes a variable by ticking it, and a new one can be added here.
    await dialog.getByRole('checkbox', { name: 'Make "Summer sale" a variable' }).check();
    await dialog.getByLabel('Call it').fill('Offer name');

    await dialog.getByRole('button', { name: 'New variable' }).click();
    await dialog.getByLabel('What is it called?').fill('Internal code');
    await dialog.getByLabel('What is its value?').fill('X1');
    await dialog.getByRole('button', { name: 'Save variable' }).click();
    await dialog.getByRole('checkbox', { name: 'Ask for Internal code when creating' }).uncheck();

    await dialog.getByRole('button', { name: 'New variable' }).click();
    await dialog.getByLabel('What is it called?').fill('Plans');
    await dialog.getByLabel('What kind of thing is it?').selectOption('list');
    await dialog.getByLabel('Part 1 name').fill('Plan name');
    await dialog.getByRole('button', { name: 'Save variable' }).click();
    await dialog.getByLabel('Hint for Plans').fill('Add one for each plan you sell.');

    await dialog.getByRole('button', { name: 'Save to library' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(canvas(page).getByRole('heading', { name: 'Summer sale' })).toBeVisible();
    await waitForSaved(page);

    // Now someone uses it.
    await page.goto('/create?type=page');
    await page.getByRole('button', { name: 'Use Offer page', exact: true }).click();
    await expect(page.getByLabel('Offer name')).toHaveValue('Summer sale');
    await expect(page.getByText('Add one for each plan you sell.')).toBeVisible();
    await expect(page.getByLabel('Internal code')).toHaveCount(0);
    await page.getByLabel('Offer name').fill('Winter sale');
    await page.getByRole('button', { name: /^Create / }).click();
    await expect(canvas(page).getByRole('heading', { name: 'Winter sale' })).toBeVisible();

    // What was left off the form can still be changed in the editor.
    await expect(page.getByRole('tabpanel', { name: 'Variables' }).getByRole('textbox', { name: 'Internal code' })).toHaveValue('X1');
  });

  test('a required variable has to be filled in', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-coming-soon');
    await page.getByRole('button', { name: 'Save as template' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name', { exact: true }).fill('Strict template');
    await dialog.getByRole('button', { name: 'New variable' }).click();
    await dialog.getByLabel('What is it called?').fill('Launch date');
    await dialog.getByRole('button', { name: 'Save variable' }).click();
    await dialog.getByRole('checkbox', { name: 'Launch date is required' }).check();
    await dialog.getByRole('button', { name: 'Save to library' }).click();
    await expect(dialog).toHaveCount(0);

    await page.goto('/create?type=page');
    await page.getByRole('button', { name: 'Use Strict template', exact: true }).click();
    await page.getByRole('button', { name: /^Create / }).click();
    await expect(page.getByText('Launch date is required')).toBeVisible();
  });
});

test('project tabs have no stray scrollbar', async ({ page }) => {
  await signUp(page);
  await createFromTemplate(page, 'form-contact');
  const tabs = page.getByRole('tablist', { name: 'Project sections' });
  expect(await tabs.evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);
  expect(await css(tabs as never, 'scrollbar-width')).toBe('none');
  // The active tab's underline isn't clipped.
  const active = tabs.getByRole('tab', { name: 'Overview' });
  expect(await css(active as never, 'border-bottom-width')).toBe('2px');
});
