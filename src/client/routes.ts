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
];
