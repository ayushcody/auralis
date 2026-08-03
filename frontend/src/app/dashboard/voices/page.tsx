"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Mic2, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import { VoiceCard, Voice } from "@/components/voices/VoiceCard";
import { CloneVoiceModal } from "@/components/voices/CloneVoiceModal";
import { StorageToggle } from "@/components/StorageToggle";

export default function VoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchVoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const storageMode = localStorage.getItem('auralis_storage_mode') || 'cloud';
      const isLocal = storageMode === 'local';
      
      let accessToken = '';
      if (!isLocal) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        accessToken = session.access_token;
      }
      
      const headers: Record<string, string> = {
        'Storage-Mode': storageMode,
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch("http://localhost:8000/api/voices", {
        headers,
      });

      if (!response.ok) throw new Error("Failed to fetch voices");
      
      const data = await response.json();
      setVoices(data as Voice[]);
    } catch (error) {
      console.error("Error fetching voices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchVoices();
    window.addEventListener('storageModeChanged', fetchVoices);
    return () => window.removeEventListener('storageModeChanged', fetchVoices);
  }, [fetchVoices]);

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
      >
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70"
          >
            Voice Lab
          </h1>
          <p
            className="mt-2 text-[hsl(var(--au-text-secondary))] max-w-xl"
          >
            Manage your cloned voice profiles, generate speech, and experiment with audio synthesis.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <StorageToggle />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-[0_0_15px_hsl(var(--au-accent)_/_0.3)] hover:shadow-[0_0_25px_hsl(var(--au-accent)_/_0.5)] transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Clone a voice
          </button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-[hsl(var(--au-text-secondary))] animate-spin" />
        </div>
      ) : voices.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="surface-card p-12 flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--au-accent)_/_0.05)] to-transparent pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--au-bg))] border border-[hsl(var(--au-border))] shadow-[0_0_20px_hsl(var(--au-accent)_/_0.1)] flex items-center justify-center mb-6 z-10">
            <Mic2 className="w-8 h-8 text-[hsl(var(--au-text-secondary))]" />
          </div>
          <h3 className="text-xl font-semibold mb-2 z-10">No voices found</h3>
          <p className="text-[hsl(var(--au-text-secondary))] max-w-md mb-8 z-10">
            You haven&apos;t cloned any voices yet. Click the button above to upload a reference audio file and clone your first voice.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 z-10"
          >
            <Plus className="w-4 h-4" />
            Clone a voice
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {voices.map((voice) => (
            <motion.div 
              key={voice.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <VoiceCard voice={voice} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <CloneVoiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          fetchVoices();
        }}
      />
    </div>
  );
}
