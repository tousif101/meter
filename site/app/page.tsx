import type { CSSProperties } from "react";
import CopyButton from "./copy-button";

const t = {
  page: "#0B0C0E",
  panel: "#16181C",
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
  warning: "#D2A45A",
};

const mono = 'ui-monospace, "SF Mono", monospace';
const GITHUB = "https://github.com/tousif101/meter";
const DMG = `${GITHUB}/releases/latest`;
const VERSION = "v0.1.0";

const label: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: t.textMuted,
  fontWeight: 500,
};

function DownloadButton({ suffix }: { suffix: string }) {
  return (
    <a
      href={DMG}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: t.claude,
        borderRadius: 9,
        padding: "13px 22px",
        fontSize: 14.5,
        fontWeight: 600,
        color: "#1A0F0A",
        boxShadow: "0 0 0 1px rgba(210,121,90,.35), 0 4px 24px rgba(210,121,90,.25)",
      }}
    >
      Download for macOS
      <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 400, color: "#5A2E1D" }}>{suffix}</span>
    </a>
  );
}

function Glance() {
  const spark = [5, 8, 6, 11, 7, 12, 9, 14, 10, 16, 12, 20, 26, 34];
  return (
    <div
      style={{
        width: 320,
        background: "rgba(30,33,38,.96)",
        borderRadius: 12,
        boxShadow: "0 18px 40px rgba(0,0,0,.5)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 13,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={label}>Today</div>
          <div style={{ fontFamily: mono, fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", color: t.textPrimary, marginTop: 4 }}>
            $12.84
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 38, paddingTop: 4 }}>
          {spark.map((h, i) => (
            <div
              key={i}
              style={{ width: 6, height: h, borderRadius: 2, background: i >= spark.length - 2 ? t.claude : t.track }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {(
          [
            ["Claude", "$9.20", t.claude],
            ["Codex", "$3.64", t.codex],
          ] as const
        ).map(([name, value, color]) => (
          <div key={name} style={{ background: t.panelRaised, borderRadius: 9, padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: t.textMuted }}>{name}</div>
            <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color, marginTop: 3 }}>{value}</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 6 }}>
          <span style={{ color: t.textMuted }}>Weekly limit</span>
          <span style={{ fontFamily: mono, color: t.textSecondary }}>62% · resets Thu</span>
        </div>
        <div style={{ background: t.track, borderRadius: 4, height: 6, overflow: "hidden" }}>
          <div style={{ width: "62%", height: "100%", background: t.claude }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: t.textTertiary }}>
        <span className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: t.positive }} />
        <span>
          At this pace, limit in <span style={{ fontFamily: mono, color: t.positive }}>~2h 41m</span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: t.textSecondary, borderTop: `1px solid ${t.track}`, paddingTop: 12 }}>
        <span className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: t.positive }} />
        <span style={{ flex: 1 }}>claude-code · atlas-api</span>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: t.textFaint }}>6m 12s</span>
      </div>
    </div>
  );
}

function OverviewWindow() {
  const days: [string, number, number][] = [
    ["Mon", 34, 12],
    ["Tue", 58, 16],
    ["Wed", 30, 10],
    ["Thu", 74, 18],
    ["Fri", 48, 14],
    ["Sat", 10, 5],
    ["Today", 52, 16],
  ];
  return (
    <div
      style={{
        width: 540,
        maxWidth: "100%",
        background: "#191C21",
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 12,
        boxShadow: "0 30px 70px rgba(0,0,0,.55)",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", background: "#1E2126", padding: "10px 0", textAlign: "center", fontSize: 12.5, color: t.textTertiary, borderBottom: `1px solid ${t.border}` }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 6 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
        </span>
        Overview
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {(
            [
              ["Spend today", "$12.84"],
              ["Tokens", "7.5M"],
              ["Sessions", "11"],
              ["Accepted", "78%"],
            ] as const
          ).map(([k, v]) => (
            <div key={k} style={{ background: t.panelRaised, borderRadius: 9, padding: "10px 12px" }}>
              <div style={{ ...label, fontSize: 10 }}>{k}</div>
              <div style={{ fontFamily: mono, fontSize: 19, fontWeight: 600, color: t.textPrimary, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1A1D22", border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.textBody }}>Spend, last 7 days</span>
            <span style={{ display: "flex", gap: 14, fontSize: 11, color: t.textMuted }}>
              <span>
                <span style={{ display: "inline-block", width: 7, height: 7, background: t.claude, borderRadius: 2, marginRight: 5 }} />
                Claude
              </span>
              <span>
                <span style={{ display: "inline-block", width: 7, height: 7, background: t.codex, borderRadius: 2, marginRight: 5 }} />
                Codex
              </span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 96 }}>
            {days.map(([day, claude, codex]) => (
              <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 78 }}>
                  <div style={{ height: claude * 0.8, background: t.claude, borderRadius: "3px 3px 0 0" }} />
                  <div style={{ height: codex * 0.8, background: t.codex, borderRadius: "0 0 3px 3px" }} />
                </div>
                <div style={{ textAlign: "center", fontSize: 10, color: t.textFaint, fontFamily: mono }}>{day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        background: "linear-gradient(150deg,#2A3542,#171F28)",
        padding: "0 0 28px",
        overflow: "visible",
        boxShadow: "0 40px 90px rgba(0,0,0,.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(20,24,28,.55)",
          borderRadius: "16px 16px 0 0",
          padding: "8px 14px",
          fontSize: 12.5,
          color: t.textSecondary,
        }}
      >
        <span style={{ fontWeight: 600 }}>Finder</span>
        <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,.12)",
              borderRadius: 5,
              padding: "2px 8px",
              fontFamily: mono,
              fontSize: 12,
              color: t.textPrimary,
            }}
          >
            <span className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: t.positive }} />
            $12.84
          </span>
          <span style={{ fontFamily: mono, fontSize: 12 }}>100%</span>
          <span style={{ fontSize: 12 }}>Thu 3:41 PM</span>
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 18px 0" }}>
        <Glance />
      </div>
      <div style={{ padding: "0 18px", marginTop: -36, position: "relative", zIndex: 2 }}>
        <OverviewWindow />
      </div>
    </div>
  );
}

