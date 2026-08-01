use meter_lib::engine;

#[test]
fn scan_real_logs() {
    let start = std::time::Instant::now();
    let snapshot = engine::scan();
    let elapsed = start.elapsed();
    println!(
        "scan took {elapsed:?} · claude_dir={} codex_dir={}",
        snapshot.claude_dir_found, snapshot.codex_dir_found
    );
    println!(
        "today: claude=${:.2} codex=${:.2} tokens={}",
        snapshot.today.claude_cost,
        snapshot.today.codex_cost,
        snapshot.today.tokens.total()
    );
    println!(
        "days={} sessions={} projects={} models={}",
        snapshot.days.len(),
        snapshot.sessions.len(),
        snapshot.projects.len(),
        snapshot.models.len()
    );
    for model in snapshot.models.iter().take(8) {
        println!(
            "  model {} · reqs={} tok={} cost=${:.2}",
            model.model,
            model.requests,
            model.tokens.total(),
            model.cost
        );
    }
    if let Some(block) = &snapshot.block {
        println!(
            "block: active={} used_pct={:.0}% limit={} burn={:.0} tok/min eta={:?}min reset_in={:.0}min cost=${:.2}",
            block.is_active,
            block.used_pct,
            block.limit_tokens,
            block.tokens_per_min,
            block.eta_minutes,
            block.reset_in_minutes,
            block.cost
        );
    }
    for session in snapshot.sessions.iter().take(6) {
        println!(
            "  session live={} label={:?} cwd={:?} branch={:?} id={}",
            session.is_live,
            session.label,
            session.cwd,
            session.git_branch,
            &session.session_id[..session.session_id.len().min(12)]
        );
    }
    for day in snapshot.days.iter().rev().take(7) {
        println!(
            "  day {} claude=${:.2} codex=${:.2}",
            day.date, day.claude_cost, day.codex_cost
        );
    }
}
