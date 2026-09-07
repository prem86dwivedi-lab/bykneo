import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const InstallPwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed it previously in this session
      const dismissed = sessionStorage.getItem('bykneo_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('🎉 Bykneo PWA was installed successfully!');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('bykneo_pwa_dismissed', 'true');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed top-3 left-3 right-3 z-50 max-w-sm mx-auto bg-gray-900/95 backdrop-blur-2xl border border-brand-yellow/60 p-3 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-300 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-brand-yellow text-gray-950 flex items-center justify-center font-black shrink-0 shadow-md">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-black text-white">Install Bykneo App</div>
          <div className="text-[10px] text-gray-400">Fast 1-tap booking & live GPS tracking</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg active:scale-95 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
