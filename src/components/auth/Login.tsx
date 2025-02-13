import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from './hooks/useAuth';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

const Login = () => {
  const { loading, error, handleLogin } = useAuth();
  const [showSignUp, setShowSignUp] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const toggleSignUp = useCallback(() => {
    setShowSignUp(prev => !prev);
  }, []);

  const onSubmit = useCallback(async ({ email, password }) => {
    await handleLogin(email, password);
  }, [handleLogin]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {showSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {showSignUp ? (
            <>
              <SignUpForm onSuccess={() => setShowSignUp(false)} />
              <div className="mt-6">
                <button
                  onClick={toggleSignUp}
                  className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </>
          ) : (
            <>
              <LoginForm
                onSubmit={onSubmit}
                loading={loading}
                error={error}
              />
              <div className="mt-6">
                <button
                  onClick={toggleSignUp}
                  className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Need an account? Sign up
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Login);