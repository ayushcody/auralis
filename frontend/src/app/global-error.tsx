'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auralis Global Error Boundary caught a catastrophic failure:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#111827] text-[#FAFAFA] min-h-screen flex items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center justify-center p-8 space-y-6 max-w-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Critical System Failure</h1>
          <p className="text-[#F5F5F4]/60 text-sm md:text-base leading-relaxed">
            The Auralis platform encountered a fatal error at the root level.
            This is usually caused by a network disconnect or an invalid Turbopack HMR payload.
          </p>
          <button
            onClick={() => reset()}
            className="mt-4 px-6 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors"
          >
            Attempt System Recovery
          </button>
        </div>
      </body>
    </html>
  );
}
