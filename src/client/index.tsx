import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderApp } from 'modelence/client';
import { toast } from 'react-hot-toast';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { routes } from './routes';
// @ts-ignore
import favicon from './assets/favicon.svg';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

renderApp({
  routesElement: (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <React.Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {routes.map((route) => (
              <Route key={route.path} path={route.path} element={<route.Component />} />
            ))}
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  ),
  errorHandler: (error) => {
    toast.error(error.message);
  },
  loadingElement: <div>Loading...</div>,
  favicon
});

