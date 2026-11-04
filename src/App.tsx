import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './services/authContext';
import { AppLayout } from './components/shell/AppLayout';

// Pages
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/dashboard/Dashboard';
import { ProjectsList } from './pages/projects/ProjectsList';
import { EditorPage } from './pages/editor/EditorPage';
import { LivePreviewPage } from './pages/preview/LivePreviewPage';

// Module Pages
import { ToursPage } from './pages/modules/ToursPage';
import { DemosPage } from './pages/modules/DemosPage';
import { PagesPage } from './pages/modules/PagesPage';
import { BannersPage } from './pages/modules/BannersPage';
import { MenusPage } from './pages/modules/MenusPage';
import { FAQsPage } from './pages/modules/FAQsPage';
import { PopupsPage } from './pages/modules/PopupsPage';
import { ChecklistsPage } from './pages/modules/ChecklistsPage';
import { SurveysPage } from './pages/modules/SurveysPage';

// Management Pages
import { TemplatesPage } from './pages/templates/TemplatesPage';
import { AssetsPage } from './pages/assets/AssetsPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { DomainsPage } from './pages/domains/DomainsPage';
import { TeamPage } from './pages/team/TeamPage';
import { IntegrationsPage } from './pages/integrations/IntegrationsPage';
import { BillingPage } from './pages/billing/BillingPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { BrandPage } from './pages/brand/BrandPage';
import { ThemeProvider } from './services/themeContext';

// The rebuilt app, loaded separately so the old app doesn't pay for it.
const NewApp = React.lazy(() => import('./app/AppRoot'));

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
        <Routes>
          <Route
            path="/v2/*"
            element={
              <React.Suspense fallback={null}>
                <NewApp />
              </React.Suspense>
            }
          />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Standalone Visual Editor Route */}
          <Route path="/editor/:documentId" element={<EditorPage />} />
          <Route path="/editor" element={<EditorPage />} />

          {/* Standalone Public Live Preview Route */}
          <Route path="/preview/:documentId" element={<LivePreviewPage />} />

          {/* Main Workspace Protected Shell Routes */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/:projectId" element={<ProjectsList />} />

            {/* Specialized Modules */}
            <Route path="tours" element={<ToursPage />} />
            <Route path="demos" element={<DemosPage />} />
            <Route path="pages" element={<PagesPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="menus" element={<MenusPage />} />
            <Route path="faqs" element={<FAQsPage />} />
            <Route path="popups" element={<PopupsPage />} />
            <Route path="checklists" element={<ChecklistsPage />} />
            <Route path="surveys" element={<SurveysPage />} />

            {/* Library & Tools */}
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="domains" element={<DomainsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="brand" element={<BrandPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
