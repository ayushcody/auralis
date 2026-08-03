"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Bot, Save, AlertCircle, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";

interface Voice {
  id: string;
  display_name: string;
}

interface AgentData {
  id: string;
  name: string;
  greeting: string;
  system_instructions: string;
  supported_languages: string[];
  voice_id?: string;
}

export default function StudioPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  
  // Generation state
  const [roleDesc, setRoleDesc] = useState("");
  const [agentName, setAgentName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Editable state
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI messaging
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const initData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch or create project
    let currentProjectId = null;
    const { data: projData } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_user_id", session.user.id)
      .limit(1);

    if (projData && projData.length > 0) {
      currentProjectId = projData[0].id;
    } else {
      const { data: newProj } = await supabase
        .from("projects")
        .insert({ owner_user_id: session.user.id, name: "Default Project" })
        .select()
        .single();
      if (newProj) currentProjectId = newProj.id;
    }
    setProjectId(currentProjectId);

    if (currentProjectId) {
      const { data: voicesData } = await supabase
        .from("voices")
        .select("id, display_name")
        .eq("project_id", currentProjectId);
      if (voicesData) setVoices(voicesData);
    }
  }, [supabase]);

  useEffect(() => {
    initData();
  }, [initData]);

  const handleGenerate = async () => {
    if (!roleDesc.trim() || !agentName.trim()) return;
    if (!projectId) return;

    setIsGenerating(true);
    setErrorToast(null);
    setSuccessToast(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("http://localhost:8000/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          project_id: projectId,
          name: agentName,
          role_description: roleDesc
        })
      });

      if (!res.ok) {
        throw new Error("Failed to generate agent");
      }

      const responseData = await res.json();
      
      if (responseData.error) {
        setErrorToast("Couldn't auto-generate — please fill in manually");
      }

      setAgent({
        id: responseData.agent.id,
        name: responseData.agent.name,
        greeting: responseData.agent.greeting || "",
        system_instructions: responseData.agent.system_instructions || "",
        supported_languages: responseData.agent.supported_languages || ["en"],
        voice_id: ""
      });
      
    } catch (err) {
      console.error(err);
      setErrorToast("An error occurred connecting to the backend.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!agent) return;
    setIsSaving(true);
    setErrorToast(null);
    setSuccessToast(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const updateData = {
        system_instructions: agent.system_instructions,
        greeting: agent.greeting,
        voice_id: agent.voice_id || null,
        supported_languages: agent.supported_languages
      };

      const res = await fetch(`http://localhost:8000/api/agents/${agent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!res.ok) {
        throw new Error("Failed to save agent");
      }

      setSuccessToast("Agent saved successfully!");
    } catch (err) {
      console.error(err);
      setErrorToast("An error occurred while saving the agent.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
      }}
      className="p-8 md:p-12 max-w-4xl mx-auto space-y-8"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Agent Studio
        </h1>
        <p className="mt-2 text-sm text-[hsl(var(--au-text-secondary))]">
          Create and configure intelligent, voice-enabled conversational AI agents.
        </p>
      </motion.div>

      {errorToast && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{errorToast}</p>
        </div>
      )}

      {successToast && (
        <div className="p-4 bg-[hsl(var(--au-success))/10] border border-[hsl(var(--au-success))/20] text-[hsl(var(--au-success))] rounded-lg flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <p className="text-sm font-medium">{successToast}</p>
        </div>
      )}

      {/* Generator Section */}
      <motion.div 
        variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
        className="surface-card p-6 md:p-8 space-y-6 relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="relative z-10 border-b border-white/5 pb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[hsl(var(--au-accent))]" />
            Auto-Generate Persona
          </h2>
          <p className="text-sm text-[hsl(var(--au-text-secondary))]">
            Describe the agent&apos;s role and personality, and our LLM will build its system prompt.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--au-text-secondary))]">
              Agent Name
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g. Captain Blackbeard"
              className="w-full bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--au-text-secondary))]">
              Role Description
            </label>
            <textarea
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
              placeholder="e.g. A sarcastic pirate customer service agent who solves tech support issues."
              className="w-full h-24 bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !roleDesc.trim() || !agentName.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Bot className="w-4 h-4" /> Generate Agent</>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Configuration Form */}
      {agent && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.4 }}
          className="surface-card p-6 md:p-8 space-y-6"
        >
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-lg font-semibold mb-1">Configuration</h2>
            <p className="text-sm text-[hsl(var(--au-text-secondary))]">
              Review and manually edit the generated agent settings before saving.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--au-text-secondary))]">
                System Instructions
              </label>
              <textarea
                value={agent.system_instructions}
                onChange={(e) => setAgent({ ...agent, system_instructions: e.target.value })}
                className="w-full h-48 bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] transition-colors font-mono resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--au-text-secondary))]">
                Greeting
              </label>
              <input
                type="text"
                value={agent.greeting}
                onChange={(e) => setAgent({ ...agent, greeting: e.target.value })}
                className="w-full bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--au-text-secondary))]">
                  Supported Languages
                </label>
                <input
                  type="text"
                  value={agent.supported_languages.join(", ")}
                  onChange={(e) => setAgent({ 
                    ...agent, 
                    supported_languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  placeholder="en, hi, es..."
                  className="w-full bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] transition-colors"
                />
                <p className="text-xs text-[hsl(var(--au-text-secondary))] mt-1.5">
                  Comma-separated ISO 639-1 codes.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--au-text-secondary))]">
                  Voice Profile
                </label>
                <select
                  value={agent.voice_id || ""}
                  onChange={(e) => setAgent({ ...agent, voice_id: e.target.value })}
                  className="w-full bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] transition-colors appearance-none"
                >
                  <option value="">Select a cloned voice...</option>
                  {voices.map(voice => (
                    <option key={voice.id} value={voice.id}>{voice.display_name}</option>
                  ))}
                </select>
                <p className="text-xs text-[hsl(var(--au-text-secondary))] mt-1.5">
                  Required for TTS generation.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Agent</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
