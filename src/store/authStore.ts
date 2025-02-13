import { create } from 'zustand';
import type { User, UserRole } from '../types';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => {
    set({ 
      user,
      isAuthenticated: !!user
    });
  },
  logout: () => set({ 
    user: null, 
    isAuthenticated: false 
  })
}));