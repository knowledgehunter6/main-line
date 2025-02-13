import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Phone, Settings, Users, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getPublicUrl } from '../lib/supabase';

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="mt-5 px-2">
        <div className="px-4 mb-8">
          <div className="w-20 h-20 mx-auto bg-brand-navy rounded-2xl flex items-center justify-center">
            <img 
              src={getPublicUrl('branding/shield-logo.png')}
              alt="Main Line Shield" 
              className="w-16 h-16 p-2"
            />
          </div>
        </div>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              isActive
                ? 'bg-brand-navy text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <LayoutDashboard className="mr-3 h-5 w-5" />
          Dashboard
        </NavLink>

        <NavLink
          to="/simulator"
          className={({ isActive }) =>
            `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              isActive
                ? 'bg-brand-navy text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <Phone className="mr-3 h-5 w-5" />
          Call Simulator
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              isActive
                ? 'bg-brand-navy text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <TrendingUp className="mr-3 h-5 w-5" />
          Analytics
        </NavLink>

        {isAdmin && (
          <>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Users className="mr-3 h-5 w-5" />
              Users
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;