'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Auralis UI Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 space-y-8 animate-in fade-in duration-700">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 text-red-500"
      >
        <ShieldAlert className="w-10 h-10" />
      </motion.div>

      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          System Interruption
        </h2>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          The voice intelligence engine encountered an unexpected rendering fault. 
          Please restart the interface sequence.
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium text-black bg-white rounded-full overflow-hidden transition-transform active:scale-95"
      >
        <span className="relative z-10 flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
          Reboot Interface
        </span>
        <div className="absolute inset-0 bg-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 p-6 rounded-2xl bg-neutral-900/50 border border-white/5 w-full max-w-2xl text-left overflow-auto">
          <p className="text-xs font-mono text-red-400/80 break-words">
            {error.message || 'Unknown error'}
          </p>
        </div>
      )}
    </div>
  );
}
