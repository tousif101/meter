import type { CSSProperties } from "react";

const t = {
  canvas: "#0A0B0D",
  panel: "#1A1D22",
  panelRaised: "#1D2025",
  border: "#23272E",
  borderStrong: "#2A2E35",
  track: "#2C3138",
  textPrimary: "#F2F4F7",
  textBody: "#E8EAED",
  textSecondary: "#C7CCD3",
  textTertiary: "#A6ACB4",
  textMuted: "#8A9099",
  textFaint: "#6C737C",
  claude: "#D2795A",
  codex: "#6FA8B8",
  positive: "#6FB98F",
};

const mono = 'ui-monospace, "SF Mono", monospace';

const label: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: t.textMuted,
  fontWeight: 500,
};

const GITHUB = "https://github.com/tousif101/meter";

function PopoverMock() {
  const spark = [4, 7, 5, 10, 8, 13, 9, 15, 11, 18, 14, 22, 17, 30];
  return (
    <div
      style={{
        width: 300,
        background: "rgba(30,33,38,.96)",
        border: "1px solid rgba(255,255,255,.09)",
        borderRadius: 12,
        boxShadow: "0 18px 40px rgba(0,0,0,.5)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 13,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={label}>Today</div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: t.textPrimary,
              marginTop: 4,
            }}
          >
            $12.84
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 34 }}>
          {spark.map((height, index) => (
            <div
              key={index}
              style={{
                width: 6,
                height,
                borderRadius: 2,
                background: index === spark.length - 1 ? t.claude : t.track,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: t.panelRaised, borderRadius: 9, padding: "10px 12px" }}>
          <div style={{ fontSize: 11.5, color: t.textMuted }}>Claude</div>
          <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: t.claude, marginTop: 3 }}>
            $9.20
          </div>
        </div>
        <div style={{ background: t.panelRaised, borderRadius: 9, padding: "10px 12px" }}>
          <div style={{ fontSize: 11.5, color: t.textMuted }}>Codex</div>
          <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: t.codex, marginTop: 3 }}>
            $3.64
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 6 }}>
          <span style={{ color: t.textMuted }}>5-hour block</span>
          <span style={{ fontFamily: mono, color: t.textSecondary }}>62% · resets in 1h 48m</span>
        </div>
        <div style={{ background: t.track, borderRadius: 4, height: 6, overflow: "hidden" }}>
          <div style={{ width: "62%", height: "100%", background: t.claude }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: t.textTertiary }}>
        <span
          className="pulse"
          style={{ width: 7, height: 7, borderRadius: "50%", background: t.positive, display: "inline-block" }}
        />
        <span>
          At this pace, limit in{" "}
          <span style={{ fontFamily: mono, color: t.positive }}>~3h 2m</span>
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 11.5,
          color: t.textSecondary,
          borderTop: `1px solid ${t.track}`,
          paddingTop: 11,
        }}
      >
        <span
          className="pulse"
          style={{ width: 7, height: 7, borderRadius: "50%", background: t.positive, display: "inline-block" }}
        />
        <span style={{ flex: 1 }}>claude-code · atlas-api</span>
        <span style={{ fontFamily: mono, color: t.textFaint }}>6m 12s</span>
      </div>
    </div>
  );
}

const FEATURES: [string, string][] = [
  [
    "Time-to-limit prediction",
    "“At this pace you’ll hit your 5-hour limit in ~12 min.” Burn rate and ETA computed from your actual usage, not a guess.",
  ],
  [
    "5-hour block tracking",
    "Mirrors Anthropic’s billing windows: block start, usage, projection, and reset time — always one glance away in the menu bar.",
  ],
  [
    "Claude Code + Codex",
    "One meter for both. Per-provider spend split, live session detection, and cumulative-token handling for Codex logs.",
  ],
  [
    "Sessions, projects, models",
    "Every session labeled by what it was about — not a UUID. Cost per repo, per model, per day, with cache-hit breakdowns.",
  ],
  [
    "Local-first. Actually.",
    "Your prompts and keys live in your logs. Meter parses them on-device and makes zero network calls. Audit the source yourself.",
  ],
  [
    "Fast and tiny",
    "Native Tauri app, ~3.5 MB download. A full rescan of months of logs takes about half a second.",
  ],
];

