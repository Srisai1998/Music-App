import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { useAppSelector } from './hooks/useRedux';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import SongsPage from './pages/SongsPage';
import ArtistsPage from './pages/ArtistsPage';
import AlbumsPage from './pages/AlbumsPage';
import UsersPage from './pages/UsersPage';
import AdsPage from './pages/AdsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import UploadSongPage from './pages/UploadSongPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30000 } } });

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="songs" element={<SongsPage />} />
        <Route path="songs/upload" element={<UploadSongPage />} />
        <Route path="artists" element={<ArtistsPage />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="ads" element={<AdsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
