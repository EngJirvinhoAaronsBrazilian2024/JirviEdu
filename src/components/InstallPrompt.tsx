import React, { useEffect, useState } from 'react';
import { X, GraduationCap } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         ('standalone' in window.navigator && (window.navigator as any).standalone);

    if (isStandalone) return;

    // Check if prompt was dismissed recently (e.g., within 7 days)
    const dismissedTime = localStorage.getItem('pwa_prompt_dismissed_v3');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Check if the event was already captured by index.html before React mounted
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
      setShowPrompt(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent automatic prompting
      (window as any).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hide prompt immediately if installed
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    // Check for iOS to gracefully show alternative instructions
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    if (isAppleMobile && !isStandalone) {
      setIsIos(true);
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed_v3', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed z-[9999] bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:-translate-x-0 md:right-6 md:bottom-6 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-2.5 pr-2 flex items-center gap-3 w-max max-w-[92vw]">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm ml-1">
        <GraduationCap className="w-6 h-6 text-white" />
      </div>
      
      <div className="flex flex-col justify-center mr-2">
        {isIos && !deferredPrompt ? (
           <span className="text-sm font-medium text-[var(--text-main)] pr-2 leading-tight">
             Tap <b>Share</b><br/>then <b>Add to Home Screen</b>
           </span>
        ) : (
           <>
             <span className="text-sm font-bold text-[var(--text-main)] leading-tight">JIRVI EDU</span>
             <span className="text-xs text-muted font-medium">Install App</span>
           </>
        )}
      </div>
      
      <div className="flex items-center gap-1.5 ml-auto pl-2 border-l border-[var(--border-subtle)]">
        {!isIos && deferredPrompt && (
          <button 
            onClick={handleInstall}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            Install
          </button>
        )}
        <button 
          onClick={handleDismiss}
          className="p-2 text-muted hover:text-[var(--text-main)] rounded-xl hover:bg-[var(--bg-app)] transition-colors shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
