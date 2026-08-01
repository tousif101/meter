use std::collections::BTreeSet;

use super::types::{BlockStat, TokenCounts, UsageEvent};

const HOUR_MS: i64 = 3_600_000;
const MINUTE_MS: f64 = 60_000.0;
const BLOCK_MS: i64 = 5 * HOUR_MS;

struct Block {
    start_ms: i64,
    end_ms: i64,
    last_ms: i64,
    first_ms: i64,
    tokens: TokenCounts,
    cost: f64,
    models: BTreeSet<String>,
}

fn floor_to_hour(ts: i64) -> i64 {
    ts.div_euclid(HOUR_MS) * HOUR_MS
}

/// ccusage's 5-hour billing-block algorithm plus the usage-monitor time-to-limit forecast.
/// `events` must be Claude events only (Anthropic's 5h window semantics).
pub fn analyze(events: &[UsageEvent], now_ms: i64) -> Option<BlockStat> {
    if events.is_empty() {
        return None;
    }
    let mut sorted: Vec<&UsageEvent> = events.iter().collect();
    sorted.sort_by_key(|e| e.timestamp_ms);

    let mut blocks: Vec<Block> = Vec::new();
    for event in sorted {
        let ts = event.timestamp_ms;
        let start_new = match blocks.last() {
            Some(block) => ts - block.start_ms > BLOCK_MS || ts - block.last_ms > BLOCK_MS,
            None => true,
        };
        if start_new {
            let start = floor_to_hour(ts);
            blocks.push(Block {
                start_ms: start,
                end_ms: start + BLOCK_MS,
                last_ms: ts,
                first_ms: ts,
                tokens: TokenCounts::default(),
                cost: 0.0,
                models: BTreeSet::new(),
            });
        }
        let block = blocks.last_mut().unwrap();
        block.last_ms = ts;
        block.tokens.add(&event.tokens);
        block.cost += event.cost;
        if let Some(model) = &event.model {
            block.models.insert(model.clone());
        }
    }

    let last = blocks.last()?;
    let is_active = now_ms - last.last_ms < BLOCK_MS && now_ms < last.end_ms;

    // Self-calibrated limit: highest io-token total among completed blocks.
    let limit_tokens = blocks[..blocks.len().saturating_sub(is_active as usize)]
        .iter()
        .map(|b| b.tokens.io())
        .max()
        .unwrap_or(0);

    let elapsed_min = ((last.last_ms - last.first_ms) as f64 / MINUTE_MS).max(1.0);
    let tokens_per_min = last.tokens.total() as f64 / elapsed_min;
    let io_per_min = last.tokens.io() as f64 / elapsed_min;
    let cost_per_hour = last.cost / elapsed_min * 60.0;
    let reset_in_minutes = ((last.end_ms - now_ms) as f64 / MINUTE_MS).max(0.0);

    let (projected_tokens, projected_cost) = if is_active {
        (
            last.tokens.total() as f64 + tokens_per_min * reset_in_minutes,
            last.cost + cost_per_hour / 60.0 * reset_in_minutes,
        )
    } else {
        (last.tokens.total() as f64, last.cost)
    };

    // Time-to-limit: io-token basis on both sides (usage-monitor pitfall avoided).
    let eta_minutes = if is_active && limit_tokens > 0 && io_per_min > 0.0 {
        let remaining = limit_tokens.saturating_sub(last.tokens.io());
        Some(remaining as f64 / io_per_min)
    } else {
        None
    };

    let used_pct = if limit_tokens > 0 {
        last.tokens.io() as f64 / limit_tokens as f64 * 100.0
    } else {
        0.0
    };

    Some(BlockStat {
        start_ms: last.start_ms,
        end_ms: last.end_ms,
        is_active,
        tokens: last.tokens,
        cost: last.cost,
        limit_tokens,
        used_pct,
        tokens_per_min,
        io_per_min,
        cost_per_hour,
        projected_tokens: projected_tokens.round() as u64,
        projected_cost: (projected_cost * 100.0).round() / 100.0,
        eta_minutes,
        reset_in_minutes,
        models: last.models.iter().cloned().collect(),
    })
}
