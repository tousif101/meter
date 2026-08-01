import type { CSSProperties, ReactNode } from "react";
import { label, mono, t } from "./theme";

export function Panel({
  title,
  right,
  children,
  style,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 11,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        ...style,
      }}
    >
      {(title || right) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          {title && (
            <div style={{ fontSize: 13.5, fontWeight: 600, color: t.textBody }}>{title}</div>
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Dot({ color, size = 7 }: { color: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

export function PulseDot({ color = t.positive }: { color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        animation: "pulseDot 1.6s ease-in-out infinite",
        flexShrink: 0,
      }}
    />
  );
}

export function Bar({
  pct,
  color,
  track = t.track,
  height = 7,
}: {
  pct: number;
  color: string;
  track?: string;
  height?: number;
}) {
  return (
    <div style={{ background: track, borderRadius: 4, height, overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          height: "100%",
          background: color,
          borderRadius: 4,
        }}
      />
    </div>
  );
}

export function SplitBar({
  claude,
  codex,
  height = 7,
}: {
  claude: number;
  codex: number;
  height?: number;
}) {
  const total = claude + codex;
  const claudePct = total > 0 ? (claude / total) * 100 : 0;
  return (
    <div
      style={{
        background: t.track,
        borderRadius: 4,
        height,
        overflow: "hidden",
        display: "flex",
      }}
    >
      <div style={{ width: `${claudePct}%`, background: t.claude }} />
      <div style={{ flex: 1, background: total > 0 ? t.codex : "transparent" }} />
    </div>
  );
}

export function Num({
  children,
  size = 12.5,
  color = t.textBody,
  weight = 400,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  weight?: number;
}) {
  return (
    <span style={{ fontFamily: mono, fontSize: size, color, fontWeight: weight }}>{children}</span>
  );
}

export function Kpi({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <Panel style={{ gap: 8, padding: 14 }}>
      <div style={label}>{title}</div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 27,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: t.textPrimary,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: t.textFaint }}>{sub}</div>}
    </Panel>
  );
}
