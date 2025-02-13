import React from 'react';
import { Phone, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase, getPublicUrl } from '../lib/supabase';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-brand-navy text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-2 rounded-lg">
            <img 
              src={getPublicUrl('branding/shield-logo.png')}
              alt="Main Line Shield" 
              className="h-8 w-8"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-wide">MAIN LINE</span>
            <span className="text-xs text-brand-gold">INQUIRY TRAINING SUITE</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>{user?.firstName} {user?.lastName}</span>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-brand-navy/80 rounded-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;