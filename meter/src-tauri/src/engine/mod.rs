pub mod blocks;
pub mod claude;
pub mod codex;
pub mod pricing;
pub mod types;

use std::collections::HashMap;

use chrono::{Local, TimeZone, Utc};

use types::{
    BlockStat, DayStat, Insight, ModelStat, ProjectStat, SessionStat, Source, TokenCounts,
    UsageEvent, UsageSnapshot,
};

fn short_model(model: &str) -> String {
    model
        .trim_start_matches("claude-")
        .split("-2")
        .next()
        .unwrap_or(model)
        .to_string()
}

/// Translate today's raw numbers into statements a person can act on.
fn build_insights(
    all: &[UsageEvent],
    days: &[DayStat],
    today: &DayStat,
    block: Option<&BlockStat>,
    today_key: &str,
) -> Vec<Insight> {
    let mut insights = Vec::new();
    let today_total = today.claude_cost + today.codex_cost;

    if let Some(block) = block {
        if block.is_active {
            if let Some(eta) = block.eta_minutes {
                if eta < block.reset_in_minutes {
                    insights.push(Insight {
                        kind: "pace".into(),
                        text: format!(
                            "At this pace you hit your usual block limit ~{:.0} min before it resets — wrap up soon or switch to a cheaper model.",
                            block.reset_in_minutes - eta
                        ),
                    });
                }
            }
        }
    }

    let prior: Vec<f64> = days
        .iter()
        .filter(|d| d.date != today_key)
        .rev()
        .take(14)
        .map(|d| d.claude_cost + d.codex_cost)
        .collect();
    if today_total > 1.0 && prior.len() >= 3 {
        let avg = prior.iter().sum::<f64>() / prior.len() as f64;
        if avg > 0.5 {
            let ratio = today_total / avg;
            if ratio >= 1.5 {
                insights.push(Insight {
                    kind: "baseline".into(),
                    text: format!(
                        "Today is ~{:.1}× your typical day (${:.2} vs a ${:.2} average over your last {} active days).",
                        ratio, today_total, avg, prior.len()
                    ),
                });
            } else if ratio <= 0.4 {
                insights.push(Insight {
                    kind: "cache".into(),
                    text: format!(
                        "A quiet day so far — ${:.2} vs your ${:.2} recent average.",
                        today_total, avg
                    ),
                });
            }
        }
    }

    let mut by_driver: HashMap<(String, String), f64> = HashMap::new();
    let mut premium = 0.0_f64;
    for event in all {
        if local_date(event.timestamp_ms) != today_key || event.cost <= 0.0 {
            continue;
        }
        let model = event.model.clone().unwrap_or_else(|| "unknown".into());
        if model.contains("opus") || model.contains("fable") || model.contains("mythos") {
            premium += event.cost;
        }
        *by_driver
            .entry((event.project.clone(), model))
            .or_default() += event.cost;
    }
    if today_total > 1.0 {
        if let Some(((project, model), cost)) = by_driver
            .iter()
            .max_by(|a, b| a.1.total_cmp(b.1))
            .map(|(k, v)| (k.clone(), *v))
        {
            let share = cost / today_total * 100.0;
            if share >= 35.0 {
                insights.push(Insight {
                    kind: "driver".into(),
                    text: format!(
                        "“{}” on {} is {:.0}% of today's spend (${:.2}).",
                        project,
                        short_model(&model),
                        share,
                        cost
                    ),
                });
            }
        }
        let premium_share = premium / today_total * 100.0;
        if today_total >= 5.0 && premium_share >= 60.0 {
            insights.push(Insight {
                kind: "model-mix".into(),
                text: format!(
                    "{:.0}% of today's spend is Opus-class models. Routine tasks on Sonnet cost roughly a fifth as much — worth routing the easy work down.",
                    premium_share
                ),
            });
        }
    }

    let prompt_tokens = today.tokens.input + today.tokens.cache_read;
    if prompt_tokens > 200_000 {
        let cache_pct = today.tokens.cache_read as f64 / prompt_tokens as f64 * 100.0;
        if cache_pct >= 60.0 {
            insights.push(Insight {
                kind: "cache".into(),
                text: format!(
                    "Prompt cache served {:.0}% of today's input tokens — cache reads bill at ~10% of fresh input, so that's working in your favor.",
                    cache_pct
                ),
            });
        } else if cache_pct <= 20.0 {
            insights.push(Insight {
                kind: "model-mix".into(),
                text: format!(
                    "Only {:.0}% of today's input tokens came from cache. Long gaps between turns let the 5-minute cache expire — batching related work keeps it warm.",
                    cache_pct
                ),
            });
        }
    }

    insights.truncate(4);
    insights
}

fn local_date(ts_ms: i64) -> String {
    Utc.timestamp_millis_opt(ts_ms)
        .single()
        .map(|t| t.with_timezone(&Local).format("%Y-%m-%d").to_string())
        .unwrap_or_default()
}

