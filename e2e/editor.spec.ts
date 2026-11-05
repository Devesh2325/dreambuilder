import { expect, FrameLocator, Locator, Page, test } from '@playwright/test';
import { canvas, createInEditor, signUp, waitForSaved } from './helpers';

const stepBar = (page: Page) => page.getByTestId('step-bar');

test.describe('steps show one at a time', () => {
  test('tour: step tabs, next and previous, add and delete', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'tour-welcome');
    const frame = canvas(page);
    await expect(frame.locator('.fp-step')).toHaveCount(1);
    await expect(stepBar(page).getByRole('button', { name: /^Step \d$/ })).toHaveCount(3);
    await expect(stepBar(page).getByRole('button', { name: 'Step 1' })).toHaveAttribute('aria-current', 'step');
    const first = (await frame.locator('.fp-step').textContent())!;

    await stepBar(page).getByRole('button', { name: 'Next step' }).click();
    await expect(stepBar(page).getByRole('button', { name: 'Step 2' })).toHaveAttribute('aria-current', 'step');
    await expect(frame.locator('.fp-step')).toHaveCount(1);
    await expect(frame.locator('.fp-step')).not.toHaveText(first);

    await stepBar(page).getByRole('button', { name: 'Previous step' }).click();
    await expect(frame.locator('.fp-step')).toHaveText(first);
    await expect(stepBar(page).getByRole('button', { name: 'Previous step' })).toBeDisabled();

    await stepBar(page).getByRole('button', { name: 'Add step' }).click();
    await expect(stepBar(page).getByRole('button', { name: /^Step \d$/ })).toHaveCount(4);
    await expect(stepBar(page).getByRole('button', { name: 'Step 2' })).toHaveAttribute('aria-current', 'step');
    await expect(frame.locator('.fp-step')).toHaveCount(1);

    await stepBar(page).getByRole('button', { name: 'Delete this step' }).click();
    await expect(stepBar(page).getByRole('button', { name: /^Step \d$/ })).toHaveCount(3);
    await expect(frame.locator('.fp-step')).toHaveCount(1);
  });

  test('a step sits in the middle of the canvas', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'tour-welcome');
    const step = (await canvas(page).locator('.fp-step').boundingBox())!;
    const frame = (await page.locator('iframe[title="Design canvas"]').boundingBox())!;
    expect(Math.abs(step.x + step.width / 2 - (frame.x + frame.width / 2))).toBeLessThan(8);
  });

  test('choosing a block in Layers shows the step it is in', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'tour-welcome');
    await page.getByRole('tab', { name: 'Layers' }).click();
    const headings = page.getByRole('tabpanel', { name: 'Layers' }).getByRole('button', { name: 'Heading', exact: true });
    await headings.nth(2).click();
    await expect(stepBar(page).getByRole('button', { name: 'Step 3' })).toHaveAttribute('aria-current', 'step');
    await expect(canvas(page).getByTestId('selection')).toBeVisible();
  });

  test('demo screens are one at a time too', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'demo-walkthrough');
    await expect(canvas(page).locator('.fp-screen')).toHaveCount(1);
    await expect(stepBar(page).getByRole('button', { name: /^Screen \d$/ })).toHaveCount(3);
    await stepBar(page).getByRole('button', { name: 'Screen 3' }).click();
    await expect(canvas(page).locator('.fp-screen')).toHaveCount(1);
  });

  test('multi-step forms are one at a time, while visitors still get them all', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'form-lead');
    const frame = canvas(page);
    await expect(frame.locator('fieldset.fp-form')).toHaveCount(1);
    await expect(frame.getByText('About you')).toBeVisible();
    await stepBar(page).getByRole('button', { name: 'Step 2' }).click();
    await expect(frame.getByText('Your company')).toBeVisible();
    await expect(frame.getByText('About you')).toHaveCount(0);
  });

  test('slides from a list: adding and deleting changes the list', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'banner-carousel-messages');
    const slides = stepBar(page).getByRole('button', { name: /^Slide \d$/ });
    const count = await slides.count();
    expect(count).toBeGreaterThan(1);
    await expect(canvas(page).locator('.fp-slide')).toHaveCount(1);

    await stepBar(page).getByRole('button', { name: 'Add slide' }).click();
    await expect(slides).toHaveCount(count + 1);
    await expect(stepBar(page).getByRole('button', { name: 'Slide 2' })).toHaveAttribute('aria-current', 'step');

    await stepBar(page).getByRole('button', { name: 'Delete this slide' }).click();
    await expect(slides).toHaveCount(count);
    await expect(canvas(page).locator('.fp-slide')).toHaveCount(1);
  });

  test('websites switch pages from the same bar', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'website-business');
    await stepBar(page).getByRole('group', { name: 'Pages' }).getByRole('button', { name: 'About' }).click();
    await expect(canvas(page).getByRole('heading', { name: 'About us' })).toBeVisible();
  });
});

