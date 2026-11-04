import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

// Split so visitors to a published site don't download the builder.
const PublicSitePage = React.lazy(() => import('./app/public/PublicSitePage'));
const AppRoot = React.lazy(() => import('./app/AppRoot'));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/s/:slug/*" element={<PublicSitePage />} />
          <Route path="/*" element={<AppRoot />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
