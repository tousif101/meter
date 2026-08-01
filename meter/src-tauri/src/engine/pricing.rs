use super::types::TokenCounts;

/// USD per token: (input, output, cache_create, cache_read).
/// Longest matching key wins, mirroring ccusage's fuzzy lookup. Cache defaults follow
/// ccusage: write = input * 1.25, read = input * 0.10 when a provider doesn't publish them.
const PER_M: f64 = 1e-6;

struct Price {
    key: &'static str,
    input: f64,
    output: f64,
    cache_create: f64,
    cache_read: f64,
}

const fn p(key: &'static str, input: f64, output: f64, cache_create: f64, cache_read: f64) -> Price {
    Price { key, input, output, cache_create, cache_read }
}

static PRICES: &[Price] = &[
    // Anthropic (USD per M tokens)
    p("claude-fable-5", 10.0, 50.0, 12.5, 1.0),
    p("claude-mythos-5", 10.0, 50.0, 12.5, 1.0),
    p("claude-opus-4-8", 5.0, 25.0, 6.25, 0.5),
    p("claude-opus-4-7", 5.0, 25.0, 6.25, 0.5),
    p("claude-opus-4-6", 5.0, 25.0, 6.25, 0.5),
    p("claude-opus-4-5", 5.0, 25.0, 6.25, 0.5),
    p("claude-sonnet-4-6", 3.0, 15.0, 3.75, 0.3),
    p("claude-opus-4-1", 15.0, 75.0, 18.75, 1.5),
    p("claude-opus-4", 15.0, 75.0, 18.75, 1.5),
    p("claude-sonnet-4-5", 3.0, 15.0, 3.75, 0.3),
    p("claude-sonnet-4", 3.0, 15.0, 3.75, 0.3),
    p("claude-3-7-sonnet", 3.0, 15.0, 3.75, 0.3),
    p("claude-3-5-sonnet", 3.0, 15.0, 3.75, 0.3),
    p("claude-haiku-4-5", 1.0, 5.0, 1.25, 0.1),
    p("claude-3-5-haiku", 0.8, 4.0, 1.0, 0.08),
    p("claude-3-haiku", 0.25, 1.25, 0.3, 0.03),
    p("claude-3-opus", 15.0, 75.0, 18.75, 1.5),
    // OpenAI / Codex
    p("gpt-5.2-codex", 1.75, 14.0, 2.1875, 0.175),
    p("gpt-5.2", 1.75, 14.0, 2.1875, 0.175),
    p("gpt-5.1-codex", 1.25, 10.0, 1.5625, 0.125),
    p("gpt-5.1", 1.25, 10.0, 1.5625, 0.125),
    p("gpt-5-codex", 1.25, 10.0, 1.5625, 0.125),
    p("gpt-5-mini", 0.25, 2.0, 0.3125, 0.025),
    p("gpt-5-nano", 0.05, 0.4, 0.0625, 0.005),
    p("gpt-5", 1.25, 10.0, 1.5625, 0.125),
    p("o4-mini", 1.1, 4.4, 1.375, 0.275),
    p("o3", 2.0, 8.0, 2.5, 0.5),
    p("gpt-4.1", 2.0, 8.0, 2.5, 0.5),
    p("gpt-4o", 2.5, 10.0, 3.125, 1.25),
];

fn lookup(model: &str) -> Option<&'static Price> {
    let norm = model.to_ascii_lowercase().replace(['.', '@'], "-");
    let mut best: Option<&Price> = None;
    for price in PRICES {
        let key_norm = price.key.replace(['.', '@'], "-");
        if norm.contains(&key_norm) && best.map_or(true, |b| price.key.len() > b.key.len()) {
            best = Some(price);
        }
    }
    best
}

/// Compute USD cost for a usage event. Unknown models cost 0 (ccusage behavior).
pub fn cost(model: Option<&str>, tokens: &TokenCounts) -> f64 {
    let Some(price) = model.and_then(lookup) else {
        return 0.0;
    };
    (tokens.input as f64 * price.input
        + tokens.output as f64 * price.output
        + tokens.cache_create as f64 * price.cache_create
        + tokens.cache_read as f64 * price.cache_read)
        * PER_M
}

/// Codex-style cost: cached tokens are a subset of input and billed at the cache-read rate.
pub fn cost_codex(model: Option<&str>, input: u64, cached: u64, output: u64) -> f64 {
    let Some(price) = model.and_then(lookup) else {
        return 0.0;
    };
    let cached = cached.min(input);
    ((input - cached) as f64 * price.input
        + cached as f64 * price.cache_read
        + output as f64 * price.output)
        * PER_M
}
