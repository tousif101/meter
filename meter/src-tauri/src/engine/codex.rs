use std::fs;
use std::path::{Path, PathBuf};

use chrono::DateTime;
use serde_json::Value;

use super::pricing;
use super::types::{Source, TokenCounts, UsageEvent};

pub fn session_dirs() -> Vec<PathBuf> {
    let mut homes = Vec::new();
    if let Ok(env_homes) = std::env::var("CODEX_HOME") {
        for part in env_homes.split(',') {
            let part = part.trim();
            if !part.is_empty() {
                homes.push(PathBuf::from(part));
            }
        }
    }
    if homes.is_empty() {
        if let Some(home) = dirs::home_dir() {
            homes.push(home.join(".codex"));
        }
    }
    let mut out = Vec::new();
    for home in homes {
        for sub in ["sessions", "archived_sessions"] {
            let dir = home.join(sub);
            if dir.is_dir() {
                out.push(dir);
            }
        }
    }
    out
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

fn get_u64(value: &Value, keys: &[&str]) -> u64 {
    keys.iter()
        .find_map(|k| value.get(k).and_then(Value::as_u64))
        .unwrap_or(0)
}

#[derive(Default, Clone, Copy, PartialEq)]
struct Totals {
    input: u64,
    cached: u64,
    output: u64,
}

fn parse_totals(value: &Value) -> Totals {
    Totals {
        input: get_u64(value, &["input_tokens", "prompt_tokens", "input"]),
        cached: get_u64(
            value,
            &["cached_input_tokens", "cache_read_input_tokens", "cached_tokens"],
        ),
        output: get_u64(value, &["output_tokens", "completion_tokens", "output"]),
    }
}

fn find_model(value: &Value) -> Option<String> {
    for key in ["model", "model_name"] {
        if let Some(m) = value.get(key).and_then(Value::as_str) {
            if !m.is_empty() {
                return Some(m.to_string());
            }
        }
    }
    value
        .get("metadata")
        .and_then(|m| m.get("model"))
        .and_then(Value::as_str)
        .map(String::from)
}

fn parse_ts_ms(value: &Value) -> Option<i64> {
    match value.get("timestamp") {
        Some(Value::String(s)) => DateTime::parse_from_rfc3339(s)
            .ok()
            .map(|t| t.timestamp_millis()),
        Some(Value::Number(n)) => n.as_i64(),
        _ => None,
    }
}

/// Parse Codex session logs into per-turn usage events.
///
/// Codex logs both cumulative (`total_token_usage`) and per-turn (`last_token_usage`)
/// counts; we prefer the delta when the cumulative advanced, else subtract cumulatives.
/// Forked sessions replay parent history in a <1s burst at the file head — skipped.
pub fn load_events() -> (Vec<UsageEvent>, bool) {
    let session_roots = session_dirs();
    let found = !session_roots.is_empty();
    let mut files = Vec::new();
    for root in &session_roots {
        collect_jsonl(root, &mut files);
    }

    let mut events = Vec::new();
    for file in &files {
        let Ok(content) = fs::read_to_string(file) else { continue };
        let session_id = file
            .file_stem()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_default();
        let project = file
            .parent()
            .and_then(|p| p.file_name())
            .map(|n| n.to_string_lossy().into_owned())
            .filter(|n| n != "sessions" && n != "archived_sessions")
            .unwrap_or_else(|| "codex".into());

        let mut current_model: Option<String> = None;
        let mut prev_totals: Option<Totals> = None;
        let mut is_fork = false;
        let mut first_event_ts: Option<i64> = None;

        for (line_no, line) in content.lines().enumerate() {
            if line.is_empty() {
                continue;
            }
            let quick = line.contains("token_count")
                || line.contains("turn_context")
                || line.contains("session_meta")
                || line.contains("\"usage\"");
            if !quick {
                continue;
            }
            let Ok(value) = serde_json::from_str::<Value>(line) else {
                continue;
            };
            let kind = value.get("type").and_then(Value::as_str).unwrap_or("");
            let payload = value.get("payload");

            if kind == "session_meta" && line_no == 0 {
                if let Some(p) = payload {
                    is_fork = p.get("forked_from_id").is_some()
                        || p.pointer("/source/subagent/thread_spawn/parent_thread_id").is_some();
                }
                continue;
            }
            if kind == "turn_context" {
                if let Some(m) = payload.and_then(find_model) {
                    current_model = Some(m);
                }
                continue;
            }

            // token_count events (interactive) or headless `usage` lines
            let info = payload.and_then(|p| p.get("info"));
            let is_token_count = payload
                .and_then(|p| p.get("type"))
                .and_then(Value::as_str)
                .is_some_and(|t| t == "token_count");

            let (delta, totals_now, model) = if is_token_count {
                let Some(info) = info else { continue };
                let totals = info.get("total_token_usage").map(parse_totals);
                let last = info.get("last_token_usage").map(parse_totals);
                // Skip if the cumulative counter did not move (duplicate event).
                if let (Some(t), Some(prev)) = (totals, prev_totals) {
                    if t == prev {
                        continue;
                    }
                }
                let delta = match (last, totals, prev_totals) {
                    (Some(last), _, _) if last.input + last.output > 0 => last,
                    (_, Some(t), Some(prev)) => Totals {
                        input: t.input.saturating_sub(prev.input),
                        cached: t.cached.saturating_sub(prev.cached),
                        output: t.output.saturating_sub(prev.output),
                    },
                    (_, Some(t), None) => t,
                    _ => continue,
                };
                let model = find_model(info)
                    .or_else(|| payload.and_then(find_model))
                    .or_else(|| current_model.clone());
                (delta, totals, model)
            } else if let Some(usage) = value
                .get("usage")
                .or_else(|| value.pointer("/data/usage"))
            {
                let delta = parse_totals(usage);
                if delta.input + delta.output == 0 {
                    continue;
                }
                let model = find_model(&value)
                    .or_else(|| value.pointer("/data/model_name").and_then(Value::as_str).map(String::from))
                    .or_else(|| current_model.clone());
                (delta, None, model)
            } else {
                continue;
            };

            let ts = parse_ts_ms(&value)
                .or_else(|| payload.and_then(parse_ts_ms))
                .unwrap_or(0);

            // Fork replay suppression: drop the head burst (events within 1s of the first).
            if is_fork {
                match first_event_ts {
                    None => {
                        first_event_ts = Some(ts);
                        prev_totals = totals_now.or(prev_totals);
                        continue;
                    }
                    Some(first) if (ts - first).abs() < 1000 => {
                        prev_totals = totals_now.or(prev_totals);
                        continue;
                    }
                    _ => {}
                }
            }
            prev_totals = totals_now.or(prev_totals);

            let model = model.or_else(|| Some("gpt-5".into()));
            let cached = delta.cached.min(delta.input);
            let tokens = TokenCounts {
                input: delta.input.saturating_sub(cached),
                output: delta.output,
                cache_create: 0,
                cache_read: cached,
            };
            if tokens.total() == 0 {
                continue;
            }
            let cost = pricing::cost_codex(model.as_deref(), delta.input, cached, delta.output);
            events.push(UsageEvent {
                source: Source::Codex,
                timestamp_ms: ts,
                model,
                tokens,
                cost,
                session_id: session_id.clone(),
                project: project.clone(),
            });
        }
    }
    (events, found)
}
