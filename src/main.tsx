import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { router } from './app/routes';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors />
    </HelmetProvider>
  </StrictMode>
);
