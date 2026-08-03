"use client";

import React, { useState, useEffect } from "react";
import { Activity, Clock, MessageSquare, BarChart3, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Agent {
  id: string;
  name: string;
}

interface AnalyticsData {
  total_turns: number;
  avg_latency_ms: number;
  language_distribution: Record<string, number>;
}

export default function AnalyticsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedAgentId) {
        setData(null);
        return;
      }
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const res = await fetch(`http://localhost:8000/api/analytics/${selectedAgentId}`, {
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });

        if (!res.ok) throw new Error("Failed to fetch analytics");
        const analyticsData = await res.json();
        setData(analyticsData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [selectedAgentId, supabase]);

  const langData = data ? Object.entries(data.language_distribution).map(([lang, count]) => ({
    name: lang.toUpperCase(),
    count
  })) : [];

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-8">
      <div>
        <h1
          className="text-3xl font-bold tracking-tight flex items-center gap-3"
          style={{ color: "hsl(var(--au-text-primary))" }}
        >
          <Activity className="w-8 h-8 text-[hsl(var(--au-accent))]" />
          Analytics
        </h1>
        <p className="mt-2 text-[hsl(var(--au-text-secondary))]">
          Monitor conversation volume and latency performance for your agents.
        </p>
      </div>

      <div className="surface-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <label className="text-sm font-medium text-[hsl(var(--au-text-secondary))] min-w-[100px]">
          Target Agent:
        </label>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="flex-1 max-w-md bg-[hsl(var(--au-bg))] border border-[var(--color-border)] rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-[hsl(var(--au-accent))] appearance-none"
        >
          <option value="" disabled>Select an agent...</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--au-accent))]" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary Cards */}
          <div className="surface-card p-8 flex flex-col justify-center items-center text-center space-y-2">
            <MessageSquare className="w-10 h-10 text-[hsl(var(--au-accent))] mb-2 opacity-80" />
            <h2 className="text-4xl font-bold text-[hsl(var(--au-text-primary))]">{data.total_turns}</h2>
            <p className="text-sm font-medium text-[hsl(var(--au-text-secondary))] uppercase tracking-wider">Total Agent Turns</p>
          </div>
          
          <div className="surface-card p-8 flex flex-col justify-center items-center text-center space-y-2">
            <Clock className="w-10 h-10 text-[hsl(var(--au-secondary))] mb-2 opacity-80" />
            <h2 className="text-4xl font-bold text-[hsl(var(--au-text-primary))]">{data.avg_latency_ms} <span className="text-lg text-[hsl(var(--au-text-secondary))]">ms</span></h2>
            <p className="text-sm font-medium text-[hsl(var(--au-text-secondary))] uppercase tracking-wider">Average Latency</p>
          </div>

          {/* Chart */}
          <div className="md:col-span-2 surface-card p-8">
            <h3 className="text-lg font-semibold text-[hsl(var(--au-text-primary))] flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-[hsl(var(--au-text-secondary))]" />
              Language Distribution
            </h3>
            
            {langData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-[hsl(var(--au-text-secondary))]">
                No data available.
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={langData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--au-text-secondary))" 
                      tick={{ fill: "hsl(var(--au-text-secondary))" }}
                    />
                    <YAxis 
                      stroke="hsl(var(--au-text-secondary))"
                      tick={{ fill: "hsl(var(--au-text-secondary))" }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--au-surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--au-accent))' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {langData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="hsl(var(--au-accent))" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-64 surface-card flex items-center justify-center text-[hsl(var(--au-text-secondary))]">
          Select an agent to view analytics.
        </div>
      )}
    </div>
  );
}
