import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignUpPage } from './auth/AuthPages';
import { RedirectIfAuthenticated, RequireAuth } from './auth/RequireAuth';
import { HomePage } from './home/HomePage';

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

    <Route element={<RequireAuth />}>
      <Route index element={<HomePage />} />
      <Route path="*" element={<HomePage />} />
    </Route>
  </Routes>
);