const STEPS: [string, string, string][] = [
  ["01", "Install and open", "Meter finds your Claude Code and Codex logs on first launch. Nothing to configure, no key to paste."],
  ["02", "Keep working", "It reads sessions as they’re written. The menu bar ticks up while an agent runs; the dot goes green."],
  ["03", "Find the waste", "See which repo, which model, and which hour of the day is eating your weekly window — and cut it."],
];

const WHY: [string, string, string][] = [
  [
    "01",
    "You never have to remember to check",
    "Getting cut off mid-refactor happens because nobody opens a settings page while they’re heads-down. Meter removes the remembering — it’s ambient, like your battery icon. You don’t check it, you see it.",
  ],
  [
    "02",
    "A countdown, not a percentage",
    "“62% used” is a snapshot. “At this pace, you hit the wall in ~12 minutes” is a decision. Meter computes the trajectory, so you know whether to keep going or wrap up before the limit decides for you.",
  ],
  [
    "03",
    "Aligned with you, not the provider",
    "Anthropic’s usage page reports honestly — but it will never say “switch to Sonnet for this task and stretch your week.” That’s optimizing against their own revenue. A local, open-source tool has exactly one side: yours.",
  ],
  [
    "04",
    "One gauge across tools",
    "Claude’s settings shows Claude. It has zero visibility into your Codex usage — and vice versa. If you juggle more than one tool, native settings means three tabs and mental math. Meter is the single place.",
  ],
  [
    "05",
    "Patterns, not just now",
    "Which repo is actually burning the budget? How did this week compare to last? A live-usage screen isn’t built to answer that, and providers have little reason to build it well. History is half the point.",
  ],
];

const PRIVACY_ROWS: [string, string][] = [
  ["Prompt and code content read", "never sent"],
  ["Network requests at rest", "0"],
  ["Account required", "no"],
  ["Local data read", "~/.claude · ~/.codex"],
];

