"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Send, Loader2, Bot, User, Zap, Play } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface Agent {
  id: string;
  name: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  latencyMs?: number;
  audioUrl?: string;
}

export default function PlaygroundPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAgents = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: projData } = await supabase
        .from("projects")
        .select("id")
        .eq("owner_user_id", session.user.id)
        .limit(1);

      if (projData && projData.length > 0) {
        const { data: agentsData } = await supabase
          .from("agents")
          .select("id, name")
          .eq("project_id", projData[0].id);
        
        if (agentsData) {
          setAgents(agentsData);
          if (agentsData.length > 0) {
            setSelectedAgentId(agentsData[0].id);
          }
        }
      }
    };
    fetchAgents();
  }, [supabase]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startRecording = async () => {
    if (!selectedAgentId) return alert("Please select an agent first.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleRecordingStop;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    
    // Stop tracks
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }

    await submitTurn(audioBlob);
  };

  const submitTurn = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");
      if (conversationId) {
        formData.append("conversation_id", conversationId);
      }

      const res = await fetch(`http://localhost:8000/api/conversations/${selectedAgentId}/turn`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Turn failed");

      const data = await res.json();
      
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      setMessages(prev => [
        ...prev,
        { id: Math.random().toString(), role: "user", text: data.user_text },
        { 
          id: Math.random().toString(), 
          role: "agent", 
          text: data.agent_text, 
          latencyMs: data.latency_ms,
          audioUrl: data.agent_audio_url
        }
      ]);

      // Play audio automatically
      if (data.agent_audio_url && audioPlayerRef.current) {
        audioPlayerRef.current.src = data.agent_audio_url;
        audioPlayerRef.current.play().catch(e => console.error("Autoplay blocked", e));
      }

    } catch (err) {
      console.error(err);
      alert("An error occurred communicating with the agent.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      
      {/* Header & Agent Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "hsl(var(--au-text-primary))" }}
          >
            Playground
          </h1>
          <p className="text-sm text-[hsl(var(--au-text-secondary))]">
            Have a voice conversation with your agents in real-time.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[hsl(var(--au-text-secondary))]">
            Talk to:
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="bg-[hsl(var(--au-surface))] border border-[var(--color-border)] rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] appearance-none min-w-[160px]"
          >
            <option value="" disabled>Select agent...</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 surface-card flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
              <Bot className="w-16 h-16 text-[hsl(var(--au-text-secondary))] mb-4" />
              <p className="text-sm text-[hsl(var(--au-text-secondary))] max-w-sm">
                Hold the microphone button below and start speaking to interact with your agent.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" 
                    ? "bg-[hsl(var(--au-bg))] border border-[var(--color-border)]" 
                    : "bg-[hsl(var(--au-accent))/20] text-[hsl(var(--au-accent))]"
                }`}>
                  {msg.role === "user" ? <User className="w-5 h-5 text-[hsl(var(--au-text-secondary))]" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-[hsl(var(--au-surface))] text-[hsl(var(--au-text-primary))] rounded-tr-none border border-[var(--color-border)]"
                      : "bg-[hsl(var(--au-bg))] text-[hsl(var(--au-text-primary))] rounded-tl-none border border-[hsl(var(--au-accent))/30]"
                  }`}>
                    {msg.text}
                  </div>
                  
                  {msg.role === "agent" && msg.latencyMs && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[hsl(var(--au-secondary))/10] text-[hsl(var(--au-secondary))]">
                        <Zap className="w-3 h-3" />
                        {msg.latencyMs}ms latency
                      </span>
                      {msg.audioUrl && (
                        <button 
                          onClick={() => {
                            if (audioPlayerRef.current) {
                              audioPlayerRef.current.src = msg.audioUrl!;
                              audioPlayerRef.current.play();
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-[hsl(var(--au-text-secondary))] hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Replay Audio
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--au-accent))/20] text-[hsl(var(--au-accent))] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex items-center px-5 py-4 rounded-2xl rounded-tl-none bg-[hsl(var(--au-bg))] border border-[hsl(var(--au-accent))/30]">
                <Loader2 className="w-5 h-5 text-[hsl(var(--au-accent))] animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[hsl(var(--au-surface))] flex justify-center">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isProcessing}
            className={`
              relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
              ${isProcessing ? "opacity-50 cursor-not-allowed bg-white/5" : ""}
              ${isRecording 
                ? "bg-[hsl(var(--au-accent))] text-white scale-110 shadow-[0_0_30px_hsl(var(--au-accent))]" 
                : "bg-white/10 text-[hsl(var(--au-text-secondary))] hover:bg-white/20 hover:text-white"
              }
            `}
          >
            {isRecording ? (
              <>
                <div className="absolute inset-0 rounded-full bg-[hsl(var(--au-accent))] animate-ping opacity-20" />
                <Mic className="w-8 h-8 relative z-10" />
              </>
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
          
          <audio ref={audioPlayerRef} className="hidden" />
        </div>
        
        <p className="text-center text-[10px] text-[hsl(var(--au-text-secondary))] absolute bottom-2 w-full left-0 pointer-events-none">
          Hold to talk. Release to send.
        </p>
      </div>

    </div>
  );
}
