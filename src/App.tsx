import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Layout from './components/Layout';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import PerformanceAnalytics from './components/analytics/PerformanceAnalytics';
import CallSimulator from './components/simulator/CallSimulator';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  const { setUser, logout } = useAuthStore();
  const [initializing, setInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        throw new Error('User data not found');
      }

      setUser({
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        created_at: userData.created_at
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      logout();
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          await fetchUserData(session.user.id);
        } else {
          logout();
        }
        setInitializing(false);
      } catch (err) {
        console.error('Auth initialization error:', err);
        logout();
        setInitializing(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        logout();
      }
      setInitializing(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initializing) {
      // Hide splash screen after a minimum display time
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [initializing]);

  if (initializing) {
    return (
      <SplashScreen />
    );
  }

  return (
    <>
      {showSplash && <SplashScreen />}
      <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>
        <ErrorBoundary>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="simulator" element={<CallSimulator />} />
                <Route path="analytics" element={<PerformanceAnalytics />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ErrorBoundary>
      </div>
    </>
  );
}

export default App;