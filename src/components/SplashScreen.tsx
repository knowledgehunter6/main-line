import React, { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { getPublicUrl } from '../lib/supabase';

const SplashScreen: React.FC = () => {
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Stagger the animations
    const logoTimer = setTimeout(() => setShowLogo(true), 100);
    const textTimer = setTimeout(() => setShowText(true), 600);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-brand-navy flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-32 h-32 mx-auto bg-white rounded-3xl flex items-center justify-center" 
        >
          <div 
          className={`transform transition-all duration-700 ease-out ${
            showLogo ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
          >
          <img 
            src={getPublicUrl('branding/shield-logo.png')}
            alt="Main Line Shield" 
            className="w-24 h-24"
          />
          </div>
        </div>
        
        <div 
          className={`mt-6 transition-all duration-700 ease-out ${
            showText ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
          }`}
        >
          <h1 className="text-3xl font-bold text-white tracking-wide">MAIN LINE</h1>
          <p className="mt-2 text-brand-gold uppercase tracking-wider text-sm">Inquiry Training Suite</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;