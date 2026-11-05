import { expect, FrameLocator, Page } from '@playwright/test';

export const BASE = '';

/** Marks the first-visit tours as seen, so they don't cover what a test is doing. */
export async function skipTours(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fp_tour_seen_dashboard', '1');
    localStorage.setItem('fp_tour_seen_editor', '1');
  });
}

export async function signUp(page: Page, workspace = 'Test Workspace', options: { tours?: boolean } = {}) {
  if (!options.tours) await skipTours(page);
  await page.goto(`${BASE}/signup`);
  await page.getByLabel('Your name').fill('Test User');
  await page.getByLabel('Workspace name').fill(workspace);
  await page.getByLabel('Email').fill(`user${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`);
  await page.getByLabel('Password').fill('a-long-enough-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: /^Welcome/ })).toBeVisible();
}

export const canvas = (page: Page): FrameLocator => page.frameLocator('iframe[title="Design canvas"]');

/** Waits until autosave has finished. */
export async function waitForSaved(page: Page) {
  await expect(page.getByRole('status').filter({ hasText: /^Saved$/ })).toBeVisible({ timeout: 10_000 });
}

/** Creates a project from a template with its default details, which opens the editor. */
export async function createInEditor(page: Page, templateId: string) {
  await page.goto(`${BASE}/new/${templateId}`);
  await page.getByRole('button', { name: /^Create / }).click();
  await expect(page.getByTestId('canvas-stage')).toBeVisible();
  await expect(page.getByText(/is ready\. Change anything/)).toBeVisible();
}

/** The same, ending on the project page. */
export async function createFromTemplate(page: Page, templateId: string) {
  await createInEditor(page, templateId);
  await page.getByRole('button', { name: 'Back to project' }).click();
  await expect(page.getByRole('tablist', { name: 'Project sections' })).toBeVisible();
}

/** Changes the demo backend's stored data directly, for setting up a situation. */
export async function changeLocalData(page: Page, change: string) {
  await page.evaluate((body) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open('flowpilot_local', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction('state', 'readwrite');
      const store = transaction.objectStore('state');
      const request = store.get('backend');
      request.onsuccess = () => {
        const state = request.result;
        new Function('state', body)(state);
        store.put(state, 'backend');
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), change);
}

export async function publish(page: Page, slug: string) {
  await page.locator('header').getByRole('button', { name: /^Publish/ }).click();
  await page.getByLabel('Web address').fill(slug);
  await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
}
