import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import MainLayout from './layouts/MainLayout';
import ServerWakeBanner from './components/common/ServerWakeBanner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load pages for efficient mobile code splitting
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MyTripsPage = lazy(() => import('./pages/MyTripsPage'));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const SettlementsPage = lazy(() => import('./pages/SettlementsPage'));
const JoinTripPage = lazy(() => import('./pages/JoinTripPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

function PageFallback() {
  const { t } = useLanguage();
  return (
    <div role="status" aria-live="polite" className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-9 h-9 border-3 border-zinc-200 dark:border-zinc-800 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin" />
      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t('loadingPage', 'Đang tải trang...')}</span>
    </div>
  );
}

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div role="status" aria-label="Loading" className="min-h-screen flex items-center justify-center bg-[#f4f3ec] dark:bg-[#0f0f12]">
        <div className="w-9 h-9 border-3 border-zinc-200 dark:border-zinc-800 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin" />
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
          <Route path="about" element={<AboutPage />} />
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
              <ConfirmProvider>
                <NotificationProvider>
                  <ServerWakeBanner />
                  <ErrorBoundary>
                    <AppRoutes />
                  </ErrorBoundary>
                </NotificationProvider>
              </ConfirmProvider>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
