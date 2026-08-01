// Mirrors src-tauri/src/engine/types.rs (serde camelCase).
export type Source = "claude" | "codex";

export interface TokenCounts {
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
}

export interface DayStat {
  date: string;
  claudeCost: number;
  codexCost: number;
  tokens: TokenCounts;
  models: string[];
}

export interface SessionStat {
  source: Source;
  sessionId: string;
  project: string;
  tokens: TokenCounts;
  cost: number;
  firstMs: number;
  lastMs: number;
  models: string[];
  label: string | null;
  cwd: string | null;
  gitBranch: string | null;
  isLive: boolean;
}

export interface ProjectStat {
  name: string;
  claudeCost: number;
  codexCost: number;
  tokens: TokenCounts;
  sessions: number;
}

export interface ModelStat {
  model: string;
  tokens: TokenCounts;
  cost: number;
  requests: number;
}

export interface BlockStat {
  startMs: number;
  endMs: number;
  isActive: boolean;
  tokens: TokenCounts;
  cost: number;
  limitTokens: number;
  usedPct: number;
  tokensPerMin: number;
  ioPerMin: number;
  costPerHour: number;
  projectedTokens: number;
  projectedCost: number;
  etaMinutes: number | null;
  resetInMinutes: number;
  models: string[];
}

export interface Insight {
  kind: "pace" | "baseline" | "driver" | "model-mix" | "cache";
  text: string;
}

export interface UsageSnapshot {
  generatedAtMs: number;
  today: DayStat;
  days: DayStat[];
  sessions: SessionStat[];
  projects: ProjectStat[];
  models: ModelStat[];
  block: BlockStat | null;
  insights: Insight[];
  sessionsToday: number;
  claudeDirFound: boolean;
  codexDirFound: boolean;
}

export const totalTokens = (t: TokenCounts) =>
  t.input + t.output + t.cacheCreate + t.cacheRead;

export const fmtUsd = (v: number) => `$${v.toFixed(2)}`;

export const fmtTokens = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return String(v);
};

export const fmtDuration = (minutes: number) => {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

export const fmtTime = (ms: number) =>
  new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export const fmtDateTime = (ms: number) => {
  const d = new Date(ms);
  const now = new Date();
  const time = fmtTime(ms);
  if (d.toDateString() === now.toDateString()) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yest ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
};

export const fmtAgo = (ms: number) => {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
