import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import MainLayout from './layouts/MainLayout';
import ServerWakeBanner from './components/common/ServerWakeBanner';

// Lazy load pages for efficient mobile code splitting
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MyTripsPage = lazy(() => import('./pages/MyTripsPage'));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const SettlementsPage = lazy(() => import('./pages/SettlementsPage'));
const JoinTripPage = lazy(() => import('./pages/JoinTripPage'));

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-9 h-9 border-3 border-zinc-200 dark:border-zinc-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin" />
      <span className="text-xs font-semibold text-zinc-400">Đang tải trang...</span>
    </div>
  );
}

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-[#121216]">
        <div className="w-9 h-9 border-3 border-zinc-200 dark:border-zinc-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/join/:code" element={<JoinTripPage />} />
        <Route path="/trips/join/:code" element={<JoinTripPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trips" element={<MyTripsPage />} />
          <Route path="trips/:tripId" element={<TripDetailPage />} />
          <Route path="settlements" element={<SettlementsPage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              <NotificationProvider>
                <ServerWakeBanner />
                <AppRoutes />
              </NotificationProvider>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
