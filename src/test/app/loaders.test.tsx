import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProviders } from '../../app/AppProviders';
import { AppRoutes } from '../../app/AppRoutes';
import { ThemeProvider } from '../../app/theme';
import { WorkspaceMembership } from '../../data/services';
import { blankProject } from '../../templates';
import { createFakeServices, TEST_USER } from './fakeServices';

const MEMBERSHIP = { organizationId: 'org-1', name: 'Test', role: 'owner', plan: 'free', branding: {} } as unknown as WorkspaceMembership;

const never = <T,>() => new Promise<T>(() => undefined);

const setUp = () => {
  localStorage.clear();
  return createFakeServices({ user: TEST_USER, memberships: [MEMBERSHIP] });
};

const open = (path: string, fake: ReturnType<typeof setUp>) =>
  render(
    <ThemeProvider><MemoryRouter initialEntries={[path]}>
      <AppProviders services={fake.services}>
        <Routes><Route path="/*" element={<AppRoutes />} /></Routes>
      </AppProviders>
    </MemoryRouter></ThemeProvider>,
  );

describe('loading states', () => {
  afterEach(cleanup);

  it('shows the app layout while the session is checked', () => {
    const fake = setUp();
    fake.services.auth.getUser = () => never();
    const { container } = open('/', fake);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(5);
  });

  it.each([
    ['dashboard', '/', 'projects', 'list'],
    ['module table', '/forms', 'projects', 'list'],
    ['project page', '/projects/p1', 'projects', 'get'],
    ['assets', '/assets', 'assets', 'list'],
    ['analytics', '/analytics', 'analytics', 'summary'],
    ['team', '/team', 'team', 'listMembers'],
    ['editor', '/studio/p1', 'projects', 'get'],
  ] as const)('shows a skeleton on the %s while it loads', async (_name, path, service, method) => {
    const fake = setUp();
    (fake.services[service] as unknown as Record<string, unknown>)[method] = () => never();
    const { container } = open(path, fake);
    // Long enough for the session and workspace to load, leaving only the page's own data.
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(screen.getAllByRole('status', { name: 'Loading' }).length).toBeGreaterThan(0);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows a spinner on Publish, and stops a second click', async () => {
    const fake = setUp();
    const id = await fake.services.projects.create(blankProject('form', 'org-1', 'Signup'));
    let publishes = 0;
    fake.services.publishing.publish = () => {
      publishes += 1;
      return never();
    };
    open(`/projects/${id}`, fake);
    fireEvent.click((await screen.findAllByRole('button', { name: 'Publish' }))[0]);
    const submit = await screen.findAllByRole('button', { name: 'Publish', hidden: true });
    const inDialog = submit.find((button) => button.closest('dialog'))!;
    fireEvent.submit(inDialog.closest('form')!);

    const busy = await screen.findByRole('button', { name: 'Publishing...', hidden: true });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    expect(busy.querySelector('.animate-spin')).toBeTruthy();
    fireEvent.submit(busy.closest('form')!);
    expect(publishes).toBe(1);
  });

  it('shows a spinner while logging in', async () => {
    const fake = createFakeServices();
    fake.services.auth.signIn = () => never();
    open('/login', fake);
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    const busy = await screen.findByRole('button', { name: 'Please wait...' });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    expect(busy.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows a spinner while creating from a template', async () => {
    const fake = setUp();
    fake.services.projects.create = () => never();
    open('/new/form-contact', fake);
    fireEvent.click(await screen.findByRole('button', { name: 'Create form' }));
    const busy = await screen.findByRole('button', { name: 'Creating...' });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    expect(busy.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows a spinner on the row being deleted, not every row', async () => {
    const fake = setUp();
    await fake.services.projects.create(blankProject('form', 'org-1', 'First'));
    await fake.services.projects.create(blankProject('form', 'org-1', 'Second'));
    fake.services.projects.remove = () => never();
    window.confirm = () => true;
    open('/forms', fake);
    const first = await screen.findByRole('button', { name: 'Delete First' });
    fireEvent.click(first);
    await waitFor(() => expect(first.querySelector('.animate-spin')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Delete Second' }).querySelector('.animate-spin')).toBeNull();
  });
});
