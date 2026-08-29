import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { setAuthTokenGetter } from './lib/api';

// Route Lazy Loading to optimize bundle size
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const JDMatcherPage = lazy(() => import('./pages/JDMatcherPage').then(m => ({ default: m.JDMatcherPage })));
const DSACodePage = lazy(() => import('./pages/DSACodePage').then(m => ({ default: m.DSACodePage })));
const CareerPathPage = lazy(() => import('./pages/CareerPathPage').then(m => ({ default: m.CareerPathPage })));
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage').then(m => ({ default: m.ResumeBuilderPage })));
const OptimizerPage = lazy(() => import('./pages/OptimizerPage').then(m => ({ default: m.OptimizerPage })));
const InterroXPage = lazy(() => import('./pages/InterroXPage').then(m => ({ default: m.InterroXPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

const PageFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono text-xs text-[var(--text-muted)] space-y-3">
    <div className="w-5 h-5 border-2 border-[var(--text-main)] border-t-[var(--accent-color)] rounded-full animate-spin" />
    <span>$ loading module chunk...</span>
  </div>
);

const AppLayout: React.FC = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--bg-paper)] text-[var(--text-main)] transition-colors duration-200">
      <Navbar />
      <main className="flex-1 overflow-x-hidden min-h-screen">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Application Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/jd-match" element={<JDMatcherPage />} />
                <Route path="/dsa-code" element={<DSACodePage />} />
                <Route path="/career-path" element={<CareerPathPage />} />
                <Route path="/resume-builder" element={<ResumeBuilderPage />} />
                <Route path="/optimizer" element={<OptimizerPage />} />
                <Route path="/interrox" element={<InterroXPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;