export default function Page() {
  return (
    <div style={{ background: t.page }}>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "16px 32px",
          borderBottom: "1px solid #15171B",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 600, color: t.textPrimary }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: t.claude,
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            M
          </span>
          Meter
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 26, fontSize: 13.5, color: t.textTertiary }}>
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#pricing">Pricing</a>
          <a
            href={DMG}
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              background: "#1D2025",
              border: `1px solid ${t.borderStrong}`,
              borderRadius: 8,
              padding: "7px 14px",
              color: t.textBody,
              fontWeight: 500,
            }}
          >
            <span style={{ fontFamily: mono, fontSize: 12, color: t.textMuted }}>{VERSION}</span>
            Download
          </a>
        </div>
      </nav>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 56,
            padding: "88px 0 110px",
          }}
        >
          <div style={{ flex: "1 1 440px", display: "flex", flexDirection: "column", gap: 24 }}>
            <span
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: `1px solid ${t.borderStrong}`,
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 12.5,
                color: t.textTertiary,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.positive }} />
              Reads Claude Code and Codex locally
            </span>
            <h1 style={{ fontSize: 56, lineHeight: 1.08, letterSpacing: "-0.025em", color: t.textPrimary, fontWeight: 700 }}>
              Know what your
              <br />
              agents actually cost.
            </h1>
            <p style={{ fontSize: 16.5, lineHeight: 1.65, color: t.textTertiary, maxWidth: 500 }}>
              A battery gauge for Claude Code and Codex, in your menu bar. Today’s spend, burn rate, and
              — at this pace — how long until you hit the limit. One dial across both tools, built from
              logs already on your Mac.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <DownloadButton suffix="Apple silicon" />
              <CopyButton command="brew install --cask tousif101/tap/meter" />
            </div>
            <p style={{ fontSize: 12.5, color: t.textFaint }}>Free while you’re solo · no account · 3.4 MB</p>
            <div style={{ display: "flex", gap: 44, paddingTop: 8 }}>
              {(
                [
                  ["$0", "to start"],
                  ["12s", "to first chart"],
                  ["0", "bytes uploaded"],
                ] as const
              ).map(([value, sub]) => (
                <div key={sub}>
                  <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 600, color: t.textPrimary }}>{value}</div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: "1 1 480px", minWidth: 340 }}>
            <HeroVisual />
          </div>
        </section>

        <section id="how-it-works" style={{ paddingBottom: 96 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
            <span style={label}>How it works</span>
            <span style={{ flex: 1, height: 1, background: t.border }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {STEPS.map(([num, title, body]) => (
              <div
                key={num}
                style={{
                  background: "#131519",
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: "22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 12.5, color: t.claude }}>{num}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: t.textPrimary }}>{title}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.6, color: t.textMuted }}>{body}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ paddingBottom: 110 }}>
          <div style={{ maxWidth: 720, marginBottom: 36 }}>
            <h2 style={{ fontSize: 30, letterSpacing: "-0.02em", color: t.textPrimary, fontWeight: 700 }}>
              You already have a usage page.
              <br />
              <span style={{ color: t.textMuted }}>This is different.</span>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {WHY.map(([num, title, body]) => (
              <div
                key={num}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 24,
                  padding: "24px 0",
                  borderTop: `1px solid ${t.border}`,
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 13, color: t.claude, width: 28, paddingTop: 2 }}>{num}</span>
                <span style={{ fontSize: 16.5, fontWeight: 600, color: t.textPrimary, flex: "0 1 280px" }}>{title}</span>
                <span style={{ fontSize: 14, lineHeight: 1.65, color: t.textMuted, flex: "1 1 380px", maxWidth: 600 }}>
                  {body}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="privacy" style={{ paddingBottom: 110 }}>
          <div
            style={{
              background: "#101216",
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: "44px 44px",
              display: "flex",
              flexWrap: "wrap",
              gap: 44,
              alignItems: "center",
            }}
          >
            <div style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 14 }}>
              <span style={label}>Privacy</span>
              <h2 style={{ fontSize: 30, letterSpacing: "-0.02em", color: t.textPrimary, fontWeight: 700 }}>
                Your prompts never leave the machine.
              </h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: t.textMuted }}>
                Meter parses your local session logs on-device — the same files Claude Code and Codex
                already write. No telemetry, no upload, no account. It makes zero network requests, and
                you can audit the source to check.
              </p>
            </div>
            <div style={{ flex: "1 1 420px", display: "flex", flexDirection: "column", gap: 10 }}>
              {PRIVACY_ROWS.map(([left, right]) => (
                <div
                  key={left}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#16181D",
                    border: `1px solid ${t.border}`,
                    borderRadius: 10,
                    padding: "13px 18px",
                    fontSize: 13.5,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10, color: t.textBody }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.positive }} />
                    {left}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 12.5, color: t.textFaint }}>{right}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" style={{ paddingBottom: 110, textAlign: "center" }}>
          <h2
            style={{
              fontSize: 40,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              color: t.textPrimary,
              fontWeight: 700,
              maxWidth: 640,
              margin: "0 auto 30px",
            }}
          >
            You’ll spend more on tokens today than Meter costs all year.
          </h2>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
            <DownloadButton suffix="macOS 11+" />
            <CopyButton command="brew install --cask tousif101/tap/meter" />
          </div>
          <p style={{ fontSize: 12.5, color: t.textFaint, marginTop: 18 }}>
            Free and open source for solo use · paid team features later — the meter itself stays free
          </p>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #15171B" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "24px 32px 34px",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12.5,
            color: t.textFaint,
          }}
        >
          <span style={{ display: "flex", gap: 20 }}>
            <span style={{ color: t.textMuted }}>Meter</span>
            <a href="#privacy">Privacy</a>
            <a href={`${GITHUB}/releases`}>Changelog</a>
            <a href={GITHUB}>GitHub</a>
          </span>
          <span style={{ fontFamily: mono, fontSize: 12 }}>
            {VERSION} · Aug 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
