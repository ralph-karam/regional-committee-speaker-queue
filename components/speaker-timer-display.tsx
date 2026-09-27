"use client";

import { Expand, LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { speakerById } from "@/lib/queue-logic";
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

const signalLabels = {
  idle: "Waiting for speaker",
  speaking: "Speaking",
  warning: "Time running out",
  expired: "Time is up"
};

export function SpeakerTimerDisplay() {
  const store = useQueueStore();
  const entry = store.currentEntry;
  const speaker = speakerById(store, entry?.speakerId);
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
          onClick={requestWakeLock}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/40 bg-black/30 px-3 text-sm font-semibold text-white backdrop-blur hover:bg-black/45"
          aria-label={wakeLockStatus === "active" ? "Screen wake lock is active" : "Keep screen awake"}
        >
          {wakeLockStatus === "active" ? <LockKeyhole className="h-4 w-4" /> : <LockKeyholeOpen className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {wakeLockStatus === "active" ? "Screen awake" : wakeLockStatus === "unsupported" ? "Wake lock unavailable" : "Keep awake"}
          </span>
        </button>
        <button
          type="button"
          onClick={enterFullscreen}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/40 bg-black/30 px-3 text-sm font-semibold text-white backdrop-blur hover:bg-black/45"
        >
          <Expand className="h-4 w-4" />
          <span className="hidden sm:inline">Full screen</span>
        </button>
      </div>

      <section className="grid w-full max-w-5xl place-items-center text-center" aria-live="polite">
        <p className="text-2xl font-extrabold uppercase tracking-normal sm:text-3xl">
          {store.meetingEnded ? "Meeting ended" : signalLabels[signal]}
        </p>

        {signal === "idle" || store.meetingEnded ? (
          <div className="mt-10 text-5xl font-bold leading-tight text-white/80 sm:text-7xl">
            {store.meetingEnded ? store.settings.sessionTitle : "The timer will begin when the next speaker starts."}
          </div>
        ) : (
          <>
            <div className="mt-6 text-[8rem] font-black leading-none tabular-nums sm:text-[11rem] lg:text-[14rem]">
              {formatRemaining(remaining)}
            </div>
            <div className="mt-8 max-w-4xl break-words text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl [overflow-wrap:anywhere]">
              {speaker?.fullName}
            </div>
            <div className="mt-3 text-2xl font-semibold opacity-85 sm:text-3xl">
              {speaker?.category}
            </div>
          </>
        )}
      </section>

      <p className="absolute bottom-4 left-4 right-4 text-center text-sm font-semibold text-white/70 sm:bottom-6">
        {store.settings.sessionTitle}
      </p>
    </main>
  );
}