test.describe('variables', () => {
  test('have their own tool, and your own variables can be added, used and removed', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const panel = page.getByRole('tabpanel', { name: 'Variables' });
    await expect(panel).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Details' })).toHaveCount(0);

    await panel.getByRole('button', { name: 'New variable' }).click();
    await panel.getByLabel('What is it called?').fill('Phone number');
    await panel.getByRole('button', { name: 'Save variable' }).click();
    await panel.getByRole('textbox', { name: 'Phone number' }).fill('555-0100');

    // Add a text block, then use the variable in it.
    await page.getByRole('tab', { name: 'Add' }).click();
    await page.getByRole('tabpanel', { name: 'Add' }).getByRole('button', { name: 'Text', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByLabel('Text', { exact: true }).fill('Call ');
    await page.getByLabel('Insert a variable into Text').selectOption({ label: 'Phone number' });
    const frame = canvas(page);
    await expect(frame.getByText('Call 555-0100')).toBeVisible();

    // One change updates it.
    await page.getByRole('tab', { name: 'Variables' }).click();
    await panel.getByRole('textbox', { name: 'Phone number' }).fill('555-0199');
    await expect(frame.getByText('Call 555-0199')).toBeVisible();

    // It's kept after reloading.
    await waitForSaved(page);
    await page.reload();
    await expect(canvas(page).getByText('Call 555-0199')).toBeVisible();
    await expect(panel.getByRole('textbox', { name: 'Phone number' })).toHaveValue('555-0199');

    // Removing one that's in use asks first.
    page.once('dialog', (dialog) => dialog.accept());
    await panel.getByRole('button', { name: 'Remove Phone number' }).click();
    await expect(panel.getByRole('textbox', { name: 'Phone number' })).toHaveCount(0);
    await expect(canvas(page).getByText(/^Call\s*$/)).toBeVisible();
  });

  test('blank projects can have variables too', async ({ page }) => {
    await signUp(page);
    await page.goto('/create?type=page');
    await page.getByRole('button', { name: /Start blank/ }).click();
    await page.getByRole('button', { name: 'Create and open editor' }).click();
    await expect(page.getByTestId('canvas-stage')).toBeVisible();
    await page.getByRole('tab', { name: 'Variables' }).click();
    const panel = page.getByRole('tabpanel', { name: 'Variables' });
    await panel.getByRole('button', { name: 'New variable' }).click();
    await panel.getByLabel('What is it called?').fill('Sale ends');
    await panel.getByRole('button', { name: 'Save variable' }).click();
    await expect(panel.getByRole('textbox', { name: 'Sale ends' })).toBeVisible();
  });

  test('fields from a list say which list, and never show code', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'faq-general');
    await canvas(page).locator('.fp-accordion').first().click();
    await expect(page.getByText(/Uses Question from /).first()).toBeVisible();
    await expect(page.locator('input, textarea').filter({ hasText: '{{' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Edit the list' }).first().click();
    await expect(page.getByRole('tabpanel', { name: 'Variables' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Type your own/ })).toHaveCount(0);
  });
});

test.describe('style panel', () => {
  const openGroup = async (page: Page, title: string): Promise<Locator> => {
    const group = page.getByRole('region', { name: title, exact: true });
    const toggle = group.getByRole('button', { name: title, exact: true });
    if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click();
    return group;
  };

  const css = (locator: Locator, property: string) =>
    locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

  /** Selects the heading on a landing page, with its Style tab open. */
  const openHeading = async (page: Page, frame: FrameLocator) => {
    const heading = frame.getByRole('heading', { level: 1 });
    await heading.click();
    await page.getByRole('tab', { name: 'style' }).click();
    return heading;
  };

  const TEXT_CASES: [group: string, label: string, value: string, property: string, expected: string][] = [
    ['Spacing', 'Padding top', '11', 'padding-top', '11px'],
    ['Spacing', 'Padding right', '12', 'padding-right', '12px'],
    ['Spacing', 'Padding bottom', '13', 'padding-bottom', '13px'],
    ['Spacing', 'Padding left', '14', 'padding-left', '14px'],
    ['Spacing', 'Margin top', '15', 'margin-top', '15px'],
    ['Spacing', 'Margin right', '16', 'margin-right', '16px'],
    ['Spacing', 'Margin bottom', '17', 'margin-bottom', '17px'],
    ['Spacing', 'Margin left', '18', 'margin-left', '18px'],
    ['Size', 'Width', '420', 'width', '420px'],
    ['Size', 'Height', '150', 'height', '150px'],
    ['Size', 'Min width', '100', 'min-width', '100px'],
    ['Size', 'Min height', '60', 'min-height', '60px'],
    ['Size', 'Max width', '500', 'max-width', '500px'],
    ['Size', 'Max height', '200', 'max-height', '200px'],
    ['Typography', 'Font size', '30', 'font-size', '30px'],
    ['Typography', 'Letter spacing', '2', 'letter-spacing', '2px'],
    ['Border', 'Border width', '3', 'border-top-width', '3px'],
    ['Border', 'Corner radius', '12', 'border-top-left-radius', '12px'],
    ['Effects', 'Rotate (degrees)', '90', 'rotate-check', ''],
    ['Effects', 'Blur (pixels)', '2', 'filter', 'blur(2px)'],
    ['Position', 'Top', '4', 'top', '4px'],
    ['Position', 'Right', '5', 'right', '5px'],
    ['Position', 'Bottom', '6', 'bottom', '6px'],
    ['Position', 'Left', '7', 'left', '7px'],
    ['Position', 'Stack order', '5', 'z-index', '5'],
    ['Position', 'Order', '2', 'order', '2'],
    ['Position', 'Grow', '1', 'flex-grow', '1'],
  ];

  test('every number field changes the block', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const frame = canvas(page);
    const heading = await openHeading(page, frame);
    await openGroup(page, 'Position');
    await page.getByRole('combobox', { name: 'Position', exact: true }).selectOption('relative');

    for (const [group, label, value, property, expected] of TEXT_CASES) {
      await openGroup(page, group);
      await page.getByRole('textbox', { name: label, exact: true }).fill(value);
      if (property === 'rotate-check') {
        await expect.poll(() => css(heading, 'transform'), label).toContain('matrix');
        await page.getByRole('textbox', { name: label, exact: true }).fill('');
        continue;
      }
      await expect.poll(() => css(heading, property), label).toBe(expected);
    }
  });

  test('every choice changes the block', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const frame = canvas(page);
    const heading = await openHeading(page, frame);
    for (const group of ['Size', 'Border', 'Effects', 'Position']) await openGroup(page, group);

    await page.getByRole('button', { name: 'Font', exact: true }).click();
    await page.getByRole('listbox', { name: 'Font' }).getByRole('option', { name: 'Lora' }).click();
    await expect.poll(() => css(heading, 'font-family')).toContain('Lora');
    await expect(frame.locator('link[href*="family=Lora"]')).toBeAttached();
    await page.getByLabel('Weight').selectOption('300');
    await expect.poll(() => css(heading, 'font-weight')).toBe('300');
    await page.getByRole('textbox', { name: 'Line height' }).fill('2');
    await page.getByRole('textbox', { name: 'Font size' }).fill('20');
    await expect.poll(() => css(heading, 'line-height')).toBe('40px');
    await page.getByRole('button', { name: 'Text align: Right' }).click();
    await expect.poll(() => css(heading, 'text-align')).toBe('right');
    await page.getByRole('button', { name: 'Case: AA', exact: true }).click();
    await expect.poll(() => css(heading, 'text-transform')).toBe('uppercase');
    await page.getByRole('button', { name: 'Style: Italic' }).click();
    await expect.poll(() => css(heading, 'font-style')).toBe('italic');
    await page.getByRole('button', { name: 'Line: Underline' }).click();
    await expect.poll(() => css(heading, 'text-decoration-line')).toBe('underline');
    await page.getByRole('textbox', { name: 'Text color', exact: true }).fill('#123456');
    await expect.poll(() => css(heading, 'color')).toBe('rgb(18, 52, 86)');

    await page.getByLabel('Overflow').selectOption('hidden');
    await expect.poll(() => css(heading, 'overflow-x')).toBe('hidden');

    await page.getByLabel('Border style').selectOption('dashed');
    await expect.poll(() => css(heading, 'border-top-style')).toBe('dashed');
    await page.getByRole('textbox', { name: 'Border color', exact: true }).fill('#ff0000');
    await expect.poll(() => css(heading, 'border-top-color')).toBe('rgb(255, 0, 0)');
    await page.getByRole('button', { name: 'Set each corner separately' }).click();
    await page.getByRole('textbox', { name: 'Top left radius' }).fill('21');
    await page.getByRole('textbox', { name: 'Bottom right radius' }).fill('9');
    await expect.poll(() => css(heading, 'border-top-left-radius')).toBe('21px');
    await expect.poll(() => css(heading, 'border-bottom-right-radius')).toBe('9px');

    await page.getByRole('button', { name: 'Shadow: M' }).click();
    await expect.poll(() => css(heading, 'box-shadow')).not.toBe('none');
    await page.getByLabel(/^Opacity/).fill('0.5');
    await expect.poll(() => css(heading, 'opacity')).toBe('0.5');
    await page.getByRole('combobox', { name: 'Position', exact: true }).selectOption('absolute');
    await expect.poll(() => css(heading, 'position')).toBe('absolute');
    await page.getByLabel('Align self').selectOption('center');
    await expect.poll(() => css(heading, 'align-self')).toBe('center');
  });

  test('the three kinds of fill, and clearing them', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const frame = canvas(page);
    const heading = await openHeading(page, frame);

    await page.getByRole('textbox', { name: 'Background', exact: true }).fill('#00ff00');
    await expect.poll(() => css(heading, 'background-color')).toBe('rgb(0, 255, 0)');

    await page.getByRole('tab', { name: 'gradient' }).click();
    await page.getByRole('button', { name: 'Gradient 1' }).click();
    await expect.poll(() => css(heading, 'background-image')).toContain('linear-gradient');
    await expect.poll(() => css(heading, 'background-color')).toBe('rgba(0, 0, 0, 0)');

    await page.getByRole('tab', { name: 'image' }).click();
    await page.getByRole('region', { name: 'Fill' }).getByRole('textbox').fill('https://example.com/a.png');
    await expect.poll(() => css(heading, 'background-image')).toContain('https://example.com/a.png');
    await page.getByLabel('Image size').selectOption('contain');
    await expect.poll(() => css(heading, 'background-size')).toBe('contain');
    await page.getByLabel('Image position').selectOption('top');
    await expect.poll(() => css(heading, 'background-position')).toBe('50% 0%');
    await page.getByLabel('Repeat').selectOption('no-repeat');
    await expect.poll(() => css(heading, 'background-repeat')).toBe('no-repeat');

    await page.getByRole('button', { name: 'Clear fill styles' }).click();
    await expect.poll(() => css(heading, 'background-image')).toBe('none');
  });

  test('layout controls change a container', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const frame = canvas(page);
    const box = frame.locator('.fp-box').first();
    await frame.getByRole('heading', { level: 1 }).click();
    await frame.getByRole('button', { name: 'Select parent block' }).click();
    await page.getByRole('tab', { name: 'style' }).click();

    await page.getByRole('button', { name: 'Display: Flex' }).click();
    await expect.poll(() => css(box, 'display')).toBe('flex');
    await page.getByRole('button', { name: 'Direction: Horizontal' }).click();
    await expect.poll(() => css(box, 'flex-direction')).toBe('row');
    await page.getByRole('button', { name: 'Wrap: Wrap' }).click();
    await expect.poll(() => css(box, 'flex-wrap')).toBe('wrap');
    await page.getByLabel('Distribute').selectOption('space-between');
    await expect.poll(() => css(box, 'justify-content')).toBe('space-between');
    await page.getByLabel('Align', { exact: true }).selectOption('center');
    await expect.poll(() => css(box, 'align-items')).toBe('center');
    await page.getByRole('textbox', { name: 'Gap' }).fill('31');
    await expect.poll(() => css(box, 'row-gap')).toBe('31px');

    await page.getByRole('button', { name: 'Display: Grid' }).click();
    for (let n = 0; n < 3; n += 1) await page.getByRole('button', { name: 'More columns' }).click();
    await expect.poll(async () => (await css(box, 'grid-template-columns')).split(' ').length).toBe(3);

    await page.getByRole('button', { name: 'Clear layout styles' }).click();
    await expect.poll(() => css(box, 'display')).toBe('flex');
    await expect.poll(() => css(box, 'flex-direction')).toBe('column');
  });

  test('arrow keys step a value and keep its unit, and styles survive a reload', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const frame = canvas(page);
    const heading = await openHeading(page, frame);
    const padding = page.getByRole('textbox', { name: 'Padding top' });
    await padding.fill('2rem');
    await padding.press('ArrowUp');
    await expect(padding).toHaveValue('2.1rem');
    await padding.fill('10');
    await padding.press('Shift+ArrowUp');
    await expect(padding).toHaveValue('20');
    await expect.poll(() => css(heading, 'padding-top')).toBe('20px');

    await waitForSaved(page);
    await page.reload();
    await expect.poll(() => css(canvas(page).getByRole('heading', { level: 1 }), 'padding-top')).toBe('20px');
  });

  test('shorthand from a template shows on each side, and a side can override it', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'faq-general');
    const frame = canvas(page);
    const root = frame.locator('.fp-page');
    await frame.locator('.fp-accordion').first().click();
    await frame.getByRole('button', { name: 'Select parent block' }).click();
    await page.getByRole('tab', { name: 'style' }).click();
    await expect(page.getByRole('textbox', { name: 'Padding top' })).toHaveAttribute('placeholder', '32px');
    await page.getByRole('textbox', { name: 'Padding top' }).fill('50');
    await expect.poll(() => css(root, 'padding-top')).toBe('50px');
  });
});

