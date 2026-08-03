"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Logo } from "./Logo";

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Only show on Landing page and auth pages.
  // Dashboard pages use the AuralisSidebar for navigation.
  const showOn = ["/", "/login", "/register"];
  if (!showOn.includes(pathname)) return null;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 md:px-12"
      style={{
        backgroundColor: "hsl(var(--au-bg) / 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--au-border)",
      }}
    >
      <div className="w-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Logo size={24} />
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {user ? (
            <Link
              href="/dashboard"
              className="text-[13px] font-semibold px-4 py-2 rounded-[var(--radius-control)] transition-colors"
              style={{
                backgroundColor: "hsl(var(--au-accent))",
                color: "#fff",
              }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[13px] font-medium transition-colors"
              style={{ color: "hsl(var(--au-text-secondary))" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "hsl(var(--au-text-primary))")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "hsl(var(--au-text-secondary))")
              }
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
