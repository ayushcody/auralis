"use client";

import React, { useState, useEffect } from "react";
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, FileText, BrainCircuit } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface Agent {
  id: string;
  name: string;
}

interface EvalResult {
  persona: string;
  user_prompt: string;
  agent_reply: string;
  task_completion: boolean;
  hallucination_flag: boolean;
  policy_compliance: boolean;
  reasoning: string;
}

export default function EvalPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<EvalResult[] | null>(null);

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

  const runEvaluation = async () => {
    if (!selectedAgentId) return alert("Please select an agent.");
    setIsRunning(true);
    setResults(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("http://localhost:8000/api/evaluations/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ agent_id: selectedAgentId })
      });

      if (!res.ok) throw new Error("Evaluation failed");
      
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      console.error(err);
      alert("Failed to run evaluation.");
    } finally {
      setIsRunning(false);
    }
  };

  const renderBadge = (passed: boolean, type: "positive" | "negative") => {
    // If it's hallucination, true is bad (fail), false is good (pass).
    // If it's task/policy, true is good (pass), false is bad (fail).
    const isGood = type === "positive" ? passed : !passed;
    
    return isGood ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(var(--au-success))/10] text-[hsl(var(--au-success))]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Pass
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
        <XCircle className="w-3.5 h-3.5" />
        Fail
      </span>
    );
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-8">
      <div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: "hsl(var(--au-text-primary))" }}
        >
          Evaluation Lab
        </h1>
        <p className="mt-2 text-[hsl(var(--au-text-secondary))]">
          Run automated adversarial test suites to assess your agent's resilience.
        </p>
      </div>

      <div className="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Disclaimer</p>
          <p className="text-xs mt-1">
            This tool provides heuristic, LLM-graded testing. It is intended for rapid iteration and spotting major vulnerabilities, but it is not a certified benchmark. Always review critical agent behaviors manually.
          </p>
        </div>
      </div>

      <div className="surface-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 w-full">
          <label className="text-sm font-medium text-[hsl(var(--au-text-secondary))] min-w-[100px]">
            Target Agent:
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="flex-1 max-w-md bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] appearance-none"
            disabled={isRunning}
          >
            <option value="" disabled>Select an agent...</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={runEvaluation}
          disabled={isRunning || !selectedAgentId}
          className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium text-sm transition-all shadow-md
            ${isRunning || !selectedAgentId 
              ? "bg-[hsl(var(--au-accent))/50] text-white/50 cursor-not-allowed" 
              : "bg-[hsl(var(--au-accent))] text-white hover:brightness-110"
            }
          `}
        >
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isRunning ? "Running Suite..." : "Run Evaluation"}
        </button>
      </div>

      {results && (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[hsl(var(--au-bg))] border-b border-[var(--color-border)] text-[hsl(var(--au-text-secondary))]">
                <tr>
                  <th className="px-6 py-4 font-medium">Persona (Adversary)</th>
                  <th className="px-6 py-4 font-medium text-center">Task Completion</th>
                  <th className="px-6 py-4 font-medium text-center">Hallucination</th>
                  <th className="px-6 py-4 font-medium text-center">Policy Compliance</th>
                  <th className="px-6 py-4 font-medium w-1/3">Judge Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {results.map((res, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[hsl(var(--au-text-primary))] flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-[hsl(var(--au-accent))]" />
                        {res.persona}
                      </div>
                      <div className="mt-1 text-xs text-[hsl(var(--au-text-secondary))] line-clamp-2" title={res.user_prompt}>
                        "{res.user_prompt}"
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderBadge(res.task_completion, "positive")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {/* Hallucination is bad, so false is pass, true is fail */}
                      {renderBadge(res.hallucination_flag, "negative")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderBadge(res.policy_compliance, "positive")}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-[hsl(var(--au-text-secondary))] italic leading-relaxed">
                        {res.reasoning}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State / Loading State */}
      {!results && !isRunning && (
        <div className="h-64 surface-card flex flex-col items-center justify-center text-[hsl(var(--au-text-secondary))] border-dashed border-2">
          <ShieldCheck className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Select an agent and click Run Evaluation to begin.</p>
        </div>
      )}

      {isRunning && (
        <div className="h-64 surface-card flex flex-col items-center justify-center text-[hsl(var(--au-accent))] border-dashed border-2 border-[hsl(var(--au-accent))/20]">
          <Loader2 className="w-12 h-12 mb-4 animate-spin" />
          <p className="text-sm font-medium animate-pulse">Running 4 simulated adversarial turns...</p>
          <p className="text-xs text-[hsl(var(--au-text-secondary))] mt-2">Evaluating context, logic, and hallucination.</p>
        </div>
      )}

    </div>
  );
}
