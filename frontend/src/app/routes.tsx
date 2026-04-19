import { createBrowserRouter, Navigate } from 'react-router';
import { Landing } from './components/landing';
import { Login } from './components/login';
import { Register } from './components/register';
import { Dashboard } from './components/dashboard';
import { Editor } from './components/editor';
import { Preview } from './components/preview';

export const router = createBrowserRouter([
  { path: '/', Component: Landing },
  { path: '/login', Component: Login },
  { path: '/register', Component: Register },
  { path: '/dashboard', Component: Dashboard },
  { path: '/presentation/:id/slide/:slideNumber', Component: Editor },
  { path: '/presentation/:id', element: <Navigate to="slide/1" replace /> },
  { path: '/preview/:id/slide/:slideNumber', Component: Preview },
  { path: '/preview/:id', element: <Navigate to="slide/1" replace /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
