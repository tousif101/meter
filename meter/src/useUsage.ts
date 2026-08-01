import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { UsageSnapshot } from "./types";

export function useUsage(): UsageSnapshot | null {
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);

  useEffect(() => {
    let disposed = false;
    invoke<UsageSnapshot | null>("get_snapshot").then((s) => {
      if (!disposed && s) setSnapshot(s);
    });
    const unlisten = listen<UsageSnapshot>("usage-snapshot", (event) => {
      if (!disposed) setSnapshot(event.payload);
    });
    return () => {
      disposed = true;
      unlisten.then((fn) => fn());
    };
  }, []);

  return snapshot;
}
