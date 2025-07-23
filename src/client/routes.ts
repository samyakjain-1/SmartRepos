import { lazy } from 'react';

export const routes = [
  {
    path: '/',
    Component: lazy(() => import('./pages/TrendingReposPage'))
  },
  {
    path: '/repo/:owner/:name',
    Component: lazy(() => import('./pages/RepoDetailPage'))
  },
  {
    path: '/search',
    Component: lazy(() => import('./pages/RepoSearchPage'))
  },
  {
    path: '/saved-repos',
    Component: lazy(() => import('./pages/SavedReposPage'))
  },
  {
    path: '/about',
    Component: lazy(() => import('./pages/HomePage'))
  },
  {
    path: '/auth/login',
    Component: lazy(() => import('./pages/LoginPage'))
  },
  {
    path: '/auth/signup',
    Component: lazy(() => import('./pages/SignupPage'))
  },
  {
    path: '/onboarding',
    Component: lazy(() => import('./pages/OnboardingPage'))
  },
];
