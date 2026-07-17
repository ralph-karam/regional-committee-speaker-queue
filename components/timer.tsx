"use client";

import { AlertTriangle, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, cn } from "@/components/ui";
import { formatRemaining, timerWarning } from "@/lib/timer-logic";

export function SpeakerTimer({ durationSeconds, activeKey, onExpired }: { durationSeconds: number; activeKey?: string; onExpired?: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const remaining = durationSeconds - elapsed;

  useEffect(() => {
    setElapsed(0);
    setRunning(Boolean(activeKey));
  }, [activeKey]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
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
      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant="secondary" onClick={() => setRunning((value) => !value)} disabled={!activeKey}>
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Resume"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setElapsed((value) => Math.max(0, value - 60))} disabled={!activeKey}>Extend</Button>
        <Button type="button" variant="ghost" onClick={() => setElapsed(0)} disabled={!activeKey}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
      <input type="hidden" data-testid="elapsed-seconds" value={elapsed} />
    </div>
  );
}
