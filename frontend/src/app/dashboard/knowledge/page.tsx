"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { UploadCloud, FileText, Database, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface Agent {
  id: string;
  name: string;
}

interface Document {
  id: string;
  filename: string;
  created_at: string;
  chunkCount?: number;
}

export default function KnowledgePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchAgents = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get current project
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
  }, [supabase]);

  const fetchDocuments = useCallback(async (agentId: string) => {
    // We use Supabase relation counting: document_chunks(count)
    const { data, error } = await supabase
      .from("documents")
      .select("id, filename, created_at, document_chunks(count)")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (data && !error) {
      const docs = data.map((d: any) => ({
        id: d.id,
        filename: d.filename,
        created_at: d.created_at,
        chunkCount: d.document_chunks[0]?.count || 0
      }));
      setDocuments(docs);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (selectedAgentId) {
      fetchDocuments(selectedAgentId);
    } else {
      setDocuments([]);
    }
  }, [selectedAgentId, fetchDocuments]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!selectedAgentId) {
      setErrorToast("Please select an agent first.");
      return;
    }
    if (file.type !== "application/pdf") {
      setErrorToast("Only PDF files are supported.");
      return;
    }

    setIsUploading(true);
    setErrorToast(null);
    setSuccessToast(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("agent_id", selectedAgentId);
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/api/knowledge/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        },
        body: formData
      });

      const responseData = await res.json();

      if (!res.ok) {
        if (responseData.error === "file_too_large") {
          throw new Error("File exceeds the 20MB limit.");
        }
        if (responseData.error === "no_text_found") {
          throw new Error("No text found — OCR is not supported in this version.");
        }
        throw new Error(responseData.message || "Upload failed");
      }

      setSuccessToast(`Successfully ingested document into ${responseData.chunks_created} chunks.`);
      fetchDocuments(selectedAgentId); // Refresh list
    } catch (err: any) {
      setErrorToast(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto space-y-8">
      <div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: "hsl(var(--au-text-primary))" }}
        >
          Knowledge Hub
        </h1>
        <p className="mt-2 text-[hsl(var(--au-text-secondary))]">
          Upload PDF documents to ground your agents with domain-specific knowledge via RAG.
        </p>
      </div>

      {errorToast && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{errorToast}</p>
        </div>
      )}

      {successToast && (
        <div className="p-4 bg-[hsl(var(--au-success))/10] border border-[hsl(var(--au-success))/20] text-[hsl(var(--au-success))] rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-sm font-medium">{successToast}</p>
        </div>
      )}

      {/* Target Agent Selector */}
      <div className="surface-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <label className="text-sm font-medium text-[hsl(var(--au-text-secondary))] min-w-[120px]">
          Target Agent:
        </label>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="flex-1 bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] appearance-none"
        >
          <option value="" disabled>Select an agent...</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Zone */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[hsl(var(--au-accent))]" />
            Upload Source
          </h2>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`surface-card border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-colors ${
              dragActive 
                ? "border-[hsl(var(--au-accent))] bg-[hsl(var(--au-accent))/5]" 
                : "border-[var(--color-border)] hover:border-[hsl(var(--au-text-secondary))]/50"
            } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
            style={{ height: "240px" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-[hsl(var(--au-accent))] animate-spin mb-4" />
                <p className="text-sm font-medium text-[hsl(var(--au-text-primary))]">Extracting Text & Embedding...</p>
                <p className="text-xs text-[hsl(var(--au-text-secondary))] mt-1">This may take a moment.</p>
              </>
            ) : (
              <>
                <FileText className="w-10 h-10 text-[hsl(var(--au-text-secondary))] mb-4" />
                <p className="text-sm font-medium text-[hsl(var(--au-text-primary))]">Click or drag a PDF here</p>
                <p className="text-xs text-[hsl(var(--au-text-secondary))] mt-1">Max 20MB. Text-based PDFs only.</p>
              </>
            )}
          </div>
        </div>

        {/* Processed Documents List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-[hsl(var(--au-secondary))]" />
            Ingested Documents
          </h2>
          
          <div className="surface-card p-1 min-h-[240px]">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[230px] text-center px-4">
                <Database className="w-12 h-12 text-[hsl(var(--au-text-secondary))]/30 mb-3" />
                <p className="text-sm text-[hsl(var(--au-text-secondary))]">
                  No documents found for this agent.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)] max-h-[400px] overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-md bg-[hsl(var(--au-accent))/10] text-[hsl(var(--au-accent))] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-[hsl(var(--au-text-primary))] truncate">{doc.filename}</p>
                        <p className="text-xs text-[hsl(var(--au-text-secondary))]">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(var(--au-secondary))/10] text-[hsl(var(--au-secondary))]">
                        <Database className="w-3 h-3" />
                        {doc.chunkCount} chunks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
