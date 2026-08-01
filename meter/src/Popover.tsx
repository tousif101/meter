import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Bar, Num, PulseDot } from "./components";
import { label, mono, t, ui } from "./theme";
import {
  fmtDuration,
  fmtTokens,
  fmtUsd,
  totalTokens,
  type UsageSnapshot,
} from "./types";
import { useUsage } from "./useUsage";

function Sparkline({ snapshot }: { snapshot: UsageSnapshot }) {
  const days = snapshot.days.slice(-14);
  const max = Math.max(...days.map((d) => d.claudeCost + d.codexCost), 0.01);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 34 }}>
      {days.map((d, i) => {
        const total = d.claudeCost + d.codexCost;
        const isToday = i === days.length - 1;
        return (
          <div
            key={d.date}
            style={{
              width: 6,
              height: Math.max(3, (total / max) * 34),
              borderRadius: 2,
              background: isToday ? t.claude : t.trackPop,
            }}
          />
        );
      })}
    </div>
  );
}

export default function Popover() {
  const snapshot = useUsage();

  useEffect(() => {
    const win = getCurrentWebviewWindow();
    const unlisten = win.onFocusChanged(({ payload: focused }) => {
      if (!focused) win.hide();
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
  const today = snapshot?.today;
  const total = today ? today.claudeCost + today.codexCost : 0;
  const block = snapshot?.block;

  return (
    <div
      style={{
        fontFamily: ui,
        background: "rgba(30,33,38,.98)",
        borderRadius: 12,
        boxShadow: "0 18px 40px rgba(0,0,0,.5)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        color: t.textBody,
        height: "calc(100vh - 20px)",
        margin: 10,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={label}>Today</div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: t.textPrimary,
            }}
          >
            {fmtUsd(total)}
          </div>
        </div>
        {snapshot && <Sparkline snapshot={snapshot} />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {(
          [
            ["Claude", today?.claudeCost ?? 0, t.claude],
            ["Codex", today?.codexCost ?? 0, t.codex],
          ] as const
        ).map(([name, cost, color]) => (
          <div
            key={name}
            style={{
              background: t.panelRaised,
              borderRadius: 9,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ fontSize: 11.5, color: t.textMuted }}>{name}</div>
            <Num size={16} color={color} weight={600}>
              {fmtUsd(cost)}
            </Num>
          </div>
        ))}
      </div>

      {block && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
            <span style={{ color: t.textMuted }}>5-hour block</span>
            <Num size={11.5} color={block.usedPct > 80 ? t.negative : t.textSecondary}>
              {block.limitTokens > 0
                ? `${Math.round(block.usedPct)}% · resets in ${fmtDuration(block.resetInMinutes)}`
                : `${fmtTokens(totalTokens(block.tokens))} tok`}
            </Num>
          </div>
          <Bar
            pct={block.usedPct}
            color={block.usedPct > 80 ? t.negative : t.claude}
            track={t.trackPop}
            height={6}
          />
          {block.isActive && block.etaMinutes !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 11.5,
                color: t.textTertiary,
              }}
            >
              <PulseDot />
              <span>
                At this pace, limit in{" "}
                <Num size={11.5} color={block.etaMinutes < block.resetInMinutes ? t.negative : t.positive}>
                  ~{fmtDuration(block.etaMinutes)}
                </Num>
              </span>
            </div>
          )}
        </div>
      )}

      {snapshot?.sessions
        .filter((s) => s.isLive)
        .slice(0, 2)
        .map((s) => (
          <div
            key={s.sessionId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 11.5,
              color: t.textSecondary,
              borderTop: `1px solid ${t.trackPop}`,
              paddingTop: 10,
            }}
          >
            <PulseDot />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.source === "claude" ? "claude-code" : "codex"} · {s.project}
            </span>
            <Num size={11} color={t.textFaint}>
              {fmtDuration((s.lastMs - s.firstMs) / 60000)}
            </Num>
          </div>
        ))}

      <div style={{ flex: 1 }} />

      <button
        onClick={() => invoke("open_main")}
        style={{
          background: t.trackPop,
          color: t.textBody,
          border: "none",
          borderRadius: 8,
          padding: "9px 0",
          fontSize: 12.5,
          fontFamily: ui,
          cursor: "pointer",
        }}
      >
        Open Meter
      </button>
    </div>
  );
}
