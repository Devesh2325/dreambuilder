import React, { Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { MODULE_LIST } from '../core/modules';
import { StudioPage } from '../studio/StudioPage';
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignUpPage } from './auth/AuthPages';
import { FullPageSpinner, RedirectIfAuthenticated, RequireAuth } from './auth/RequireAuth';
import { DashboardPage } from './dashboard/DashboardPage';
import { ProjectPage } from './projects/ProjectPage';
import { ProjectsPage } from './projects/ProjectsPage';
import { Shell } from './shell/Shell';
import { CreatePage } from './templates/CreatePage';
import { TemplatesPage } from './templates/TemplatesPage';
import { WizardPage } from './templates/WizardPage';
import { WorkspaceProvider } from './workspace';
import { AcceptInvitePage, AnalyticsPage, AssetsPage, BrandPage, SettingsPage, TeamPage } from './workspace/WorkspacePages';

// Loaded on demand: the Markdown renderer is only needed here.
const DocsPage = React.lazy(() => import('../docs/DocsPage'));

const WorkspaceLayout: React.FC = () => (
  <WorkspaceProvider>
    <Outlet />
  </WorkspaceProvider>
);

const docsElement = (
  <Suspense fallback={<FullPageSpinner />}>
    <DocsPage />
  </Suspense>
);

/** Routes of the new app, relative to where it is mounted. */
export const AppRoutes: React.FC = () => (
  <Routes>
    <Route element={<RedirectIfAuthenticated />}>
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignUpPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
    </Route>

    {/* Must stay reachable while logged in: the email link creates a session. */}
    <Route path="reset-password" element={<ResetPasswordPage />} />

    <Route path="docs" element={docsElement} />
    <Route path="docs/:slug" element={docsElement} />

    <Route element={<RequireAuth />}>
      <Route element={<WorkspaceLayout />}>
        <Route path="create" element={<CreatePage />} />
        <Route path="new/:templateId" element={<WizardPage />} />
        <Route path="studio/:projectId" element={<StudioPage />} />
        <Route path="invite/:token" element={<AcceptInvitePage />} />
        <Route element={<Shell />}>
          <Route index element={<DashboardPage />} />
          {MODULE_LIST.map((module) => (
            <Route key={module.type} path={module.path.slice(1)} element={<ProjectsPage key={module.type} type={module.type} />} />
          ))}
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="projects/:projectId" element={<ProjectPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="brand" element={<BrandPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<DashboardPage />} />
        </Route>
      </Route>
    </Route>
  </Routes>
);
