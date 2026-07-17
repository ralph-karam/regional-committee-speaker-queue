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
