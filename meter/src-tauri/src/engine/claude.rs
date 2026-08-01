use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use chrono::DateTime;
use memchr::memmem;
use serde::Deserialize;

use serde_json::Value;

use super::pricing;
use super::types::{SessionMeta, Source, TokenCounts, UsageEvent};

const LABEL_MAX: usize = 80;

fn truncate_label(text: &str) -> String {
    let trimmed = text.trim().replace('\n', " ");
    if trimmed.chars().count() <= LABEL_MAX {
        trimmed
    } else {
        let cut: String = trimmed.chars().take(LABEL_MAX).collect();
        format!("{cut}…")
    }
}

/// Reject command wrappers (<command-name>…), tool results, and caveat banners
/// so the label is an actual human prompt.
fn clean_prompt(text: &str) -> Option<String> {
    let trimmed = text.trim();
    if trimmed.is_empty() || trimmed.starts_with('<') || trimmed.starts_with("Caveat:") {
        return None;
    }
    Some(truncate_label(trimmed))
}

fn extract_user_text(value: &Value) -> Option<String> {
    if value.get("isSidechain").and_then(Value::as_bool) == Some(true) {
        return None;
    }
    let content = value.get("message")?.get("content")?;
    match content {
        Value::String(text) => clean_prompt(text),
        Value::Array(items) => items.iter().find_map(|item| {
            if item.get("type").and_then(Value::as_str) == Some("text") {
                item.get("text").and_then(Value::as_str).and_then(clean_prompt)
            } else {
                None
            }
        }),
        _ => None,
    }
}

#[derive(Deserialize)]
struct RawEntry {
    timestamp: String,
    #[serde(rename = "sessionId")]
    session_id: Option<String>,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(rename = "costUSD")]
    cost_usd: Option<f64>,
    #[serde(rename = "isSidechain")]
    is_sidechain: Option<bool>,
    cwd: Option<String>,
    #[serde(rename = "gitBranch")]
    git_branch: Option<String>,
    message: RawMessage,
}

#[derive(Deserialize)]
struct RawMessage {
    id: Option<String>,
    model: Option<String>,
    usage: RawUsage,
}

#[derive(Deserialize)]
struct RawUsage {
    #[serde(default)]
    input_tokens: u64,
    #[serde(default)]
    output_tokens: u64,
    #[serde(default)]
    cache_creation_input_tokens: u64,
    #[serde(default)]
    cache_read_input_tokens: u64,
    #[serde(default)]
    cache_creation: Option<RawCacheCreation>,
}

#[derive(Deserialize)]
struct RawCacheCreation {
    #[serde(default)]
    ephemeral_5m_input_tokens: u64,
    #[serde(default)]
    ephemeral_1h_input_tokens: u64,
}

pub fn config_dirs() -> Vec<PathBuf> {
    let mut dirs_out = Vec::new();
    if let Ok(env_dirs) = std::env::var("CLAUDE_CONFIG_DIR") {
        for part in env_dirs.split(',') {
            let part = part.trim();
            if !part.is_empty() {
                let path = PathBuf::from(part);
                if path.join("projects").is_dir() {
                    dirs_out.push(path);
                }
            }
        }
        if !dirs_out.is_empty() {
            return dirs_out;
        }
    }
    if let Some(home) = dirs::home_dir() {
        for candidate in [home.join(".config/claude"), home.join(".claude")] {
            if candidate.join("projects").is_dir() && !dirs_out.contains(&candidate) {
                dirs_out.push(candidate);
            }
        }
    }
    dirs_out
}

fn collect_jsonl(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_jsonl(&path, out);
        } else if path.extension().is_some_and(|e| e == "jsonl") {
            out.push(path);
        }
    }
}

/// Turn the flattened project dir name (`-Users-x-Documents-projects-foo`) into `foo`-ish.
fn display_project(dir_name: &str) -> String {
    let mut name = dir_name.to_string();
    for marker in ["-Documents-projects-", "-projects-", "-Documents-"] {
        if let Some(idx) = name.rfind(marker) {
            name = name[idx + marker.len()..].to_string();
            break;
        }
    }
    if let Some(rest) = name.strip_prefix("-Users-") {
        name = rest.splitn(2, '-').nth(1).unwrap_or(rest).to_string();
    }
    if name.is_empty() {
        dir_name.to_string()
    } else {
        name
    }
}

struct Kept {
    idx: usize,
    total: u64,
    is_sidechain: bool,
}

