"use client";

import { useEffect, useState } from "react";

export function Clock({ large = false }: { large?: boolean }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <time className={large ? "text-5xl font-bold tabular-nums" : "font-semibold tabular-nums"} dateTime={time.toISOString()}>
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: large ? undefined : "2-digit" })}
    </time>
  );
}
