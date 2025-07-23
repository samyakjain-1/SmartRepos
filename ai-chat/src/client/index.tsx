import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderApp } from 'modelence/client';
import { lazy, Suspense } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import LoadingSpinner from './components/LoadingSpinner';
import { AuthenticatedGuard, UnauthenticatedGuard } from './guards';
// @ts-ignore
import favicon from './assets/favicon.svg';
import './index.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <UnauthenticatedGuard />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'chat/:chatId',
        element: <ChatPage />
      },
      {
        path: 'profile',
        element: <ProfilePage />
      }
    ]
  },
  {
    path: '/auth',
    element: <AuthenticatedGuard />,
    children: [
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'signup',
        element: <SignupPage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  );
}

renderApp({
  routesElement: <App />,
  errorHandler: (error: Error) => {
    toast.error(error.message);
  },
  loadingElement: <LoadingSpinner fullScreen />,
  favicon
});
