pub mod blocks;
pub mod claude;
pub mod codex;
pub mod pricing;
pub mod types;

use std::collections::HashMap;

use chrono::{Local, TimeZone, Utc};

use types::{
    DayStat, ModelStat, ProjectStat, SessionStat, Source, TokenCounts, UsageSnapshot,
};

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

    UsageSnapshot {
        generated_at_ms: now_ms,
        today,
        days,
        sessions,
        projects,
        models,
        block,
        sessions_today,
        claude_dir_found: claude_found,
        codex_dir_found: codex_found,
    }
}
