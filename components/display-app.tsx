"use client";

import { Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Clock } from "@/components/clock";
import { Button, cn } from "@/components/ui";
import { speakerById } from "@/lib/queue-logic";
import { useQueueStore } from "@/lib/store";
import { formatRemaining, remainingForEntry, timerWarning } from "@/lib/timer-logic";
import { QueueEntry } from "@/lib/types";

export function DisplayApp() {
  const store = useQueueStore();
  const current = speakerById(store, store.currentEntry?.speakerId);
  const upcoming = store.queue.filter((entry) => entry.status === "waiting").slice(0, 5);

  return (
    <main className="min-h-screen bg-[#071625] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-rows-[auto_1fr_auto] gap-8 px-8 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5">
          <div className="flex items-center gap-4">
            <BrandLogo className="border-white/20" />
            <div>
              <h1 className="text-3xl font-bold">{store.settings.meetingTitle}</h1>
              <p className="mt-1 text-xl text-slate-300">{store.settings.sessionTitle} · {store.settings.room}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Clock large />
            <Button type="button" variant="secondary" onClick={() => document.documentElement.requestFullscreen?.()}><Maximize2 className="h-4 w-4" /> Full screen</Button>
          </div>
        </header>

        <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-rcteal/50 bg-[#0b2438] p-8 shadow-lift">
            <p className="text-xl font-bold uppercase text-blue-200">Now speaking</p>
            {current ? (
              <>
                <h2 className="mt-4 text-7xl font-bold leading-tight">{current.fullName}</h2>
                <p className="mt-4 text-4xl text-slate-100">{current.category}</p>
                {store.settings.showTimerOnDisplay && (
                  <DisplayTimer entry={store.currentEntry} fallbackSeconds={store.settings.defaultDurationSeconds} />
                )}
              </>
            ) : (
              <div className="py-20 text-5xl font-bold text-slate-300">Awaiting next speaker</div>
            )}
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-white/15 bg-white/10 p-6 shadow-soft">
              <p className="text-lg font-bold uppercase text-slate-300">Next speaker</p>
              {upcoming[0] ? (
                <>
                  <h3 className="mt-3 text-4xl font-bold">{speakerById(store, upcoming[0].speakerId)?.fullName}</h3>
                  <p className="mt-2 text-2xl text-slate-300">{speakerById(store, upcoming[0].speakerId)?.category}</p>
                </>
              ) : <p className="mt-6 text-3xl text-slate-400">No speaker waiting</p>}
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-6 shadow-soft">
              <p className="mb-4 text-lg font-bold uppercase text-slate-300">Upcoming queue</p>
              <div className="grid gap-3">
                {upcoming.slice(1).map((entry, index) => {
                  const speaker = speakerById(store, entry.speakerId);
                  return (
                    <div key={entry.id} className="grid grid-cols-[3rem_1fr] items-center rounded-md bg-white/10 p-4">
                      <div className="text-2xl font-bold text-blue-200">{index + 2}</div>
                      <div>
                        <div className="text-2xl font-bold">{speaker?.fullName}</div>
                        <div className="text-lg text-slate-300">{speaker?.category}</div>
                      </div>
                    </div>
                  );
                })}
                {upcoming.length <= 1 && <p className="rounded-md border border-dashed border-white/20 p-6 text-2xl text-slate-400">Additional speakers will appear here.</p>}
              </div>
            </div>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-white/15 pt-5 text-lg text-slate-300">
          <span>{new Date(`${store.settings.meetingDate}T00:00:00`).toLocaleDateString()}</span>
          <span>{store.queue.length} waiting · {store.completed.length} completed</span>
        </footer>
      </div>
    </main>
  );
}

function DisplayTimer({ entry, fallbackSeconds }: { entry?: QueueEntry; fallbackSeconds: number }) {
  const [remaining, setRemaining] = useState(() => remainingForEntry(entry, fallbackSeconds));

  useEffect(() => {
    setRemaining(remainingForEntry(entry, fallbackSeconds));
    if (entry?.timerRunning === false) return;
    const timer = window.setInterval(() => setRemaining(remainingForEntry(entry, fallbackSeconds)), 1000);
    return () => window.clearInterval(timer);
  }, [entry, fallbackSeconds]);

  const level = timerWarning(remaining);

  return (
    <div className={cn("mt-8 rounded-lg border p-6", level === "expired" ? "border-red-400 bg-red-500/20 text-red-100" : level === "final" || level === "warning" ? "border-amber-300 bg-amber-400/20 text-amber-100" : "border-white/20 bg-white/10 text-white")}>
      <p className="text-lg font-bold uppercase">{level === "expired" ? "Time expired" : level === "final" ? "Final 10 seconds" : level === "warning" ? "30 seconds remaining" : "Speaking time"}</p>
      <div className="mt-2 text-7xl font-bold tabular-nums">{formatRemaining(remaining)}</div>
    </div>
  );
}
