"use client";

import Link from "next/link";
import { ArrowRight, Box, Zap } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-[hsl(var(--au-bg))] text-[hsl(var(--au-text-primary))] font-sans selection:bg-[hsl(var(--au-accent)_/_0.3)]">
      
      {/* Ultra Minimalist Header */}
      <header className="absolute top-0 w-full px-8 py-6 flex items-center justify-between z-50">
        <div className="font-semibold tracking-tight text-lg flex items-center gap-2">
          <div className="w-4 h-4 bg-[hsl(var(--au-accent))] rounded-sm shadow-[0_0_10px_hsl(var(--au-accent)_/_0.5)]" />
          Auralis
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-[hsl(var(--au-text-secondary))]">
          <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
        </div>
      </header>

      {/* Grid Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: `40px 40px`,
          maskImage: `linear-gradient(to bottom, white 10%, transparent 80%)`,
          WebkitMaskImage: `linear-gradient(to bottom, white 10%, transparent 80%)`
        }}
      />

      {/* Vercel/Linear Style Hero Section */}
      <section className="relative w-full flex-1 flex flex-col items-center justify-center pt-32 pb-24 px-6 z-10">
        <div className="max-w-[800px] mx-auto flex flex-col items-center text-center space-y-8">
          
          <motion.div
            initial={{ opacity: 0, y: -10, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[hsl(var(--au-text-secondary))] text-xs font-medium tracking-wide shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-[hsl(var(--au-accent))]" />
            <span>Introducing Auralis Engine v3.0</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[1.1]">
              Voice agents, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">
                engineered perfectly.
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="text-lg md:text-xl text-[hsl(var(--au-text-secondary))] max-w-2xl leading-relaxed tracking-tight"
          >
            The enterprise operating system for conversational AI. Zero-shot cloning, real-time RAG execution, and sub-100ms latency.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-6"
          >
            <Link
              href={user ? "/dashboard" : "/login"}
              className="group relative flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-medium text-sm rounded-lg hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              {user ? "Go to Dashboard" : "Start Building"}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            
            <Link
              href="/docs"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-all active:scale-95"
            >
              <Box className="w-4 h-4 text-[hsl(var(--au-text-secondary))]" />
              Read Documentation
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Product Teaser Image / Dashboard Mockup */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl px-6 pb-32 z-10"
      >
        <div className="w-full aspect-[16/9] rounded-2xl border border-white/10 bg-[hsl(var(--au-surface))] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden relative flex flex-col">
          {/* Mockup Header */}
          <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-white/[0.02]">
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
          </div>
          {/* Mockup Body */}
          <div className="flex-1 p-8 flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--au-accent)_/_0.05)] to-transparent" />
             <div className="text-center space-y-4 relative z-10">
               <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center shadow-lg">
                 <Box className="w-8 h-8 text-[hsl(var(--au-accent))]" />
               </div>
               <p className="text-sm font-medium text-[hsl(var(--au-text-secondary))]">Auralis Agent Studio</p>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-8 px-8 flex flex-col md:flex-row items-center justify-between text-xs text-[hsl(var(--au-text-secondary))] z-10 mt-auto bg-[hsl(var(--au-surface))]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[hsl(var(--au-accent))] rounded-sm" />
          <span className="font-medium text-white">Auralis Inc.</span>
          <span className="opacity-50">© 2026. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium">
          <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
          <span className="hover:text-white cursor-pointer transition-colors">GitHub</span>
          <span className="hover:text-white cursor-pointer transition-colors">Status</span>
        </div>
      </footer>
    </div>
  );
}
