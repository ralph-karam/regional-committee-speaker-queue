"use client";

import { Expand } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueueStore } from "@/lib/store";
import { formatRemaining, remainingForEntry, speakerSignalState } from "@/lib/timer-logic";
import { cn } from "@/components/ui";

type WakeLockSentinel = EventTarget & {
  released: boolean;
  release: () => Promise<void>;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

type WakeLockStatus = "active" | "needs-action" | "unsupported";

const signalStyles = {
  idle: "bg-black text-white",
  speaking: "bg-[#168447] text-white",
  warning: "speaker-warning-pulse bg-[#e6a700] text-[#171100]",
  expired: "bg-[#c81e2b] text-white"
};

export function SpeakerTimerDisplay() {
  const store = useQueueStore();
  const entry = store.currentEntry;
  const [now, setNow] = useState(() => Date.now());
  const [wakeLockStatus, setWakeLockStatus] = useState<WakeLockStatus>("needs-action");
  const wakeLockRef = useRef<WakeLockSentinel | undefined>(undefined);

  const remaining = remainingForEntry(entry, store.settings.defaultDurationSeconds, now);
  const signal = speakerSignalState(entry, remaining);

  useEffect(() => {
    setNow(Date.now());
    if (!entry || entry.timerRunning === false) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [entry]);

  const requestWakeLock = useCallback(async () => {
    const wakeLock = (navigator as WakeLockNavigator).wakeLock;
    if (!wakeLock) {
      setWakeLockStatus("unsupported");
      return;
    }

    try {
      const sentinel = await wakeLock.request("screen");
      wakeLockRef.current = sentinel;
      setWakeLockStatus("active");
      sentinel.addEventListener("release", () => {
        wakeLockRef.current = undefined;
        setWakeLockStatus("needs-action");
      }, { once: true });
    } catch {
      setWakeLockStatus("needs-action");
    }
  }, []);

  useEffect(() => {
    void requestWakeLock();
    const restoreWakeLock = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", restoreWakeLock);
    return () => {
      document.removeEventListener("visibilitychange", restoreWakeLock);
      void wakeLockRef.current?.release();
    };
  }, [requestWakeLock]);

  const enterFullscreen = () => {
    void document.documentElement.requestFullscreen?.();
    if (wakeLockStatus !== "active") void requestWakeLock();
  };

  return (
    <main
      className={cn(
        "relative grid min-h-[100dvh] place-items-center overflow-hidden px-6 py-10 transition-colors duration-300",
        signalStyles[signal]
      )}
    >
      <div className="absolute right-4 top-4 z-10 flex flex-wrap justify-end gap-2 sm:right-6 sm:top-6">
        <button
          type="button"
          onClick={enterFullscreen}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/40 bg-black/30 px-3 text-sm font-semibold text-white backdrop-blur hover:bg-black/45"
        >
          <Expand className="h-4 w-4" />
          <span className="hidden sm:inline">Full screen</span>
        </button>
      </div>

      <section className="grid w-full place-items-center text-center" aria-live="polite">
        {signal !== "idle" && !store.meetingEnded && (
          <div className="grid place-items-center gap-8">
            {signal === "warning" && (
              <p className="text-2xl font-extrabold uppercase sm:text-4xl">Time running out</p>
            )}
            <div
              className="text-8xl font-black leading-none tabular-nums sm:text-[12rem] lg:text-[16rem] xl:text-[20rem]"
              aria-label={`${formatRemaining(remaining)} remaining`}
            >
              {formatRemaining(remaining)}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
