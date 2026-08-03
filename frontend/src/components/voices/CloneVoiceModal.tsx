"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, X, Play, Loader2, Upload } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

type Step = "disclaimer" | "consent" | "details";

interface CloneVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CloneVoiceModal({ isOpen, onClose, onSuccess }: CloneVoiceModalProps) {
  const [step, setStep] = useState<Step>("disclaimer");
  const [isRecording, setIsRecording] = useState(false);
  const [consentAudioBlob, setConsentAudioBlob] = useState<Blob | null>(null);
  const [referenceAudioFile, setReferenceAudioFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [inputType, setInputType] = useState<"upload" | "record">("upload");
  const [isRecordingRef, setIsRecordingRef] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const refMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const refAudioChunksRef = useRef<Blob[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      const hasAccepted = localStorage.getItem("auralis_academic_disclaimer_accepted");
      setStep(hasAccepted ? "consent" : "disclaimer");
      setConsentAudioBlob(null);
      setReferenceAudioFile(null);
      setDisplayName("");
      setLanguage("en");
      setError(null);
      setInputType("upload");
      setIsRecordingRef(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAcceptDisclaimer = () => {
    localStorage.setItem("auralis_academic_disclaimer_accepted", "true");
    setStep("consent");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setConsentAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playConsentAudio = () => {
    if (consentAudioBlob) {
      const audioUrl = URL.createObjectURL(consentAudioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const startRecordingRefAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      refMediaRecorderRef.current = mediaRecorder;
      refAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          refAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(refAudioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], "recorded_reference.webm", { type: "audio/webm" });
        setReferenceAudioFile(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingRef(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecordingRefAudio = () => {
    if (refMediaRecorderRef.current && isRecordingRef) {
      refMediaRecorderRef.current.stop();
      setIsRecordingRef(false);
    }
  };

  const playRefAudio = () => {
    if (referenceAudioFile) {
      const audioUrl = URL.createObjectURL(referenceAudioFile);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReferenceAudioFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!referenceAudioFile) {
      setError("Reference audio file is required.");
      return;
    }
    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

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
      formData.append("reference_audio", referenceAudioFile);
      formData.append("consent_confirmed", consentAudioBlob ? "true" : "false");
      formData.append("language", language);
      formData.append("display_name", displayName);

      const headers: Record<string, string> = {
        'Storage-Mode': storageMode,
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch("http://localhost:8000/api/voices/clone", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to clone voice");
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
      const e = err as Error;
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg surface-card shadow-2xl p-6 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-[hsl(var(--au-text-secondary))] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "disclaimer" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Important Disclaimer</h2>
              <p className="text-[hsl(var(--au-text-secondary))] text-sm leading-relaxed">
                Auralis is a final-year academic demonstration. Voices should only be cloned with the explicit permission of the speaker. This tool does not verify consent programmatically — responsibility for lawful use rests with the user.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleAcceptDisclaimer} className="btn-primary">
                I Understand
              </button>
            </div>
          </div>
        )}

        {step === "consent" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Record Consent</h2>
              <p className="text-[hsl(var(--au-text-secondary))] text-sm mb-4">
                Please read the following phrase aloud to verify consent. This step is optional but recommended.
              </p>
              <div className="p-4 rounded-lg bg-[hsl(var(--au-bg))] border border-[var(--color-border)]">
                <p className="font-mono text-sm text-[hsl(var(--au-text-primary))]">
                  &quot;I consent to creating an AI version of my voice for the Auralis demonstration on {todayStr}.&quot;
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors border border-red-500/50 animate-pulse"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-[hsl(var(--au-accent))/20] text-[hsl(var(--au-accent))] hover:bg-[hsl(var(--au-accent))/30] transition-colors border border-[hsl(var(--au-accent))/50]"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
              
              {consentAudioBlob && !isRecording && (
                <button
                  onClick={playConsentAudio}
                  className="flex items-center gap-2 text-sm text-[hsl(var(--au-text-secondary))] hover:text-[hsl(var(--au-text-primary))]"
                >
                  <Play className="w-4 h-4" /> Preview Recording
                </button>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setStep("details")} className="btn-ghost">
                Skip for now
              </button>
              <button onClick={() => setStep("details")} className="btn-primary">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Voice Details</h2>
              <p className="text-[hsl(var(--au-text-secondary))] text-sm">
                Upload 3-10 seconds of clear, noise-free audio.
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--au-text-secondary))]">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] transition-colors"
                  placeholder="e.g. Interview Voice"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--au-text-secondary))]">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] transition-colors appearance-none"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (IndicF5)</option>
                  <option value="mr">Marathi (IndicF5)</option>
                  <option value="bn">Bengali (IndicF5)</option>
                  <option value="ta">Tamil (IndicF5)</option>
                  <option value="te">Telugu (IndicF5)</option>
                  <option value="fr">French (Kokoro)</option>
                  <option value="es">Spanish (Kokoro)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-[hsl(var(--au-text-secondary))]">
                    Reference Audio
                  </label>
                  <div className="flex bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md p-1">
                    <button
                      onClick={() => setInputType("upload")}
                      className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                        inputType === "upload"
                          ? "bg-[hsl(var(--au-accent)/20)] text-[hsl(var(--au-accent))]"
                          : "text-[hsl(var(--au-text-secondary))] hover:text-white"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      onClick={() => setInputType("record")}
                      className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                        inputType === "record"
                          ? "bg-[hsl(var(--au-accent)/20)] text-[hsl(var(--au-accent))]"
                          : "text-[hsl(var(--au-text-secondary))] hover:text-white"
                      }`}
                    >
                      Record Audio
                    </button>
                  </div>
                </div>

                {inputType === "upload" ? (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[var(--color-border)] rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 text-[hsl(var(--au-text-secondary))] mb-2" />
                      <p className="text-xs text-[hsl(var(--au-text-secondary))]">
                        {referenceAudioFile ? referenceAudioFile.name : "Click to upload audio (WAV, MP3, etc.)"}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="border-2 border-[var(--color-border)] rounded-lg p-4 bg-white/5">
                    <p className="text-xs text-[hsl(var(--au-text-secondary))] mb-3">
                      Read the following text aloud naturally and clearly. This script provides a phonetically balanced sample for optimal voice cloning.
                    </p>
                    <div className="p-3 bg-[hsl(var(--au-bg))] rounded-md border border-[var(--color-border)] mb-4">
                      <p className="font-mono text-xs leading-relaxed text-[hsl(var(--au-text-primary))]">
                        &quot;The quick brown fox jumps over the lazy dog. I am recording this voice sample to create a high-quality artificial intelligence voice clone. By speaking naturally and clearly, with my normal tone and pacing, this system will learn the unique characteristics of my speech.&quot;
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-center gap-3">
                      {isRecordingRef ? (
                        <button
                          onClick={stopRecordingRefAudio}
                          className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors border border-red-500/50 animate-pulse"
                        >
                          <Square className="w-5 h-5 fill-current" />
                        </button>
                      ) : (
                        <button
                          onClick={startRecordingRefAudio}
                          className="w-12 h-12 rounded-full flex items-center justify-center bg-[hsl(var(--au-accent))/20] text-[hsl(var(--au-accent))] hover:bg-[hsl(var(--au-accent))/30] transition-colors border border-[hsl(var(--au-accent))/50]"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      )}
                      
                      {referenceAudioFile && !isRecordingRef && (
                        <button
                          onClick={playRefAudio}
                          className="flex items-center gap-1.5 text-xs text-[hsl(var(--au-text-secondary))] hover:text-[hsl(var(--au-text-primary))]"
                        >
                          <Play className="w-3.5 h-3.5" /> Preview Recording
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="btn-ghost" disabled={isSubmitting}>
                Cancel
              </button>
              <button 
                onClick={handleSubmit} 
                className="btn-primary flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Voice"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