test.describe('layers', () => {
  test('have a drag handle and move up and down buttons', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    await page.getByRole('tab', { name: 'Layers' }).click();
    const panel = page.getByRole('tabpanel', { name: 'Layers' });
    const children = canvas(page).locator('.fp-box').first().locator('> *');
    await expect(children.first()).toHaveClass(/fp-heading/);

    const row = panel.locator('div.group', { has: page.getByRole('button', { name: 'Heading', exact: true }) }).first();
    await row.hover();
    await expect(row.locator('[title="Drag to move"]')).toBeVisible();
    await expect(row.getByRole('button', { name: 'Move Heading up' })).toBeDisabled();

    await row.getByRole('button', { name: 'Move Heading down' }).click();
    await expect(children.nth(1)).toHaveClass(/fp-heading/);

    const moved = panel.locator('div.group', { has: page.getByRole('button', { name: 'Heading', exact: true }) }).first();
    await moved.hover();
    await moved.getByRole('button', { name: 'Move Heading up' }).click();
    await expect(children.first()).toHaveClass(/fp-heading/);

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(children.nth(1)).toHaveClass(/fp-heading/);
  });
});

test.describe('section library', () => {
  const sections = async (page: Page) => {
    await page.getByRole('tab', { name: 'Add' }).click();
    const panel = page.getByRole('tabpanel', { name: 'Add' });
    await panel.getByRole('tab', { name: 'sections' }).click();
    return panel;
  };

  test('a section is added below the selected one, and by dragging', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const frame = canvas(page);
    await frame.getByRole('heading', { level: 1 }).click();
    const panel = await sections(page);

    await panel.getByRole('button', { name: 'Add Call to action band' }).click();
    const added = frame.getByRole('heading', { name: 'Ready to get started?' }).first();
    await expect(added).toBeVisible();
    const all = frame.locator('.fp-section');
    const indexOfAdded = await all.evaluateAll((items) => items.findIndex((item) => item.textContent?.includes('Ready to get started?')));
    expect(indexOfAdded).toBe(1);
    await panel.getByRole('group', { name: 'Section type' }).getByRole('button', { name: 'Social proof' }).click();
    await panel.getByRole('button', { name: 'Add Key numbers' }).dragTo(added);
    await expect(frame.getByText('Average rating')).toBeVisible();

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(frame.getByText('Average rating')).toHaveCount(0);
  });

  test('other modules are not offered page sections', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'tour-welcome');
    await page.getByRole('tab', { name: 'Add' }).click();
    await expect(page.getByRole('tabpanel', { name: 'Add' }).getByRole('tab', { name: 'sections' })).toHaveCount(0);
  });

  test('a block saved to the team library can be added to another project', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const frame = canvas(page);
    const headline = await frame.getByRole('heading', { level: 1 }).innerText();
    await frame.getByRole('heading', { level: 1 }).click();
    await page.getByRole('tab', { name: 'advanced' }).click();
    await page.getByRole('button', { name: 'Save to team library' }).click();
    await page.getByRole('dialog').getByLabel('Name').fill('Our headline');
    await page.getByRole('button', { name: 'Save to library' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await createInEditor(page, 'page-blog-article');
    const panel = await sections(page);
    await panel.getByRole('group', { name: 'Section type' }).getByRole('button', { name: 'Team' }).click();
    await panel.getByRole('button', { name: 'Add Our headline' }).click();
    // Saved with its words filled in, so it doesn't depend on the first project's variables.
    await expect(canvas(page).getByRole('heading', { name: headline })).toBeVisible();

    await page.goto('/templates');
    await page.getByRole('tab', { name: /^Sections/ }).click();
    await expect(page.getByText('Our headline')).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete Our headline' }).click();
    await expect(page.getByText('Our headline')).toHaveCount(0);
  });
});

