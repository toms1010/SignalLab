import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import App from '@/app/App';
import DashboardPage from '@/pages/DashboardPage';
import { EmptyState } from '@/components/ui/Controls';

/* Route-level code splitting: the lesson workspace carries every visualisation
   and is by far the heaviest surface, so it loads on demand. */
const ModulePage = lazy(() => import('@/pages/ModulePage'));
const LessonPage = lazy(() => import('@/pages/LessonPage'));
const ResourcesPage = lazy(() => import('@/pages/ResourcesPage'));
const MyResourcesPage = lazy(() => import('@/pages/MyResourcesPage'));
const PathsPage = lazy(() => import('@/pages/PathsPage'));
const ExercisesPage = lazy(() => import('@/pages/ExercisesPage'));
const FormulaReferencePage = lazy(() => import('@/pages/FormulaReferencePage'));
const GlossaryPage = lazy(() => import('@/pages/GlossaryPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function RouteFallback() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading page">
      <div className="glass h-40 animate-pulse" />
      <div className="glass h-64 animate-pulse" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="py-16">
      <EmptyState
        title="That route does not exist"
        hint="Use the sidebar to pick a module, or head back to the dashboard."
        action={
          <a href="/" className="sl-btn sl-btn-pri rounded-lg px-4 py-2 text-sm font-bold text-[var(--cyan)]">
            Back to dashboard
          </a>
        }
      />
    </div>
  );
}

const withSuspense = (node: React.ReactNode) => <Suspense fallback={<RouteFallback />}>{node}</Suspense>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'module/:moduleId', element: withSuspense(<ModulePage />) },
      { path: 'lesson/:lessonId', element: withSuspense(<LessonPage />) },
      { path: 'resources', element: withSuspense(<ResourcesPage />) },
      { path: 'my-resources', element: withSuspense(<MyResourcesPage />) },
      { path: 'paths', element: withSuspense(<PathsPage />) },
      { path: 'exercises', element: withSuspense(<ExercisesPage />) },
      { path: 'formulas', element: withSuspense(<FormulaReferencePage />) },
      { path: 'glossary', element: withSuspense(<GlossaryPage />) },
      { path: 'settings', element: withSuspense(<SettingsPage />) },
      { path: '404', element: <NotFound /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}