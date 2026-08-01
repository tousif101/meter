import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meter — menu bar usage monitor for Claude Code & Codex",
  description:
    "Realtime spend, burn rate, and time-to-limit for Claude Code and Codex — parsed locally from your logs. No account, no cloud, open source.",
  openGraph: {
    title: "Meter",
    description:
      "Know your AI burn rate. Local-first menu bar monitor for Claude Code & Codex.",
    url: "https://meter-site.vercel.app",
    siteName: "Meter",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
