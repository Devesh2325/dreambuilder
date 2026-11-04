import { expect, FrameLocator, Page } from '@playwright/test';

export const BASE = '/v2';

export async function signUp(page: Page, workspace = 'Test Workspace') {
  await page.goto(`${BASE}/signup`);
  await page.getByLabel('Your name').fill('Test User');
  await page.getByLabel('Workspace name').fill(workspace);
  await page.getByLabel('Email').fill(`user${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`);
  await page.getByLabel('Password').fill('a-long-enough-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'All projects' })).toBeVisible();
}

export const canvas = (page: Page): FrameLocator => page.frameLocator('iframe[title="Design canvas"]');

/** Waits until autosave has finished. */
export async function waitForSaved(page: Page) {
  await expect(page.getByRole('status').filter({ hasText: /^Saved$/ })).toBeVisible({ timeout: 10_000 });
}

/** Creates a project from a template with its default details, ending on the project page. */
export async function createFromTemplate(page: Page, templateId: string) {
  await page.goto(`${BASE}/new/${templateId}`);
  await page.getByRole('button', { name: /^Create / }).click();
  await expect(page.getByText(/is ready\. Publish it now/)).toBeVisible();
}

export async function publish(page: Page, slug: string) {
  await page.getByRole('button', { name: /^Publish/ }).click();
  await page.getByLabel('Web address').fill(slug);
  await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
}
