import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

interface UseAuthReturn {
  loading: boolean;
  error: string;
  handleLogin: (email: string, password: string) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(async (email: string, password: string) => {
    setError('');
    setLoading(true);
    
    try {
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError || !session) {
        throw signInError || new Error('Authentication failed');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message === 'Invalid login credentials'
            ? 'Invalid email or password'
            : err.message
          : 'Failed to sign in'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, handleLogin };
}; 