"use client";

import { AlertTriangle, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, cn } from "@/components/ui";
import { elapsedForEntry, formatRemaining, timerWarning } from "@/lib/timer-logic";
import { QueueEntry } from "@/lib/types";

export function SpeakerTimer({
  entry,
  durationSeconds,
  onToggle,
  onReset,
  onExpired
}: {
  entry?: QueueEntry;
  durationSeconds: number;
  onToggle: () => void;
  onReset: () => void;
  onExpired?: () => void;
}) {
  const [tick, setTick] = useState(() => Date.now());
  const elapsed = elapsedForEntry(entry, tick);
  const remaining = durationSeconds - elapsed;
  const running = entry ? entry.timerRunning !== false : false;

  useEffect(() => {
    setTick(Date.now());
  }, [entry?.id, entry?.requestedAt, entry?.elapsedSeconds, entry?.timerRunning]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (remaining === -1) onExpired?.();
  }, [remaining, onExpired]);

  const warning = useMemo(() => {
    const level = timerWarning(remaining);
    if (level === "expired") return "Time expired";
    if (level === "final") return "Final 10 seconds";
    if (level === "warning") return "30 seconds remaining";
    return "On time";
  }, [remaining]);

  return (
    <div className="grid gap-4">
      <div className={cn("rounded-lg border p-5 text-center", remaining < 0 ? "border-red-300 bg-red-50 text-red-800 dark:bg-red-950" : remaining <= 30 ? "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950" : "border-blue-100 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100")}>
        <div className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide">
          {remaining <= 30 && <AlertTriangle className="h-4 w-4" aria-hidden />}
          {warning}
        </div>
        <div className="mt-2 text-6xl font-bold tabular-nums">{formatRemaining(remaining)}</div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="secondary" onClick={onToggle} disabled={!entry}>
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause speaking" : "Resume speaking"}
        </Button>
        <Button type="button" variant="secondary" onClick={onReset} disabled={!entry}>
          <RotateCcw className="h-4 w-4" />
          Reset timer
        </Button>
      </div>
      <input type="hidden" data-testid="elapsed-seconds" value={elapsed} />
    </div>
  );
}
