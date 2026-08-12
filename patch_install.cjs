const fs = require('fs');

let code = fs.readFileSync('src/components/InstallPrompt.tsx', 'utf8');

// Replace appIcon import and add GraduationCap
code = code.replace(
  "import appIcon from '../assets/logo.jpg';",
  "import { GraduationCap } from 'lucide-react';"
);

// Replace iOS logic and useEffect
code = code.replace(
  /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/g,
  `useEffect(() => {
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
  }, []);`
);

// Fix handleInstall
code = code.replace(
  /const handleInstall = async \(\) => \{[\s\S]*?setShowPrompt\(false\);\s*\};/,
  `const handleInstall = async () => {
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
      alert("To install this app on your device:\\n\\n1. Tap the Share button in your browser toolbar.\\n2. Select 'Add to Home Screen'.");
      setShowPrompt(false);
    }
  };`
);

// Fix render
code = code.replace(
  `<img src={appIcon} alt="App Icon" className="w-12 h-12 rounded-xl" />`,
  `<div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg border border-blue-400/20 shrink-0">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>`
);

fs.writeFileSync('src/components/InstallPrompt.tsx', code);
