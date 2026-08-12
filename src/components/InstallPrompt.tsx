import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { GraduationCap } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt for iOS if not dismissed, as it doesn't support beforeinstallprompt
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    const isStandalone = () => {
      return ('standalone' in window.navigator) && (window.navigator as any).standalone;
    };

    if (isIos() && !isStandalone() && !sessionStorage.getItem('pwa_prompt_dismissed')) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem('pwa_prompt_dismissed')) {
        setShowPrompt(true);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Fallback for iOS or environments without deferredPrompt
      alert("To install this app on your device:\n\n1. Tap the Share button in your browser toolbar.\n2. Select 'Add to Home Screen'.");
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-neutral-800 border border-neutral-700 rounded-2xl shadow-2xl p-4 z-50 flex items-center justify-between pointer-events-auto">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg border border-blue-400/20 shrink-0">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="text-neutral-50 font-medium">Install Jirvi EDU</h3>
          <p className="text-neutral-400 text-xs">Add to your home screen.</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={handleDismiss} className="text-neutral-400 hover:text-neutral-50 p-2 text-lg font-bold">✕</button>
        <button onClick={handleInstall} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md font-bold text-sm transition-colors">
          <Download className="w-4 h-4 mr-2" /> Install
        </button>
      </div>
    </div>
  );
}
