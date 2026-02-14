import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/common/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Trackers } from './pages/Trackers';
import { TrackerDetail } from './pages/TrackerDetail';
import { CreateTracker } from './pages/CreateTracker';
import { AddLead } from './pages/AddLead';
import { EditLead } from './pages/EditLead';
import { Analytics } from './pages/Analytics';
import { TeamDashboard } from './pages/TeamDashboard';
import { TrackerSettings } from './pages/TrackerSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/trackers" element={<Trackers />} />
            <Route path="/trackers/new" element={<CreateTracker />} />
            <Route path="/trackers/:id" element={<TrackerDetail />} />
            <Route path="/trackers/:id/team" element={<TeamDashboard />} />
            <Route path="/trackers/:id/settings" element={<TrackerSettings />} />
            <Route path="/trackers/:id/leads/new" element={<AddLead />} />
            <Route path="/trackers/:id/leads/:leadId/edit" element={<EditLead />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