/// Scan all Claude Code project logs into deduplicated, costed usage events,
/// plus per-session metadata (label, cwd, git branch).
pub fn load_events() -> (Vec<UsageEvent>, HashMap<String, SessionMeta>, bool) {
    let dirs = config_dirs();
    let found = !dirs.is_empty();
    let mut files = Vec::new();
    for dir in &dirs {
        collect_jsonl(&dir.join("projects"), &mut files);
    }

    let finder = memmem::Finder::new(b"\"usage\":{");
    let summary_finder = memmem::Finder::new(b"\"type\":\"summary\"");
    let user_finder = memmem::Finder::new(b"\"type\":\"user\"");
    let mut events: Vec<UsageEvent> = Vec::new();
    let mut seen: HashMap<(String, String), Kept> = HashMap::new();
    let mut metas: HashMap<String, SessionMeta> = HashMap::new();

    for file in &files {
        let project = file
            .parent()
            .and_then(|p| p.file_name())
            .map(|n| display_project(&n.to_string_lossy()))
            .unwrap_or_else(|| "unknown".into());
        let fallback_session = file
            .file_stem()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_default();
        let Ok(content) = fs::read(file) else { continue };

        let mut meta = SessionMeta::default();
        let mut prompt_label: Option<String> = None;
        let mut file_session_id: Option<String> = None;

        for line in content.split(|&b| b == b'\n') {
            if line.is_empty() {
                continue;
            }
            if finder.find(line).is_none() {
                // Non-usage lines still carry identity: summaries and user prompts.
                if meta.label.is_none() && summary_finder.find(line).is_some() {
                    if let Ok(value) = serde_json::from_slice::<Value>(line) {
                        meta.label = value
                            .get("summary")
                            .and_then(Value::as_str)
                            .map(truncate_label);
                    }
                } else if prompt_label.is_none() && user_finder.find(line).is_some() {
                    if let Ok(value) = serde_json::from_slice::<Value>(line) {
                        prompt_label = extract_user_text(&value);
                    }
                }
                continue;
            }
            let Ok(raw) = serde_json::from_slice::<RawEntry>(line) else {
                continue;
            };
            let Ok(ts) = DateTime::parse_from_rfc3339(&raw.timestamp) else {
                continue;
            };
            let usage = &raw.message.usage;
            let cache_create = usage
                .cache_creation
                .as_ref()
                .map(|c| c.ephemeral_5m_input_tokens + c.ephemeral_1h_input_tokens)
                .unwrap_or(usage.cache_creation_input_tokens);
            let tokens = TokenCounts {
                input: usage.input_tokens,
                output: usage.output_tokens,
                cache_create,
                cache_read: usage.cache_read_input_tokens,
            };
            if tokens.total() == 0 {
                continue;
            }
            let model = raw
                .message
                .model
                .filter(|m| m != "<synthetic>" && !m.is_empty());
            let cost = raw
                .cost_usd
                .unwrap_or_else(|| pricing::cost(model.as_deref(), &tokens));
            let is_sidechain = raw.is_sidechain.unwrap_or(false);
            let session_id = raw.session_id.unwrap_or(fallback_session.clone());
            if !is_sidechain {
                if meta.cwd.is_none() {
                    meta.cwd = raw.cwd;
                }
                if meta.git_branch.is_none() {
                    meta.git_branch = raw.git_branch.filter(|b| !b.is_empty());
                }
                if file_session_id.is_none() {
                    file_session_id = Some(session_id.clone());
                }
            }
            let event = UsageEvent {
                source: Source::Claude,
                timestamp_ms: ts.timestamp_millis(),
                model,
                tokens,
                cost,
                session_id,
                project: project.clone(),
            };

            match raw.message.id {
                Some(msg_id) => {
                    let key = (msg_id, raw.request_id.unwrap_or_default());
                    match seen.get_mut(&key) {
                        Some(kept) => {
                            // Parent (non-sidechain) wins; else keep the larger entry.
                            let replace = (kept.is_sidechain && !is_sidechain)
                                || (kept.is_sidechain == is_sidechain
                                    && tokens.total() > kept.total);
                            if replace {
                                kept.total = tokens.total();
                                kept.is_sidechain = is_sidechain;
                                events[kept.idx] = event;
                            }
                        }
                        None => {
                            seen.insert(
                                key,
                                Kept {
                                    idx: events.len(),
                                    total: tokens.total(),
                                    is_sidechain,
                                },
                            );
                            events.push(event);
                        }
                    }
                }
                None => events.push(event),
            }
        }

        if let Some(session_id) = file_session_id {
            if meta.label.is_none() {
                meta.label = prompt_label;
            }
            let slot = metas.entry(session_id).or_default();
            if slot.label.is_none() {
                slot.label = meta.label;
            }
            if slot.cwd.is_none() {
                slot.cwd = meta.cwd;
            }
            if slot.git_branch.is_none() {
                slot.git_branch = meta.git_branch;
            }
        }
    }
    (events, metas, found)
}
