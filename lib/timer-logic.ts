import type { QueueEntry } from "@/lib/types";

export function timerWarning(remainingSeconds: number) {
  if (remainingSeconds < 0) return "expired";
  if (remainingSeconds <= 10) return "final";
  if (remainingSeconds <= 30) return "warning";
  return "normal";
}

export function formatRemaining(remainingSeconds: number) {
  const absolute = Math.abs(remainingSeconds);
  const minutes = Math.floor(absolute / 60);
  const seconds = absolute % 60;
  return `${remainingSeconds < 0 ? "+" : ""}${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function elapsedSince(startedAt?: string, nowMs = Date.now()) {
  if (!startedAt) return 0;
  return Math.max(0, Math.round((nowMs - new Date(startedAt).getTime()) / 1000));
}

export function remainingFromStart(startedAt: string | undefined, allocatedSeconds: number, nowMs = Date.now()) {
  return allocatedSeconds - elapsedSince(startedAt, nowMs);
}

export function elapsedForEntry(entry?: Pick<QueueEntry, "requestedAt" | "elapsedSeconds" | "timerRunning">, nowMs = Date.now()) {
  if (!entry) return 0;
  const storedElapsed = entry.elapsedSeconds ?? 0;
  if (entry.timerRunning === false) return storedElapsed;
  return storedElapsed + elapsedSince(entry.requestedAt, nowMs);
}

export function remainingForEntry(entry: QueueEntry | undefined, fallbackSeconds: number, nowMs = Date.now()) {
  return (entry?.allocatedSeconds ?? fallbackSeconds) - elapsedForEntry(entry, nowMs);
}
