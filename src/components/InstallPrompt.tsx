import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import appIcon from '../assets/logo.png';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
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
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-neutral-800 border border-neutral-700 rounded-2xl shadow-2xl p-4 z-50 flex items-center justify-between pointer-events-auto">
      <div className="flex items-center space-x-3">
        <img src={appIcon} alt="App Icon" className="w-12 h-12 rounded-xl" />
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
