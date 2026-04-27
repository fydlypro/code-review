import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface StampAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

export default function StampAnimation({ show, onComplete }: StampAnimationProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-fydly-900/10 backdrop-blur-[2px] animate-fade-in" />
      
      <div className="relative flex flex-col items-center gap-6 animate-bounce-stamp">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-fydly-500 shadow-[0_8px_40px_rgba(33,150,243,0.5)] flex items-center justify-center p-2 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-black/10" />
          <div className="relative flex items-center justify-center w-full h-full border-4 border-white/20 rounded-full">
            <CheckCircle2 size={64} className="text-white sm:w-20 sm:h-20" />
          </div>
          
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-white opacity-40 blur-[1px]" />
          </div>
        </div>

        <div className="text-center space-y-2 bg-white/80 backdrop-blur-md px-8 py-4 rounded-3xl shadow-modal border border-white/50">
          <h2 className="font-display text-3xl text-fydly-900 leading-tight">
            Tampon ajouté !
          </h2>
          <p className="text-fydly-500 font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2">
            <Sparkles size={16} />
            BRAVO 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
