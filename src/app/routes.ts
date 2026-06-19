import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      {
        path: 'directory',
        lazy: async () => ({ Component: (await import('./pages/DirectoryPage')).default }),
      },
      {
        path: 'map',
        lazy: async () => ({ Component: (await import('./pages/MapPage')).default }),
      },
      {
        path: 'entity/:slug',
        lazy: async () => ({ Component: (await import('./pages/EntityDetailPage')).default }),
      },
      {
        path: 'events',
        lazy: async () => ({ Component: (await import('./pages/EventsPage')).default }),
      },
      {
        path: 'jobs',
        lazy: async () => ({ Component: (await import('./pages/JobsPage')).default }),
      },
      {
        path: 'submit',
        lazy: async () => ({ Component: (await import('./pages/SubmitPage')).default }),
      },
      {
        path: 'auth',
        lazy: async () => ({ Component: (await import('./pages/AuthPage')).default }),
      },
      {
        path: 'profile',
        lazy: async () => ({ Component: (await import('./pages/ProfilePage')).default }),
      },
      {
        path: 'claim/:entityId',
        lazy: async () => ({ Component: (await import('./pages/ClaimPage')).default }),
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
