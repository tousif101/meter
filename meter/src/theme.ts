// Design tokens from the Meter spec — dark appearance.
import type { CSSProperties } from "react";

export const t = {
  canvas: "#0A0B0D",
  content: "#141619",
  sidebar: "#1B1E23",
  titlebar: "#1E2126",
  panel: "#1A1D22",
  panelRaised: "#1D2025",
  detail: "#17191D",
  hover: "#22262C",
  selected: "#1E2126",
  activeNav: "#282C33",
  borderStrong: "#2A2E35",
  border: "#23272E",
  borderSubtle: "#1F2328",
  track: "#23272E",
  trackPop: "#2C3138",

  textPrimary: "#F2F4F7",
  textBody: "#E8EAED",
  textSecondary: "#C7CCD3",
  textTertiary: "#A6ACB4",
  textMuted: "#8A9099",
  textFaint: "#6C737C",

  claude: "#D2795A",
  claudeDeep: "#B4603F",
  codex: "#6FA8B8",
  codexDeep: "#4E7C89",
  positive: "#6FB98F",
  warning: "#D2A45A",
  negative: "#C4756B",
} as const;

export const mono =
  'ui-monospace, "SF Mono", monospace';
export const ui =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';

export const label: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: t.textMuted,
  fontWeight: 500,
};
