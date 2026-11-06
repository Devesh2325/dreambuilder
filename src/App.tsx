import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { isAppHost } from './core/domains';

// Split so visitors to a published site don't download the builder.
const PublicSitePage = React.lazy(() => import('./app/public/PublicSitePage'));
const AppRoot = React.lazy(() => import('./app/AppRoot'));

// A visitor at a customer's own domain only ever sees that site.
const customDomain = typeof window !== 'undefined' && !isAppHost(window.location.hostname) ? window.location.hostname : null;

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {customDomain ? (
            <Route path="/*" element={<PublicSitePage domain={customDomain} />} />
          ) : (
            <>
              <Route path="/s/:slug/*" element={<PublicSitePage />} />
              <Route path="/*" element={<AppRoot />} />
            </>
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
