import React, { useEffect, useState } from 'react';
import { Download, GraduationCap, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isUnsupported, setIsUnsupported] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             ('standalone' in window.navigator && (window.navigator as any).standalone);
    };

    if (isStandalone()) {
      return;
    }

    // Check if prompt was dismissed recently (e.g., within 7 days)
    const checkDismissed = () => {
      const dismissedStr = localStorage.getItem('pwa_prompt_dismissed');
      if (dismissedStr) {
        const dismissedTime = parseInt(dismissedStr, 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedTime < sevenDays) {
          return true; // Still within dismissed period
        } else {
          localStorage.removeItem('pwa_prompt_dismissed');
          return false;
        }
      }
      return false;
    };

    if (checkDismissed()) {
      return;
    }

    const checkIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    let promptTriggered = false;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      promptTriggered = true;
      
      // Delay showing the prompt
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback timer for iOS or unsupported
    const fallbackTimer = setTimeout(() => {
      if (!promptTriggered && !isStandalone() && !checkDismissed()) {
        if (checkIos()) {
          setIsIos(true);
          setShowPrompt(true);
        } else {
          // It might be an unsupported browser (like Firefox or an incognito tab)
          // We can show a generic instruction or just not show it.
          // Let's show generic instructions for others as requested.
          setIsUnsupported(true);
          // Only show unsupported on mobile sizes or if explicitly needed, but let's just show it.
          setShowPrompt(true);
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowPrompt(false);
      } else {
        console.log('User dismissed the install prompt');
        handleDismiss();
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div 
      className="fixed bottom-4 md:bottom-auto md:top-4 left-1/2 transform -translate-x-1/2 w-[92%] max-w-sm bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-5 z-[9999] pointer-events-auto flex flex-col gap-4"
      role="dialog"
      aria-labelledby="install-title"
      aria-describedby="install-desc"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg border border-blue-400/20 shrink-0">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 id="install-title" className="text-[var(--text-main)] font-bold text-lg leading-tight">Install Our App</h3>
            <p id="install-desc" className="text-muted text-sm mt-0.5">Install this app on your device for faster access and a better experience.</p>
          </div>
        </div>
        <button 
          onClick={handleDismiss} 
          className="text-muted hover:text-[var(--text-main)] transition-colors p-1 -mr-2 -mt-2 rounded-full hover:bg-[var(--bg-app)]"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isIos ? (
        <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-subtle)]">
          <p className="text-sm font-medium text-[var(--text-main)] text-center">
            To install this app, tap <span className="font-bold">Share</span> and select <span className="font-bold">Add to Home Screen</span>.
          </p>
          <button onClick={handleDismiss} className="w-full mt-3 py-2 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-lg text-sm font-bold text-[var(--text-main)] hover:bg-[var(--bg-app)]">
            Got it
          </button>
        </div>
      ) : isUnsupported && !deferredPrompt ? (
        <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-subtle)]">
          <p className="text-sm font-medium text-[var(--text-main)] text-center">
            To install this app, look for the <span className="font-bold">Install</span> or <span className="font-bold">Add to Home Screen</span> option in your browser menu.
          </p>
          <button onClick={handleDismiss} className="w-full mt-3 py-2 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-lg text-sm font-bold text-[var(--text-main)] hover:bg-[var(--bg-app)]">
            Got it
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-3 pt-1">
          <button 
            onClick={handleDismiss} 
            className="flex-1 py-2.5 bg-[var(--bg-app)] hover:bg-[var(--border-subtle)] border border-[var(--border-strong)] text-[var(--text-main)] rounded-xl font-bold text-sm transition-colors"
          >
            Not Now
          </button>
          <button 
            onClick={handleInstall} 
            className="flex-1 flex items-center justify-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold text-sm transition-colors"
          >
            <Download className="w-4 h-4 mr-2" /> Install App
          </button>
        </div>
      )}
    </div>
  );
}
