import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { StoreProvider } from './components/store';
import { Toaster } from './components/ui/sonner';

export default function App() {
  useEffect(() => {
    document.title = 'Presto';
  }, []);

  return (
    <StoreProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </StoreProvider>
  );
}
