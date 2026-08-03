"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      setSuccess(true);
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
            Create your account
          </p>
        </div>

        {/* Card */}
        <div className="surface-card p-8 space-y-6">
          {success ? (
            <div className="text-center py-4 space-y-3">
              <p
                className="text-sm font-medium"
                style={{ color: "hsl(var(--au-success))" }}
              >
                Check your email for a confirmation link.
              </p>
              <Link
                href="/login"
                className="text-[13px] font-medium underline underline-offset-4"
                style={{ color: "hsl(var(--au-accent))" }}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
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

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label
                    className="block text-[12px] font-medium mb-1.5"
                    style={{ color: "hsl(var(--au-text-secondary))" }}
                  >
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-[var(--radius-control)] text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: "hsl(var(--au-bg))",
                      border: "1px solid var(--au-border)",
                      color: "hsl(var(--au-text-primary))",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        "hsl(var(--au-accent))")
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
                      (e.currentTarget.style.borderColor =
                        "hsl(var(--au-accent))")
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
                    minLength={6}
                    className="w-full px-3 py-2 rounded-[var(--radius-control)] text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: "hsl(var(--au-bg))",
                      border: "1px solid var(--au-border)",
                      color: "hsl(var(--au-text-primary))",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        "hsl(var(--au-accent))")
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
                  {submitting ? "Creating account…" : "Create account"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Login link */}
        <p
          className="mt-6 text-center text-[13px]"
          style={{ color: "hsl(var(--au-text-secondary))" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium underline underline-offset-4"
            style={{ color: "hsl(var(--au-accent))" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
