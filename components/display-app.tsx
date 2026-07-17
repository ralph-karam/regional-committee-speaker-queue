"use client";

import { Maximize2, Mic2 } from "lucide-react";
import { Clock } from "@/components/clock";
import { Button, Badge } from "@/components/ui";
import { speakerById } from "@/lib/queue-logic";
import { useQueueStore } from "@/lib/store";

export function DisplayApp() {
  const store = useQueueStore();
  const current = speakerById(store, store.currentEntry?.speakerId);
  const upcoming = store.queue.filter((entry) => entry.status === "waiting").slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-rows-[auto_1fr_auto] gap-8 px-8 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-md bg-unblue"><Mic2 className="h-8 w-8" /></div>
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
          <div className="rounded-lg border border-blue-400/40 bg-blue-500/15 p-8">
            <p className="text-xl font-bold uppercase text-blue-200">Now speaking</p>
            {current ? (
              <>
                <h2 className="mt-4 text-7xl font-bold leading-tight">{current.fullName}</h2>
                <p className="mt-4 text-4xl text-slate-100">{current.delegation}</p>
                <p className="mt-3 text-2xl text-slate-300">{current.title}</p>
                <div className="mt-8 flex flex-wrap gap-3"><Badge tone="blue">{store.currentEntry?.requestType}</Badge><Badge>{current.preferredLanguage}</Badge></div>
              </>
            ) : (
              <div className="py-20 text-5xl font-bold text-slate-300">Awaiting next speaker</div>
            )}
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-white/15 bg-white/10 p-6">
              <p className="text-lg font-bold uppercase text-slate-300">Next speaker</p>
              {upcoming[0] ? (
                <>
                  <h3 className="mt-3 text-4xl font-bold">{speakerById(store, upcoming[0].speakerId)?.fullName}</h3>
                  <p className="mt-2 text-2xl text-slate-300">{speakerById(store, upcoming[0].speakerId)?.delegation}</p>
                </>
              ) : <p className="mt-6 text-3xl text-slate-400">No speaker waiting</p>}
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-6">
              <p className="mb-4 text-lg font-bold uppercase text-slate-300">Upcoming queue</p>
              <div className="grid gap-3">
                {upcoming.slice(1).map((entry, index) => {
                  const speaker = speakerById(store, entry.speakerId);
                  return (
                    <div key={entry.id} className="grid grid-cols-[3rem_1fr] items-center rounded-md bg-white/10 p-4">
                      <div className="text-2xl font-bold text-blue-200">{index + 2}</div>
                      <div>
                        <div className="text-2xl font-bold">{speaker?.fullName}</div>
                        <div className="text-lg text-slate-300">{speaker?.delegation}</div>
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
