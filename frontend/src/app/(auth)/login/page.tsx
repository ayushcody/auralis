"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
  };

  const handleDemoLogin = async () => {
    setError("");
    setSubmitting(true);
    
    // Bypass Supabase entirely for local demo testing
    localStorage.setItem("auralis_demo_mode", "true");
    
    // Short artificial delay for premium UX
    setTimeout(() => {
      router.replace("/dashboard");
      // Use window.location as fallback if router.replace fails RSC fetch
      setTimeout(() => {
        if (window.location.pathname !== "/dashboard") {
          window.location.href = "/dashboard";
        }
      }, 300);
    }, 600);
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ backgroundColor: "hsl(var(--au-bg))" }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-10 text-center">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "hsl(var(--au-text-primary))" }}
          >
            Auralis
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "hsl(var(--au-text-secondary))" }}
          >
            Sign in to your studio
          </p>
        </div>

        {/* Card */}
        <div className="surface-card p-8 space-y-6">
          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 py-2.5 rounded-[var(--radius-control)] text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--au-border)",
              color: "hsl(var(--au-text-primary))",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "hsl(var(--au-text-primary) / 0.04)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Demo Login */}
          <button
            onClick={handleDemoLogin}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 py-2.5 rounded-[var(--radius-control)] text-sm font-bold transition-all shadow-[0_0_15px_hsl(var(--au-accent)_/_0.2)] hover:shadow-[0_0_20px_hsl(var(--au-accent)_/_0.4)] disabled:opacity-50"
            style={{
              backgroundColor: "hsl(var(--au-accent) / 0.1)",
              border: "1px solid hsl(var(--au-accent) / 0.5)",
              color: "hsl(var(--au-accent))",
            }}
          >
            {submitting ? "Entering Demo..." : "One-Click Demo Login"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "var(--au-border)" }}
            />
            <span
              className="text-[11px] font-medium uppercase tracking-wider"
              style={{ color: "hsl(var(--au-text-secondary))" }}
            >
              or
            </span>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "var(--au-border)" }}
            />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label
                className="block text-[12px] font-medium mb-1.5"
                style={{ color: "hsl(var(--au-text-secondary))" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-[var(--radius-control)] text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "hsl(var(--au-bg))",
                  border: "1px solid var(--au-border)",
                  color: "hsl(var(--au-text-primary))",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "hsl(var(--au-accent))")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--au-border)")
                }
              />
            </div>
            <div>
              <label
                className="block text-[12px] font-medium mb-1.5"
                style={{ color: "hsl(var(--au-text-secondary))" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-[var(--radius-control)] text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "hsl(var(--au-bg))",
                  border: "1px solid var(--au-border)",
                  color: "hsl(var(--au-text-primary))",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "hsl(var(--au-accent))")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--au-border)")
                }
              />
            </div>

            {error && (
              <p className="text-[12px] text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p
          className="mt-6 text-center text-[13px]"
          style={{ color: "hsl(var(--au-text-secondary))" }}
        >
          No account?{" "}
          <Link
            href="/register"
            className="font-medium underline underline-offset-4"
            style={{ color: "hsl(var(--au-accent))" }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
