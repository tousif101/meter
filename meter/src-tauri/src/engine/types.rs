use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Source {
    Claude,
    Codex,
}

#[derive(Debug, Clone, Copy, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenCounts {
    pub input: u64,
    pub output: u64,
    pub cache_create: u64,
    pub cache_read: u64,
}

impl TokenCounts {
    pub fn total(&self) -> u64 {
        self.input + self.output + self.cache_create + self.cache_read
    }

    pub fn io(&self) -> u64 {
        self.input + self.output
    }

    pub fn add(&mut self, other: &TokenCounts) {
        self.input += other.input;
        self.output += other.output;
        self.cache_create += other.cache_create;
        self.cache_read += other.cache_read;
    }
}

/// One deduplicated, costed usage event from either provider.
#[derive(Debug, Clone)]
pub struct UsageEvent {
    pub source: Source,
    pub timestamp_ms: i64,
    pub model: Option<String>,
    pub tokens: TokenCounts,
    pub cost: f64,
    pub session_id: String,
    pub project: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DayStat {
    pub date: String,
    pub claude_cost: f64,
    pub codex_cost: f64,
    pub tokens: TokenCounts,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionStat {
    pub source: Source,
    pub session_id: String,
    pub project: String,
    pub tokens: TokenCounts,
    pub cost: f64,
    pub first_ms: i64,
    pub last_ms: i64,
    pub models: Vec<String>,
    /// Human label: conversation summary or first user prompt.
    pub label: Option<String>,
    pub cwd: Option<String>,
    pub git_branch: Option<String>,
    pub is_live: bool,
}

/// Per-session metadata mined from non-usage log lines.
#[derive(Debug, Clone, Default)]
pub struct SessionMeta {
    pub label: Option<String>,
    pub cwd: Option<String>,
    pub git_branch: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectStat {
    pub name: String,
    pub claude_cost: f64,
    pub codex_cost: f64,
    pub tokens: TokenCounts,
    pub sessions: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStat {
    pub model: String,
    pub tokens: TokenCounts,
    pub cost: f64,
    pub requests: u64,
}

/// The active (or most recent) 5-hour billing block plus live burn/prediction math.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockStat {
    pub start_ms: i64,
    pub end_ms: i64,
    pub is_active: bool,
    pub tokens: TokenCounts,
    pub cost: f64,
    /// Self-calibrated limit: max io-token total of any completed block.
    pub limit_tokens: u64,
    pub used_pct: f64,
    pub tokens_per_min: f64,
    pub io_per_min: f64,
    pub cost_per_hour: f64,
    pub projected_tokens: u64,
    pub projected_cost: f64,
    /// Minutes until the io-token limit is hit at current pace (None = no burn / no limit).
    pub eta_minutes: Option<f64>,
    pub reset_in_minutes: f64,
    pub models: Vec<String>,
}

/// A plain-language explanation of today's numbers: what drove the spend,
/// whether it's normal, and what (if anything) to do about it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Insight {
    /// "pace" | "baseline" | "driver" | "model-mix" | "cache"
    pub kind: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageSnapshot {
    pub generated_at_ms: i64,
    pub today: DayStat,
    /// Ascending, last 30 days including today.
    pub days: Vec<DayStat>,
    pub sessions: Vec<SessionStat>,
    pub projects: Vec<ProjectStat>,
    pub models: Vec<ModelStat>,
    pub block: Option<BlockStat>,
    pub insights: Vec<Insight>,
    pub sessions_today: u64,
    pub claude_dir_found: bool,
    pub codex_dir_found: bool,
}
