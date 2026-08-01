import { useState, type CSSProperties } from "react";
import { Bar, Dot, Kpi, Num, Panel, PulseDot, SplitBar } from "./components";
import { label, mono, t, ui } from "./theme";
import {
  fmtAgo,
  fmtDateTime,
  fmtDuration,
  fmtTime,
  fmtTokens,
  fmtUsd,
  totalTokens,
  type SessionStat,
  type UsageSnapshot,
} from "./types";
import { useUsage } from "./useUsage";

const SCREENS = ["Overview", "Sessions", "Projects", "Models", "Reports", "Cost & budgets", "Settings"] as const;
type Screen = (typeof SCREENS)[number];

function Sidebar({
  screen,
  setScreen,
  snapshot,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  snapshot: UsageSnapshot | null;
}) {
  const counts: Partial<Record<Screen, number>> = {
    Sessions: snapshot?.sessionsToday,
    Projects: snapshot?.projects.length,
  };
  const block = snapshot?.block;
  return (
    <div
      style={{
        width: 212,
        background: t.sidebar,
        padding: "14px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderRight: `1px solid ${t.border}`,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px 14px",
          fontSize: 14,
          fontWeight: 600,
          color: t.textPrimary,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: t.claude,
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          M
        </span>
        Meter
      </div>
      {SCREENS.map((name) => {
        const active = name === screen;
        return (
          <div
            key={name}
            onClick={() => setScreen(name)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: 7,
              cursor: "pointer",
              background: active ? t.activeNav : "transparent",
              color: active ? t.textPrimary : t.textTertiary,
              fontSize: 13,
              position: "relative",
            }}
          >
            {active && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: 14,
                  borderRadius: 2,
                  background: t.claude,
                }}
              />
            )}
            <span>{name}</span>
            {counts[name] !== undefined && (
              <Num size={11} color={t.textFaint}>
                {counts[name]}
              </Num>
            )}
          </div>
        );
      })}
      <div style={{ flex: 1 }} />
      {block?.isActive && (
        <div
          style={{
            background: t.panelRaised,
            borderRadius: 9,
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: t.textBody, fontWeight: 600 }}>
            <PulseDot /> Active block
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ fontFamily: mono, color: t.textMuted }}>burn rate</span>
            <Num size={11} color={t.textSecondary}>
              ${block.costPerHour.toFixed(2)}/hr
            </Num>
          </div>
        </div>
      )}
    </div>
  );
}