export default function Page() {
  return (
    <main style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px" }}>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "22px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 15, fontWeight: 600, color: t.textPrimary }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: t.claude,
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            M
          </span>
          Meter
        </div>
        <div style={{ display: "flex", gap: 22, fontSize: 13.5, color: t.textTertiary }}>
          <a href={`${GITHUB}/releases`} style={{ color: t.textTertiary }}>
            Releases
          </a>
          <a href={GITHUB} style={{ color: t.textTertiary }}>
            GitHub
          </a>
        </div>
      </nav>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 48,
          padding: "72px 0 88px",
        }}
      >
        <div style={{ flex: "1 1 420px", display: "flex", flexDirection: "column", gap: 22 }}>
          <h1
            style={{
              fontSize: 44,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: t.textPrimary,
              fontWeight: 700,
            }}
          >
            Know your AI burn rate
            <br />
            <span style={{ color: t.claude }}>before the limit does.</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: t.textTertiary, maxWidth: 480 }}>
            Meter is a menu bar monitor for <strong style={{ color: t.textSecondary }}>Claude Code</strong> and{" "}
            <strong style={{ color: t.textSecondary }}>Codex</strong>. Realtime spend, burn rate, and
            time-to-limit — parsed locally from your logs. No account. No cloud. Open source.
          </p>
          <div
            style={{
              background: t.panel,
              border: `1px solid ${t.borderStrong}`,
              borderRadius: 10,
              padding: "16px 18px",
              fontFamily: mono,
              fontSize: 13.5,
              color: t.textBody,
              lineHeight: 1.9,
            }}
          >
            <span style={{ color: t.textFaint }}>$ </span>brew tap tousif101/tap
            <br />
            <span style={{ color: t.textFaint }}>$ </span>brew install --cask meter
          </div>
          <p style={{ fontSize: 12, color: t.textFaint }}>
            macOS 11+ · Apple Silicon &amp; Intel · free ·{" "}
            <a href={`${GITHUB}#install-homebrew`} style={{ color: t.textMuted, textDecoration: "underline" }}>
              first-launch note
            </a>{" "}
            (not yet notarized)
          </p>
        </div>
        <div style={{ flex: "0 1 320px", display: "flex", justifyContent: "center" }}>
          <PopoverMock />
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
          paddingBottom: 88,
        }}
      >
        {FEATURES.map(([title, body]) => (
          <div
            key={title}
            style={{
              background: t.panel,
              border: `1px solid ${t.border}`,
              borderRadius: 11,
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 14.5, fontWeight: 600, color: t.textPrimary }}>{title}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: t.textMuted }}>{body}</div>
          </div>
        ))}
      </section>

      <section style={{ paddingBottom: 88, maxWidth: 640 }}>
        <div style={{ ...label, marginBottom: 14 }}>How it works</div>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: t.textTertiary }}>
          Claude Code and Codex already write detailed usage logs to{" "}
          <code style={{ fontFamily: mono, fontSize: 13, color: t.textSecondary }}>~/.claude</code> and{" "}
          <code style={{ fontFamily: mono, fontSize: 13, color: t.textSecondary }}>~/.codex</code>. Meter
          watches those files, deduplicates and prices every request, groups usage into Anthropic&apos;s
          5-hour billing blocks, and projects when you&apos;ll hit your limit at the current pace. All of it
          happens on your machine — the app has no backend to send anything to.
        </p>
      </section>

      <footer
        style={{
          borderTop: `1px solid ${t.border}`,
          padding: "26px 0 40px",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 12.5,
          color: t.textFaint,
        }}
      >
        <span>Meter — built with Tauri &amp; Rust. MIT licensed.</span>
        <span style={{ display: "flex", gap: 18 }}>
          <a href={GITHUB} style={{ color: t.textMuted }}>
            GitHub
          </a>
          <a href={`${GITHUB}/releases`} style={{ color: t.textMuted }}>
            Download
          </a>
          <a href={`${GITHUB}/issues`} style={{ color: t.textMuted }}>
            Issues
          </a>
        </span>
      </footer>
    </main>
  );
}