test.describe('team templates', () => {
  test('built from a blank project, saved, and used by the team', async ({ page }) => {
    await signUp(page);
    await page.goto('/templates');
    await page.getByRole('button', { name: 'Create template' }).click();
    await page.getByLabel('Template name').fill('Campaign page');
    await page.getByLabel('Template type').selectOption('page');
    await page.getByRole('button', { name: 'Start building' }).click();
    await expect(page.getByText(/Build your template from sections/)).toBeVisible();

    // A variable, a section using it, and a webhook that must not travel.
    await page.getByRole('tab', { name: 'Variables' }).click();
    const variables = page.getByRole('tabpanel', { name: 'Variables' });
    await variables.getByRole('button', { name: 'New variable' }).click();
    await variables.getByLabel('What is it called?').fill('Offer');
    await variables.getByRole('button', { name: 'Save variable' }).click();
    await variables.getByRole('textbox', { name: 'Offer' }).fill('Half price');

    await page.getByRole('tab', { name: 'Add' }).click();
    await page.getByRole('tabpanel', { name: 'Add' }).getByRole('button', { name: 'Heading', exact: true }).click();
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByLabel('Text', { exact: true }).fill('');
    await page.getByLabel('Insert a variable into Text').selectOption({ label: 'Offer' });
    await expect(canvas(page).getByRole('heading', { name: 'Half price' })).toBeVisible();

    await page.getByRole('button', { name: / settings$/ }).click();
    await page.getByLabel('Send to webhook (optional)').fill('https://hooks.example.com/secret');

    await page.getByRole('button', { name: 'Save as template' }).click();
    await page.getByRole('dialog').getByLabel('Category (optional)').fill('Campaigns');
    await page.getByRole('button', { name: 'Save to library' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await waitForSaved(page);

    // It's in the library and on the create page.
    await page.goto('/create?type=page');
    await expect(page.getByRole('navigation', { name: 'Filter templates' }).getByRole('button', { name: 'Campaigns' })).toBeVisible();
    await page.getByRole('button', { name: 'Use Campaign page', exact: true }).click();

    // Its variables become the form, with the saved value to start from.
    await expect(page.getByRole('textbox', { name: 'Offer' })).toHaveValue('Half price');
    await page.getByRole('textbox', { name: 'Offer' }).fill('Two for one');
    await page.getByRole('button', { name: /^Create / }).click();
    await expect(page.getByTestId('canvas-stage')).toBeVisible();
    await expect(canvas(page).getByRole('heading', { name: 'Two for one' })).toBeVisible();

    // The new project keeps the variable, and not the webhook.
    await expect(page.getByRole('tabpanel', { name: 'Variables' }).getByRole('textbox', { name: 'Offer' })).toHaveValue('Two for one');
    await page.getByRole('tab', { name: 'Edit' }).click();
    await expect(page.getByLabel('Send to webhook (optional)')).toHaveValue('');

    // Deleting the template leaves projects made from it alone.
    await page.goto('/templates');
    await page.getByRole('tab', { name: /^Team templates/ }).click();
    await expect(page.getByRole('heading', { name: 'Campaign page' })).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete Campaign page' }).click();
    await expect(page.getByRole('heading', { name: 'No team templates yet' })).toBeVisible();
  });
});

test.describe('layout', () => {
  test('pages use the full width of a large screen', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    await signUp(page);
    const content = page.locator('main > div');
    expect((await content.boundingBox())!.width).toBeGreaterThan(1600);
    await page.goto('/forms');
    await expect(page.getByRole('heading', { name: 'Forms', level: 1 })).toBeVisible();
    expect((await content.boundingBox())!.width).toBeGreaterThan(1600);
  });

  test('the project preview fills the screen height', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await signUp(page);
    await createInEditor(page, 'form-contact');
    await page.getByRole('button', { name: 'Back to project' }).click();
    const preview = page.locator('iframe[title$="preview"]');
    await expect(preview).toBeVisible();
    expect((await preview.boundingBox())!.height).toBeGreaterThan(650);
  });

  for (const id of ['faq-general', 'form-contact']) {
    test(`${id}: the canvas is filled edge to edge, with no empty column`, async ({ page }) => {
      await page.setViewportSize({ width: 1600, height: 900 });
      await signUp(page);
      await createInEditor(page, id);
      const frame = canvas(page);
      const root = (await frame.locator('.fp-page').boundingBox())!;
      const iframe = (await page.locator('iframe[title="Design canvas"]').boundingBox())!;
      expect(root.width).toBeGreaterThan(iframe.width - 20);
      const fill = (await frame.locator('.fp-root').boundingBox())!;
      expect(fill.height).toBeGreaterThanOrEqual(iframe.height - 2);
      const stage = (await page.getByTestId('canvas-stage').boundingBox())!;
      expect(iframe.width).toBeGreaterThan(stage.width - 30);
    });
  }

  test('the editor is comfortable to read', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    const size = (locator: Locator) => locator.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    await canvas(page).getByRole('heading', { level: 1 }).click();
    await page.getByRole('tab', { name: 'style' }).click();
    expect(await size(page.getByRole('textbox', { name: 'Font size' }))).toBeGreaterThanOrEqual(14);
    expect((await page.getByRole('textbox', { name: 'Font size' }).boundingBox())!.height).toBeGreaterThanOrEqual(36);
    expect(await size(page.getByRole('region', { name: 'Typography' }).getByRole('button', { name: 'Typography' }))).toBeGreaterThanOrEqual(14);
    expect(await size(page.getByRole('tab', { name: 'Layers' }))).toBeGreaterThanOrEqual(11);
    expect((await page.getByRole('tabpanel', { name: 'Edit' }).boundingBox())!.width).toBeGreaterThanOrEqual(320);
  });

  test('the editor panel can be hidden and brought back', async ({ page }) => {
    await signUp(page);
    await createInEditor(page, 'page-launch');
    await expect(page.getByRole('tabpanel', { name: 'Variables' })).toBeVisible();
    await page.getByRole('button', { name: 'Hide panel' }).click();
    await expect(page.getByRole('tabpanel', { name: 'Variables' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Show panel' }).click();
    await expect(page.getByRole('tab', { name: 'Edit' })).toHaveAttribute('aria-selected', 'true');
  });
});
