"use client";

import { usePathname } from "next/navigation";
import { AuralisSidebar } from "@/components/AuralisSidebar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isLanding = pathname === "/";
  const showSidebar = isDashboard;

  return (
    <>
      {showSidebar && <AuralisSidebar />}

      <main
        className={`
          relative z-10 min-h-screen transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${showSidebar ? "md:pl-[var(--sidebar-width)]" : ""}
        `}
      >
        {children}
      </main>
    </>
  );
}
