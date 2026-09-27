"use client";

import { Expand, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | undefined>(undefined);

  const remaining = remainingForEntry(entry, store.settings.defaultDurationSeconds, now);
  const signal = speakerSignalState(entry, remaining);
  const counter = formatRemaining(remaining);

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

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
    } else {
      await document.documentElement.requestFullscreen?.();
    }
    if (wakeLockStatus !== "active") void requestWakeLock();
  };

  return (
    <main
      className={cn(
        "relative grid h-[100dvh] place-items-center overflow-hidden p-2 transition-colors duration-300",
        signalStyles[signal]
      )}
    >
      <div className="absolute right-4 top-4 z-10 flex flex-wrap justify-end gap-2 sm:right-6 sm:top-6">
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/40 bg-black/30 px-3 text-sm font-semibold text-white backdrop-blur hover:bg-black/45"
          aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          <span className="hidden sm:inline">{isFullscreen ? "Exit full screen" : "Full screen"}</span>
        </button>
      </div>

      <section className="grid h-full min-h-0 w-full place-items-center text-center" aria-live="polite">
        {signal !== "idle" && !store.meetingEnded && (
          <div className={cn("grid h-full min-h-0 w-full place-items-center", signal === "warning" && "grid-rows-[auto_minmax(0,1fr)] gap-2 pt-14")}>
            {signal === "warning" && (
              <p className="text-2xl font-extrabold uppercase sm:text-4xl">Time running out</p>
            )}
            <FittedCounter value={counter} />
          </div>
        )}
      </section>
    </main>
  );
}

function FittedCounter({ value }: { value: string }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const text = textRef.current;
    if (!frame || !text) return;

    const fit = () => {
      const widthScale = (frame.clientWidth * 0.99) / text.offsetWidth;
      const heightScale = (frame.clientHeight * 0.99) / text.offsetHeight;
      setScale(Math.min(widthScale, heightScale));
    };

    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    observer.observe(text);
    fit();
    void document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={frameRef} className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          ref={textRef}
          className="w-max whitespace-nowrap text-[32rem] font-black leading-none tabular-nums"
          style={{ transform: `scale(${scale})` }}
          aria-label={`${value} remaining`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
