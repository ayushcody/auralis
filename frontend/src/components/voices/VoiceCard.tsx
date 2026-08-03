"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, ShieldCheck, ShieldAlert, Play, Pause, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import WaveSurfer from "wavesurfer.js";

export interface Voice {
  id: string;
  display_name: string;
  language: string;
  engine: string;
  consent_id: string | null;
}

interface VoiceCardProps {
  voice: Voice;
}

export function VoiceCard({ voice }: VoiceCardProps) {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Generating...");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (audioUrl && waveformRef.current && !wavesurfer.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "hsl(var(--au-text-secondary) / 0.5)",
        progressColor: "hsl(var(--au-accent))",
        height: 48,
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        cursorColor: "transparent",
      });

      wavesurfer.current.load(audioUrl);

      wavesurfer.current.on("play", () => setIsPlaying(true));
      wavesurfer.current.on("pause", () => setIsPlaying(false));
      wavesurfer.current.on("finish", () => setIsPlaying(false));
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [audioUrl]);

  const getEngineBadge = (engine: string) => {
    if (engine.includes("qwen3")) return <span className="badge-qwen3">Qwen3-TTS</span>;
    if (engine.includes("kokoro")) return <span className="badge-kokoro">Kokoro-82M</span>;
    if (engine.includes("f5") || engine.includes("indic")) return <span className="badge-indicf5">IndicF5</span>;
    return <span className="badge-qwen3">{engine}</span>;
  };

  const getEngineName = (engine: string) => {
    if (engine.includes("qwen3")) return "Qwen3";
    if (engine.includes("kokoro")) return "Kokoro";
    if (engine.includes("f5") || engine.includes("indic")) return "IndicF5";
    return engine;
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    setLoadingMessage("Generating...");

    // Start a timer to show "Loading [engine] model..." if it takes > 2s
    loadingTimerRef.current = setTimeout(() => {
      setLoadingMessage(`Loading ${getEngineName(voice.engine)} model...`);
    }, 2000);

    try {
      const storageMode = localStorage.getItem('auralis_storage_mode') || 'cloud';
      const isLocal = storageMode === 'local';

      let accessToken = '';
      if (!isLocal) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn("No active session found. Falling back to demo token.");
          accessToken = "demo-token";
        } else {
          accessToken = session.access_token;
        }
      }

      const formData = new FormData();
      formData.append("text", text);
      formData.append("voice_id", voice.id);
      formData.append("language", voice.language);
      formData.append("mode", "premium");

      const headers: Record<string, string> = {
        'Storage-Mode': storageMode,
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch("http://localhost:8000/api/voices/generate", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      console.error("Generation error:", err);
      const e = err as Error;
      setError(e.message || "An error occurred");
    } finally {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  return (
    <div className="surface-card flex flex-col p-6 space-y-6 relative group overflow-hidden transition-all hover:bg-white/[0.02]">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--au-accent)_/_0.03)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      {/* Header section */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2 tracking-tight">
            <Mic className="w-4 h-4 text-[hsl(var(--au-text-secondary))]" />
            {voice.display_name}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="text-[hsl(var(--au-text-secondary))] capitalize">{voice.language}</span>
            {getEngineBadge(voice.engine)}
          </div>
        </div>
        
        {/* Consent Badge */}
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
          voice.consent_id 
            ? "border-[hsl(var(--au-success))/30] text-[hsl(var(--au-success))] bg-[hsl(var(--au-success))/10]"
            : "border-yellow-500/30 text-yellow-500 bg-yellow-500/10"
        }`}>
          {voice.consent_id ? (
            <><ShieldCheck className="w-3.5 h-3.5" /> Consent verified</>
          ) : (
            <><ShieldAlert className="w-3.5 h-3.5" /> No consent on file</>
          )}
        </div>
      </div>

      {/* Generator Section */}
      <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
        <label className="block text-xs font-medium text-[hsl(var(--au-text-secondary))]">
          Generate Speech
        </label>
        
        {error && (
          <div className="p-2.5 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
            {error}
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Type something for ${voice.display_name} to say...`}
          className="w-full h-24 bg-[hsl(var(--au-bg))] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] focus:ring-1 focus:ring-[hsl(var(--au-accent))] transition-all resize-none shadow-sm"
        />
        
        <div className="flex justify-end">
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || !text.trim()}
            className="btn-primary flex items-center gap-2 text-xs py-1.5 px-4 shadow-sm"
          >
            {isGenerating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {loadingMessage}</>
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </div>

      {/* Audio Result */}
      {audioUrl && (
        <div className="p-4 bg-[hsl(var(--au-bg))] rounded-xl border border-white/5 flex items-center gap-4 relative z-10 shadow-sm">
          <button
            onClick={togglePlayback}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-black hover:bg-white/90 shadow-sm transition-all shrink-0 active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
          </button>
          
          <div className="flex-1 overflow-hidden" ref={waveformRef}></div>
        </div>
      )}
    </div>
  );
}
