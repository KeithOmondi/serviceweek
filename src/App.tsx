import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { refreshTokens } from './store/slices/authSlice';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import VerifyEmail from './components/auth/VerifyEmail';

// DR Pages
import DrLayout from './components/dr/DrLayout';
import DrDashboard from './pages/dr/DrDashboard';
import DrMatterEntry from './pages/dr/DrMatterEntry';
import AddServiceWeekEntry from './pages/dr/AddEntry';
import DrCreateCA from './pages/dr/DrCreatCA';

// CA Pages
import CLayout from './components/courtassitant/CLayout';
import CDashboard from './pages/courtassistant/CDashboard';
import CaAddServiceWeekEntry from './pages/courtassistant/CaAddServiceWeekEntry';
import CaEntries from './pages/courtassistant/CaEntries';

// Components
import ProtectedRoutes from './routes/ProtectedRoutes';

const Unauthorized = () => (
  <div className="flex h-screen items-center justify-center text-red-600 font-bold">
    403 - Unauthorized Access
  </div>
);

const App = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const hasToken = localStorage.getItem('accessToken');
      const hasUser = localStorage.getItem('user');

      // Only attempt refresh if there is evidence of a previous session
      if (hasToken || hasUser) {
        await dispatch(refreshTokens());
      }
      
      setIsCheckingAuth(false);
    };

    initializeAuth();
  }, [dispatch]);

  const getHomePath = () => {
    if (user?.role === 'dr') return '/dr/dashboard';
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'court_assistant') return '/c/dashboard';
    return '/login';
  };

  // Show loading spinner while checking for existing session
  if (isCheckingAuth || (loading && !isAuthenticated)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-sm text-slate-500 font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to={getHomePath()} replace />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <RegisterPage /> : <Navigate to={getHomePath()} replace />}
        />

        {/* DR Routes */}
        <Route element={<ProtectedRoutes allowedRoles={['dr']} />}>
          <Route element={<DrLayout />}>
            <Route path="/dr/dashboard" element={<DrDashboard />} />
            <Route path="/dr/matters" element={<DrMatterEntry />} />
            <Route path="/dr/matters/add" element={<AddServiceWeekEntry />} />
            <Route path="/dr/court-assistant" element={<DrCreateCA />} />
          </Route>
        </Route>

        {/* CA Routes */}
        <Route element={<ProtectedRoutes allowedRoles={['court_assistant']} />}>
          <Route element={<CLayout />}>
            <Route path="/c/dashboard" element={<CDashboard />} />
            <Route path="/c/entries" element={<CaAddServiceWeekEntry />} />
            <Route path="/c/all-entries" element={<CaEntries />} />
          </Route>
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? getHomePath() : '/login'} replace />}
        />
        <Route path="*" element={<div className="p-8 text-center">404 - Not Found</div>} />
      </Routes>
    </Router>
  );
};

export default App;