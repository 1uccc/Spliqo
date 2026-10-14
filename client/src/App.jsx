import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import MainLayout from './layouts/MainLayout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MyTripsPage from './pages/MyTripsPage';
import TripDetailPage from './pages/TripDetailPage';
import ProfilePage from './pages/ProfilePage';
import FriendsPage from './pages/FriendsPage';
import SettlementsPage from './pages/SettlementsPage';
import JoinTripPage from './pages/JoinTripPage';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
                <AppRoutes />
              </NotificationProvider>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
