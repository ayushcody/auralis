import type { Metadata, Viewport } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#080A0F",
};

export const metadata: Metadata = {
  title: "Auralis — Design a voice. Build an intelligence.",
  description:
    "Auralis is a premium voice intelligence platform. Clone voices, build conversational agents, and evaluate them — all from one unified studio.",
  keywords: [
    "voice cloning",
    "text to speech",
    "TTS",
    "voice intelligence",
    "conversational AI",
    "Auralis",
  ],
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#080A0F" />
      </head>
      <body
        className={`${roboto.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
