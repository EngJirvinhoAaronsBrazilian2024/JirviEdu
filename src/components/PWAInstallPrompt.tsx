import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Avoid showing the prompt repeatedly if dismissed in this session
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) {
      setHasDismissed(true);
      return;
    }

    if (!isInstalled && (isInstallable || isIOS)) {
      // Small delay to allow the app to render first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isInstallable, isInstalled, isIOS]);

  const handleInstall = async () => {
    if (isIOS) return; // iOS doesn't support programmatic install
    
    const accepted = await promptInstall();
    if (accepted) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setHasDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible || hasDismissed || isInstalled) {
    return null;
  }

  return (
    <div className="fixed z-[9999] bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 transition-all duration-300 transform translate-y-0 opacity-100">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        aria-label="Close installation prompt"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
          <img 
            src="/icon-192.png" 
            alt="JIRVI EDU App Icon" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 pr-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1">
            Install JIRVI EDU
          </h3>
          {isIOS ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
              Install this app on your device for faster access. Tap <span className="inline-block p-1 bg-gray-100 dark:bg-gray-800 rounded text-xs mx-0.5">Share</span> then <span className="inline-block p-1 bg-gray-100 dark:bg-gray-800 rounded text-xs mx-0.5">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
              Install this app on your device for faster access and a better experience.
            </p>
          )}
        </div>
      </div>

      {!isIOS && (
        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Not Now
          </button>
          <button 
            onClick={handleInstall}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
          >
            Install App
          </button>
        </div>
      )}
    </div>
  );
}
