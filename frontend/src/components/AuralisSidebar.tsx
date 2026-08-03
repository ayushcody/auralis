"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import React, { useState } from "react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Voices", href: "/dashboard/voices" },
  { label: "Agents", href: "/dashboard/studio" },
  { label: "Knowledge", href: "/dashboard/knowledge" },
  { label: "Playground", href: "/dashboard/playground" },
  { label: "Evaluations", href: "/dashboard/eval" },
  { label: "Analytics", href: "/dashboard/analytics" },
];

export function AuralisSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [hardwareMode, setHardwareMode] = useState("auto");

  const handleModeChange = async (mode: string) => {
    setHardwareMode(mode);
    try {
      await fetch("http://localhost:8000/api/hardware/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
    } catch(e) {
      console.error("Failed to change hardware mode", e);
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed top-0 left-0 h-screen z-50 hidden md:flex flex-col w-[240px] transition-all duration-300 bg-[hsl(var(--au-bg))]"
      style={{
        borderRight: "1px solid var(--au-border)",
      }}
    >
      {/* Brand */}
      <div className="h-14 flex items-center px-6 border-b border-[var(--color-border)] mb-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-4 h-4 bg-[hsl(var(--au-accent))] rounded-[4px] shadow-[0_0_10px_hsl(var(--au-accent)_/_0.4)] group-hover:shadow-[0_0_15px_hsl(var(--au-accent)_/_0.6)] transition-all" />
          <span className="font-semibold tracking-tight text-white">Auralis</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center h-10 px-3 rounded-[var(--radius-control)] text-[13px] font-medium transition-colors duration-150 group"
              style={{
                color: active
                  ? "hsl(var(--au-text-primary))"
                  : "hsl(var(--au-text-secondary))",
              }}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-md bg-[hsl(var(--au-text-primary)_/_0.04)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {active && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[hsl(var(--au-accent))]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 pl-2">{item.label}</span>
              
              {/* Hover highlight for non-active */}
              {!active && (
                <div className="absolute inset-0 rounded-md bg-[hsl(var(--au-text-primary)_/_0.02)] opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Hardware Settings */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid var(--au-border)" }}>
        <p className="text-[10px] font-semibold text-[hsl(var(--au-text-secondary))] mb-2 uppercase tracking-wider">Hardware</p>
        <div className="flex bg-[hsl(var(--au-bg))] rounded-[var(--radius-control)] p-1 border border-[var(--color-border)] text-[11px] font-medium">
          <button 
            onClick={() => handleModeChange("auto")}
            className={`flex-1 py-1.5 rounded-sm transition-colors ${hardwareMode === "auto" ? "bg-[hsl(var(--au-surface))] text-[hsl(var(--au-accent))] shadow-sm" : "text-[hsl(var(--au-text-secondary))] hover:text-[hsl(var(--au-text-primary))]"}`}
          >
            Auto
          </button>
          <button 
            onClick={() => handleModeChange("nvidia")}
            className={`flex-1 py-1.5 rounded-sm transition-colors ${hardwareMode === "nvidia" ? "bg-[hsl(var(--au-surface))] text-[hsl(var(--au-accent))] shadow-sm" : "text-[hsl(var(--au-text-secondary))] hover:text-[hsl(var(--au-text-primary))]"}`}
          >
            Nvidia
          </button>
          <button 
            onClick={() => handleModeChange("mac")}
            className={`flex-1 py-1.5 rounded-sm transition-colors ${hardwareMode === "mac" ? "bg-[hsl(var(--au-surface))] text-[hsl(var(--au-accent))] shadow-sm" : "text-[hsl(var(--au-text-secondary))] hover:text-[hsl(var(--au-text-primary))]"}`}
          >
            Mac
          </button>
        </div>
      </div>

      {/* User Footer */}
      <div
        className="px-4 py-4 shrink-0"
        style={{ borderTop: "1px solid var(--au-border)" }}
      >
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                style={{
                  backgroundColor: "hsl(var(--au-accent) / 0.15)",
                  color: "hsl(var(--au-accent))",
                }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span
                className="text-[12px] font-medium truncate"
                style={{ color: "hsl(var(--au-text-secondary))" }}
              >
                {user.email?.split("@")[0]}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-[11px] font-medium transition-colors px-2 py-1 rounded-[var(--radius-control)]"
              style={{ color: "hsl(var(--au-text-secondary))" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "hsl(var(--au-text-primary))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "hsl(var(--au-text-secondary))";
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-[12px] font-medium"
            style={{ color: "hsl(var(--au-text-secondary))" }}
          >
            Sign in →
          </Link>
        )}
      </div>
    </aside>
  );
}
