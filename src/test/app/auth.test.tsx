import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../../app/theme';
import { AppProviders } from '../../app/AppProviders';
import { AppRoutes } from '../../app/AppRoutes';
import { createFakeServices, TEST_USER } from './fakeServices';

const LocationProbe = () => <div data-testid="path">{useLocation().pathname}</div>;

function renderApp(path: string, fake = createFakeServices()) {
  render(
    <ThemeProvider><MemoryRouter initialEntries={[path]}>
      <AppProviders services={fake.services}>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
        <LocationProbe />
      </AppProviders>
    </MemoryRouter></ThemeProvider>,
  );
  return fake;
}

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

const fillLogin = (password = 'secret-password') => {
  fill('Email', 'alice@example.com');
  fill('Password', password);
  click('Log in');
};

describe('authentication', () => {
  afterEach(cleanup);

  describe('route guard', () => {
    it('sends logged-out visitors to the login page', async () => {
      renderApp('/');
      expect(await screen.findByRole('heading', { name: 'Log in' })).toBeTruthy();
      expect(screen.getByTestId('path').textContent).toBe('/login');
    });

    it('shows the protected page to logged-in users', async () => {
      renderApp('/', createFakeServices({ user: TEST_USER }));
      expect(await screen.findByRole('heading', { name: 'Welcome, Alice' })).toBeTruthy();
    });

    it('never shows protected content before the session check finishes', () => {
      renderApp('/', createFakeServices({ user: TEST_USER }));
      expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
      expect(screen.queryByRole('heading', { name: 'Log in' })).toBeNull();
    });

    it('moves logged-in users away from the login page', async () => {
      renderApp('/login', createFakeServices({ user: TEST_USER }));
      await screen.findByRole('heading', { name: 'Welcome, Alice' });
      expect(screen.getByTestId('path').textContent).toBe('/');
    });
  });

  describe('login', () => {
    it('returns the user to the page they originally asked for', async () => {
      const fake = renderApp('/settings');
      await screen.findByRole('heading', { name: 'Log in' });
      fillLogin();

      await screen.findByRole('heading', { name: 'Settings' });
      expect(fake.calls.signIn).toEqual([{ email: 'alice@example.com', password: 'secret-password' }]);
      expect(screen.getByTestId('path').textContent).toBe('/settings');
    });

    it('shows the error and stays on the page when login fails', async () => {
      renderApp('/login', createFakeServices({ signInError: 'Invalid login credentials' }));
      await screen.findByRole('heading', { name: 'Log in' });
      fillLogin('wrong');

      expect((await screen.findByRole('alert')).textContent).toBe('Invalid login credentials');
      expect(screen.getByTestId('path').textContent).toBe('/login');
    });

    it('validates before calling the server', async () => {
      const fake = renderApp('/login');
      await screen.findByRole('heading', { name: 'Log in' });
      fill('Email', 'not-an-email');
      click('Log in');

      expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
      expect(screen.getByText('Enter your password')).toBeTruthy();
      expect(fake.calls.signIn).toEqual([]);
    });
  });

  describe('signup', () => {
    const fillSignUp = (password = 'long-enough-password') => {
      fill('Your name', ' Alice ');
      fill('Workspace name', 'Alice Co');
      fill('Email', 'alice@example.com');
      fill('Password', password);
      click('Create account');
    };

    it('logs the user in straight away when no confirmation is needed', async () => {
      const fake = renderApp('/signup');
      await screen.findByRole('heading', { name: 'Create your account' });
      fillSignUp();

      await screen.findByRole('heading', { name: 'Welcome, Alice' });
      expect(fake.calls.signUp[0]).toEqual({
        fullName: 'Alice',
        workspaceName: 'Alice Co',
        email: 'alice@example.com',
        password: 'long-enough-password',
      });
    });

    it('asks the user to check their email when confirmation is required', async () => {
      renderApp('/signup', createFakeServices({ requireEmailConfirmation: true }));
      await screen.findByRole('heading', { name: 'Create your account' });
      fillSignUp();

      expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeTruthy();
      expect(screen.getByText('alice@example.com')).toBeTruthy();
    });

    it('rejects short passwords', async () => {
      const fake = renderApp('/signup');
      await screen.findByRole('heading', { name: 'Create your account' });
      fillSignUp('short');

      expect(await screen.findByText('Use at least 8 characters')).toBeTruthy();
      expect(fake.calls.signUp).toEqual([]);
    });
  });

  describe('logout', () => {
    it('returns to the login page', async () => {
      renderApp('/', createFakeServices({ user: TEST_USER }));
      await screen.findByRole('heading', { name: 'Welcome, Alice' });
      click('Log out');

      expect(await screen.findByRole('heading', { name: 'Log in' })).toBeTruthy();
    });
  });

  describe('password reset', () => {
    it('sends the link back to the reset page, without revealing if the account exists', async () => {
      const fake = renderApp('/forgot-password');
      await screen.findByRole('heading', { name: 'Reset your password' });
      fill('Email', 'alice@example.com');
      click('Send reset link');

      expect(await screen.findByText(/If an account exists/)).toBeTruthy();
      expect(fake.calls.sendPasswordReset[0].redirectTo).toMatch(/\/reset-password$/);
    });

    it('explains an expired link when there is no session', async () => {
      renderApp('/reset-password');
      expect(await screen.findByRole('heading', { name: "This link isn't valid" })).toBeTruthy();
    });

    it('saves the new password and continues into the app', async () => {
      const fake = renderApp('/reset-password', createFakeServices({ user: TEST_USER }));
      await screen.findByRole('heading', { name: 'Choose a new password' });
      fill('New password', 'brand-new-password');
      click('Save password');

      await screen.findByRole('heading', { name: 'Welcome, Alice' });
      expect(fake.calls.updatePassword).toEqual(['brand-new-password']);
    });
  });

  describe('workspace display', () => {
    it('shows the current workspace and role', async () => {
      renderApp(
        '/',
        createFakeServices({
          user: TEST_USER,
          memberships: [{ organizationId: 'o1', name: 'Alice Co', slug: 'alice-co', plan: 'free', role: 'owner', branding: {} }],
        }),
      );
      expect(await screen.findByText('Alice Co')).toBeTruthy();
          });
  });
});