/// Full rescan of both providers into a renderable snapshot.
pub fn scan() -> UsageSnapshot {
    let now_ms = Utc::now().timestamp_millis();
    let (claude_events, session_metas, claude_found) = claude::load_events();
    let (codex_events, codex_found) = codex::load_events();

    let block = blocks::analyze(&claude_events, now_ms);

    let mut all = claude_events;
    all.extend(codex_events);

    // Daily buckets (local timezone), last 30 days.
    let mut day_map: HashMap<String, DayStat> = HashMap::new();
    let today_key = local_date(now_ms);
    for event in &all {
        let date = local_date(event.timestamp_ms);
        let day = day_map.entry(date.clone()).or_insert_with(|| DayStat {
            date,
            claude_cost: 0.0,
            codex_cost: 0.0,
            tokens: TokenCounts::default(),
        });
        match event.source {
            Source::Claude => day.claude_cost += event.cost,
            Source::Codex => day.codex_cost += event.cost,
        }
        day.tokens.add(&event.tokens);
    }
    let mut days: Vec<DayStat> = day_map.values().cloned().collect();
    days.sort_by(|a, b| a.date.cmp(&b.date));
    if days.len() > 30 {
        days.drain(..days.len() - 30);
    }
    let today = days
        .iter()
        .find(|d| d.date == today_key)
        .cloned()
        .unwrap_or(DayStat {
            date: today_key.clone(),
            claude_cost: 0.0,
            codex_cost: 0.0,
            tokens: TokenCounts::default(),
        });

    // Sessions.
    let mut session_map: HashMap<(Source, String), SessionStat> = HashMap::new();
    for event in &all {
        let key = (event.source, event.session_id.clone());
        let session = session_map.entry(key).or_insert_with(|| SessionStat {
            source: event.source,
            session_id: event.session_id.clone(),
            project: event.project.clone(),
            tokens: TokenCounts::default(),
            cost: 0.0,
            first_ms: event.timestamp_ms,
            last_ms: event.timestamp_ms,
            models: Vec::new(),
            label: None,
            cwd: None,
            git_branch: None,
            is_live: false,
        });
        session.tokens.add(&event.tokens);
        session.cost += event.cost;
        session.first_ms = session.first_ms.min(event.timestamp_ms);
        session.last_ms = session.last_ms.max(event.timestamp_ms);
        if let Some(model) = &event.model {
            if !session.models.contains(model) {
                session.models.push(model.clone());
            }
        }
    }
    const LIVE_WINDOW_MS: i64 = 5 * 60 * 1000;
    let mut sessions: Vec<SessionStat> = session_map.into_values().collect();
    for session in &mut sessions {
        session.is_live = now_ms - session.last_ms < LIVE_WINDOW_MS;
        if let Some(meta) = session_metas.get(&session.session_id) {
            session.label = meta.label.clone();
            session.cwd = meta.cwd.clone();
            session.git_branch = meta.git_branch.clone();
        }
    }
    sessions.sort_by_key(|s| -s.last_ms);
    let sessions_today = sessions
        .iter()
        .filter(|s| local_date(s.last_ms) == today_key)
        .count() as u64;
    sessions.truncate(200);

    // Projects.
    let mut project_map: HashMap<String, ProjectStat> = HashMap::new();
    for session in &sessions {
        let project = project_map
            .entry(session.project.clone())
            .or_insert_with(|| ProjectStat {
                name: session.project.clone(),
                claude_cost: 0.0,
                codex_cost: 0.0,
                tokens: TokenCounts::default(),
                sessions: 0,
            });
        match session.source {
            Source::Claude => project.claude_cost += session.cost,
            Source::Codex => project.codex_cost += session.cost,
        }
        project.tokens.add(&session.tokens);
        project.sessions += 1;
    }
    let mut projects: Vec<ProjectStat> = project_map.into_values().collect();
    projects.sort_by(|a, b| {
        (b.claude_cost + b.codex_cost)
            .total_cmp(&(a.claude_cost + a.codex_cost))
    });
    projects.truncate(50);

    // Models.
    let mut model_map: HashMap<String, ModelStat> = HashMap::new();
    for event in &all {
        let Some(model) = &event.model else { continue };
        let stat = model_map.entry(model.clone()).or_insert_with(|| ModelStat {
            model: model.clone(),
            tokens: TokenCounts::default(),
            cost: 0.0,
            requests: 0,
        });
        stat.tokens.add(&event.tokens);
        stat.cost += event.cost;
        stat.requests += 1;
    }
    let mut models: Vec<ModelStat> = model_map.into_values().collect();
    models.sort_by(|a, b| b.cost.total_cmp(&a.cost));

    let insights = build_insights(&all, &days, &today, block.as_ref(), &today_key);

    UsageSnapshot {
        generated_at_ms: now_ms,
        today,
        days,
        sessions,
        projects,
        models,
        block,
        insights,
        sessions_today,
        claude_dir_found: claude_found,
        codex_dir_found: codex_found,
    }
}