function Overview({ snapshot }: { snapshot: UsageSnapshot }) {
  const { today, block } = snapshot;
  const todayTotal = today.claudeCost + today.codexCost;
  const days = snapshot.days.slice(-7);
  const maxDay = Math.max(...days.map((d) => d.claudeCost + d.codexCost), 0.01);
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Kpi
          title="Spend today"
          value={fmtUsd(todayTotal)}
          sub={`Claude ${fmtUsd(today.claudeCost)} · Codex ${fmtUsd(today.codexCost)}`}
        />
        <Kpi
          title="Tokens today"
          value={fmtTokens(totalTokens(today.tokens))}
          sub={`${fmtTokens(today.tokens.cacheRead)} served from cache`}
        />
        <Kpi title="Sessions" value={String(snapshot.sessionsToday)} sub="active today" />
        <Kpi
          title="Time to limit"
          value={
            block?.isActive && block.etaMinutes !== null
              ? `~${fmtDuration(block.etaMinutes)}`
              : "—"
          }
          sub={
            block?.isActive
              ? `block resets in ${fmtDuration(block.resetInMinutes)}`
              : "no active block"
          }
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 12 }}>
        <Panel title="Spend, last 7 days">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 150, padding: "0 4px" }}>
            {days.map((d) => {
              const total = d.claudeCost + d.codexCost;
              const height = Math.max(4, (total / maxDay) * 130);
              const claudeH = total > 0 ? (d.claudeCost / total) * height : 0;
              return (
                <div
                  key={d.date}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 6 }}
                >
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 130 }}>
                    <div style={{ height: claudeH, background: t.claude, borderRadius: "3px 3px 0 0" }} />
                    <div style={{ height: height - claudeH, background: t.codex, borderRadius: claudeH > 0 ? "0 0 3px 3px" : 3 }} />
                  </div>
                  <div style={{ textAlign: "center", fontSize: 10.5, color: t.textFaint, fontFamily: mono }}>
                    {new Date(d.date + "T12:00:00").toLocaleDateString([], { weekday: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: t.textMuted }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Dot color={t.claude} size={6} /> Claude
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Dot color={t.codex} size={6} /> Codex
            </span>
          </div>
        </Panel>

        <Panel title="Limits">
          {block ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: t.textSecondary }}>Claude 5-hour block</span>
                  <Num size={12} color={block.usedPct > 80 ? t.negative : t.textSecondary}>
                    {block.limitTokens > 0 ? `${Math.round(block.usedPct)}%` : "n/a"}
                  </Num>
                </div>
                <Bar pct={block.usedPct} color={block.usedPct > 80 ? t.negative : t.claude} />
                <div style={{ fontSize: 11, color: t.textFaint }}>
                  {fmtTokens(block.tokens.input + block.tokens.output)} of{" "}
                  {block.limitTokens > 0 ? fmtTokens(block.limitTokens) : "?"} io tokens ·{" "}
                  {block.isActive ? `resets ${fmtTime(block.endMs)}` : "block ended"}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(
                  [
                    ["Burn rate", `${fmtTokens(Math.round(block.tokensPerMin))}/min`],
                    ["Cost / hour", fmtUsd(block.costPerHour)],
                    ["Projected", fmtTokens(block.projectedTokens)],
                    ["Block cost", fmtUsd(block.cost)],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} style={{ background: t.panelRaised, borderRadius: 8, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 10.5, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.03em" }}>{k}</div>
                    <Num size={14} weight={600} color={t.textPrimary}>{v}</Num>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: t.textFaint }}>No Claude activity yet.</div>
          )}
        </Panel>
      </div>

      {snapshot.insights.length > 0 && (
        <Panel title="Why today looks like this">
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {snapshot.insights.map((insight) => {
              const color =
                insight.kind === "pace"
                  ? t.negative
                  : insight.kind === "cache"
                    ? t.positive
                    : insight.kind === "driver"
                      ? t.claude
                      : t.warning;
              return (
                <div key={insight.text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ paddingTop: 5 }}>
                    <Dot color={color} size={7} />
                  </span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.55, color: t.textSecondary }}>
                    {insight.text}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel title="Model mix">
        <ModelTable snapshot={snapshot} limit={5} />
      </Panel>
    </>
  );
}

function SessionRow({
  session,
  selected,
  onClick,
}: {
  session: SessionStat;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "10px 1.4fr 1fr 80px 70px 90px",
        gap: 10,
        alignItems: "center",
        padding: "8px 12px",
        borderBottom: `1px solid ${t.borderSubtle}`,
        cursor: "pointer",
        background: selected ? t.selected : "transparent",
        fontSize: 12.5,
      }}
    >
      {session.isLive ? (
        <PulseDot />
      ) : (
        <Dot color={session.source === "claude" ? t.claude : t.codex} size={7} />
      )}
      <span style={{ color: t.textBody, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {session.label ?? (
          <span style={{ fontFamily: mono, fontSize: 11.5 }}>{session.sessionId}</span>
        )}
      </span>
      <span style={{ color: t.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {session.project}
      </span>
      <Num size={12}>{fmtTokens(totalTokens(session.tokens))}</Num>
      <Num size={12}>{fmtUsd(session.cost)}</Num>
      <Num size={11.5} color={session.isLive ? t.positive : t.textFaint}>
        {session.isLive ? "live" : fmtDateTime(session.lastMs)}
      </Num>
    </div>
  );
}

function Sessions({ snapshot }: { snapshot: UsageSnapshot }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    snapshot.sessions.find((s) => s.sessionId === selectedId) ?? snapshot.sessions[0];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 330px", gap: 12, minHeight: 0, flex: 1 }}>
      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "10px 1.4fr 1fr 80px 70px 90px",
            gap: 10,
            padding: "10px 12px",
            background: t.panelRaised,
            borderBottom: `1px solid ${t.border}`,
            ...label,
          }}
        >
          <span />
          <span>Session</span>
          <span>Project</span>
          <span>Tokens</span>
          <span>Cost</span>
          <span>Last</span>
        </div>
        <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 190px)" }}>
          {snapshot.sessions.map((s) => (
            <SessionRow
              key={`${s.source}-${s.sessionId}`}
              session={s}
              selected={selected === s}
              onClick={() => setSelectedId(s.sessionId)}
            />
          ))}
        </div>
      </Panel>
      {selected && (
        <Panel title="Session detail" style={{ background: t.detail }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12 }}>
            {selected.isLive && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: t.positive, fontWeight: 600 }}>
                <PulseDot /> Live now — this session is still writing to its log
              </div>
            )}
            {selected.label && (
              <div style={{ fontSize: 12.5, color: t.textBody, lineHeight: 1.45 }}>
                {selected.label}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {selected.cwd && (
                <div style={{ fontFamily: mono, fontSize: 11, color: t.textMuted, wordBreak: "break-all" }}>
                  {selected.cwd}
                  {selected.gitBranch && selected.gitBranch !== "HEAD" && (
                    <span style={{ color: t.codex }}> · {selected.gitBranch}</span>
                  )}
                </div>
              )}
              <div style={{ fontFamily: mono, fontSize: 10.5, color: t.textFaint, wordBreak: "break-all" }}>
                {selected.sessionId}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(
                [
                  ["Cost", fmtUsd(selected.cost)],
                  ["Tokens", fmtTokens(totalTokens(selected.tokens))],
                  ["Started", fmtDateTime(selected.firstMs)],
                  [
                    "Last activity",
                    selected.isLive ? fmtAgo(selected.lastMs) : fmtDateTime(selected.lastMs),
                  ],
                ] as const
              ).map(([k, v]) => (
                <div key={k} style={{ background: t.panelRaised, borderRadius: 8, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 10.5, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.03em" }}>{k}</div>
                  <Num size={14} weight={600} color={t.textPrimary}>{v}</Num>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={label}>Token breakdown</div>
              {(
                [
                  ["Input", selected.tokens.input, t.claude],
                  ["Output", selected.tokens.output, t.positive],
                  ["Cache write", selected.tokens.cacheCreate, t.warning],
                  ["Cache read", selected.tokens.cacheRead, t.codex],
                ] as const
              ).map(([k, v, color]) => {
                const max = Math.max(totalTokens(selected.tokens), 1);
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 82, fontSize: 11.5, color: t.textMuted }}>{k}</span>
                    <div style={{ flex: 1 }}>
                      <Bar pct={(v / max) * 100} color={color} height={6} />
                    </div>
                    <Num size={11}>{fmtTokens(v)}</Num>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={label}>Models</div>
              {selected.models.map((m) => (
                <div key={m} style={{ fontFamily: mono, fontSize: 11.5, color: t.textSecondary }}>{m}</div>
              ))}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Projects({ snapshot }: { snapshot: UsageSnapshot }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
      {snapshot.projects.map((p) => (
        <Panel key={p.name} style={{ gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.textBody, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.name}
            </div>
            <Num size={15} weight={600} color={t.textPrimary}>
              {fmtUsd(p.claudeCost + p.codexCost)}
            </Num>
          </div>
          <SplitBar claude={p.claudeCost} codex={p.codexCost} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: t.textFaint }}>
            <span>
              {p.sessions} session{p.sessions === 1 ? "" : "s"}
            </span>
            <Num size={11.5} color={t.textFaint}>
              {fmtTokens(totalTokens(p.tokens))} tok
            </Num>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function ModelTable({ snapshot, limit }: { snapshot: UsageSnapshot; limit?: number }) {
  const models = limit ? snapshot.models.slice(0, limit) : snapshot.models;
  const maxCost = Math.max(...models.map((m) => m.cost), 0.01);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 90px 90px 1fr",
          gap: 10,
          padding: "6px 0",
          borderBottom: `1px solid ${t.border}`,
          ...label,
        }}
      >
        <span>Model</span>
        <span>Requests</span>
        <span>Tokens</span>
        <span>Cost</span>
      </div>
      {models.map((m) => (
        <div
          key={m.model}
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 90px 90px 1fr",
            gap: 10,
            alignItems: "center",
            padding: "8px 0",
            borderBottom: `1px solid ${t.borderSubtle}`,
            fontSize: 12.5,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
            <Dot color={m.model.startsWith("claude") ? t.claude : t.codex} size={6} />
            <span style={{ fontFamily: mono, fontSize: 11.5, color: t.textBody, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {m.model}
            </span>
          </span>
          <Num size={12}>{m.requests}</Num>
          <Num size={12}>{fmtTokens(totalTokens(m.tokens))}</Num>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Bar pct={(m.cost / maxCost) * 100} color={m.model.startsWith("claude") ? t.claude : t.codex} height={6} />
            </div>
            <Num size={12}>{fmtUsd(m.cost)}</Num>
          </span>
        </div>
      ))}
    </div>
  );
}

type ReportMode = "daily" | "weekly" | "monthly";

interface ReportRow {
  key: string;
  label: string;
  models: Set<string>;
  tokens: { input: number; output: number; cacheCreate: number; cacheRead: number };
  cost: number;
  isCurrent: boolean;
}

function weekStartOf(date: string): Date {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function Reports({ snapshot }: { snapshot: UsageSnapshot }) {
  const [mode, setMode] = useState<ReportMode>("daily");
  const todayKey = snapshot.days[snapshot.days.length - 1]?.date ?? "";

  const buckets = new Map<string, ReportRow>();
  for (const day of snapshot.days) {
    let key: string;
    let rowLabel: string;
    if (mode === "daily") {
      key = day.date;
      rowLabel =
        day.date === todayKey
          ? "Today"
          : new Date(day.date + "T12:00:00").toLocaleDateString([], {
              month: "short",
              day: "numeric",
              weekday: "short",
            });
    } else if (mode === "monthly") {
      key = day.date.slice(0, 7);
      rowLabel = new Date(day.date + "T12:00:00").toLocaleDateString([], {
        month: "long",
        year: "numeric",
      });
    } else {
      const start = weekStartOf(day.date);
      key = start.toDateString();
      rowLabel = `Wk of ${start.toLocaleDateString([], { month: "short", day: "numeric" })}`;
    }
    const row =
      buckets.get(key) ??
      ({
        key,
        label: rowLabel,
        models: new Set<string>(),
        tokens: { input: 0, output: 0, cacheCreate: 0, cacheRead: 0 },
        cost: 0,
        isCurrent: false,
      } as ReportRow);
    day.models.forEach((m) => row.models.add(m));
    row.tokens.input += day.tokens.input;
    row.tokens.output += day.tokens.output;
    row.tokens.cacheCreate += day.tokens.cacheCreate;
    row.tokens.cacheRead += day.tokens.cacheRead;
    row.cost += day.claudeCost + day.codexCost;
    if (day.date === todayKey) row.isCurrent = true;
    buckets.set(key, row);
  }
  const rows = [...buckets.values()].reverse();
  const totals = rows.reduce(
    (acc, r) => ({
      input: acc.input + r.tokens.input,
      output: acc.output + r.tokens.output,
      cacheCreate: acc.cacheCreate + r.tokens.cacheCreate,
      cacheRead: acc.cacheRead + r.tokens.cacheRead,
      cost: acc.cost + r.cost,
    }),
    { input: 0, output: 0, cacheCreate: 0, cacheRead: 0, cost: 0 },
  );

  const grid = "110px 1.3fr 76px 76px 86px 86px 80px 80px";
  const cell: CSSProperties = { fontFamily: mono, fontSize: 12, textAlign: "right" };

  return (
    <Panel style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 6, padding: "12px 14px", borderBottom: `1px solid ${t.border}` }}>
        {(["daily", "weekly", "monthly"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              background: mode === m ? t.activeNav : "transparent",
              color: mode === m ? t.textPrimary : t.textMuted,
              border: `1px solid ${mode === m ? t.borderStrong : "transparent"}`,
              borderRadius: 7,
              padding: "5px 14px",
              fontSize: 12.5,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: grid,
          gap: 10,
          padding: "10px 14px",
          background: t.panelRaised,
          borderBottom: `1px solid ${t.border}`,
          ...label,
        }}
      >
        <span>Period</span>
        <span>Models</span>
        <span style={{ textAlign: "right" }}>Input</span>
        <span style={{ textAlign: "right" }}>Output</span>
        <span style={{ textAlign: "right" }}>Cache W</span>
        <span style={{ textAlign: "right" }}>Cache R</span>
        <span style={{ textAlign: "right" }}>Total</span>
        <span style={{ textAlign: "right" }}>Cost</span>
      </div>
      <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 260px)" }}>
        {rows.map((row) => (
          <div
            key={row.key}
            style={{
              display: "grid",
              gridTemplateColumns: grid,
              gap: 10,
              alignItems: "center",
              padding: "9px 14px",
              borderBottom: `1px solid ${t.borderSubtle}`,
              background: row.isCurrent && mode === "daily" ? t.selected : "transparent",
            }}
          >
            <span style={{ fontSize: 12.5, color: row.isCurrent ? t.textPrimary : t.textBody }}>{row.label}</span>
            <span
              style={{
                fontFamily: mono,
                fontSize: 10.5,
                color: t.textFaint,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {[...row.models].join(", ")}
            </span>
            <span style={{ ...cell, color: t.textSecondary }}>{fmtTokens(row.tokens.input)}</span>
            <span style={{ ...cell, color: t.textSecondary }}>{fmtTokens(row.tokens.output)}</span>
            <span style={{ ...cell, color: t.textFaint }}>{fmtTokens(row.tokens.cacheCreate)}</span>
            <span style={{ ...cell, color: t.textFaint }}>{fmtTokens(row.tokens.cacheRead)}</span>
            <span style={{ ...cell, color: t.textSecondary }}>
              {fmtTokens(row.tokens.input + row.tokens.output + row.tokens.cacheCreate + row.tokens.cacheRead)}
            </span>
            <span style={{ ...cell, color: t.textPrimary, fontWeight: 600 }}>{fmtUsd(row.cost)}</span>
          </div>
        ))}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: grid,
            gap: 10,
            padding: "11px 14px",
            background: t.panelRaised,
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 600, color: t.textPrimary }}>Total</span>
          <span />
          <span style={{ ...cell, color: t.textBody }}>{fmtTokens(totals.input)}</span>
          <span style={{ ...cell, color: t.textBody }}>{fmtTokens(totals.output)}</span>
          <span style={{ ...cell, color: t.textMuted }}>{fmtTokens(totals.cacheCreate)}</span>
          <span style={{ ...cell, color: t.textMuted }}>{fmtTokens(totals.cacheRead)}</span>
          <span style={{ ...cell, color: t.textBody }}>
            {fmtTokens(totals.input + totals.output + totals.cacheCreate + totals.cacheRead)}
          </span>
          <span style={{ ...cell, color: t.textPrimary, fontWeight: 600 }}>{fmtUsd(totals.cost)}</span>
        </div>
      </div>
    </Panel>
  );
}

function Budgets({ snapshot }: { snapshot: UsageSnapshot }) {
  const days = snapshot.days.slice(-30);
  const todayTotal = snapshot.today.claudeCost + snapshot.today.codexCost;
  const weekTotal = days.slice(-7).reduce((a, d) => a + d.claudeCost + d.codexCost, 0);
  const monthTotal = days.reduce((a, d) => a + d.claudeCost + d.codexCost, 0);
  const maxDay = Math.max(...days.map((d) => d.claudeCost + d.codexCost), 0.01);
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Kpi title="Today" value={fmtUsd(todayTotal)} sub="daily spend" />
        <Kpi title="Last 7 days" value={fmtUsd(weekTotal)} sub="rolling week" />
        <Kpi title="Last 30 days" value={fmtUsd(monthTotal)} sub="rolling month" />
      </div>
      <Panel title="Daily spend, last 30 days">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140 }}>
          {days.map((d, i) => {
            const total = d.claudeCost + d.codexCost;
            const isToday = i === days.length - 1;
            return (
              <div
                key={d.date}
                title={`${d.date} · ${fmtUsd(total)}`}
                style={{
                  flex: 1,
                  height: Math.max(3, (total / maxDay) * 130),
                  borderRadius: 3,
                  background: isToday ? t.claude : "#2C3138",
                }}
              />
            );
          })}
        </div>
      </Panel>
    </>
  );
}

function Settings({ snapshot }: { snapshot: UsageSnapshot }) {
  const rows: [string, string, boolean][] = [
    ["Claude Code", "~/.claude/projects", snapshot.claudeDirFound],
    ["Codex CLI", "~/.codex/sessions", snapshot.codexDirFound],
  ];
  return (
    <Panel title="Sources">
      {rows.map(([name, path, found]) => (
        <div
          key={name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
            borderBottom: `1px solid ${t.borderSubtle}`,
            fontSize: 12.5,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ color: t.textBody }}>{name}</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: t.textFaint }}>{path}</span>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: found ? t.positive : t.textFaint }}>
            <Dot color={found ? t.positive : t.textFaint} size={7} />
            {found ? "detected" : "not found"}
          </span>
        </div>
      ))}
    </Panel>
  );
}

export default function MainWindow() {
  const snapshot = useUsage();
  const [screen, setScreen] = useState<Screen>("Overview");

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: ui, background: t.content, color: t.textBody }}>
      <Sidebar screen={screen} setScreen={setScreen} snapshot={snapshot} />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "22px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary }}>{screen}</div>
        {!snapshot ? (
          <div style={{ fontSize: 12.5, color: t.textFaint }}>Scanning usage logs…</div>
        ) : screen === "Overview" ? (
          <Overview snapshot={snapshot} />
        ) : screen === "Sessions" ? (
          <Sessions snapshot={snapshot} />
        ) : screen === "Projects" ? (
          <Projects snapshot={snapshot} />
        ) : screen === "Models" ? (
          <Panel title="Models">
            <ModelTable snapshot={snapshot} />
          </Panel>
        ) : screen === "Reports" ? (
          <Reports snapshot={snapshot} />
        ) : screen === "Cost & budgets" ? (
          <Budgets snapshot={snapshot} />
        ) : (
          <Settings snapshot={snapshot} />
        )}
      </div>
    </div>
  );
}
