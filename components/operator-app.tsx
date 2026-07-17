"use client";

import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Download,
  ExternalLink,
  Flag,
  History,
  Moon,
  Plus,
  Power,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  Undo2,
  Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo, WhoLogo } from "@/components/brand-logo";
import { Clock } from "@/components/clock";
import { SpeakerTimer } from "@/components/timer";
import { Badge, Button, Card, Field, inputClass } from "@/components/ui";
import { defaultSpeakerCategories, mergeCategories } from "@/lib/categories";
import { defaultDurationForSpeaker, speakerById } from "@/lib/queue-logic";
import { sessionTitles } from "@/lib/session-titles";
import { useQueueStore } from "@/lib/store";
import { RequestType, SpeakerCategory } from "@/lib/types";
import { elapsedForEntry } from "@/lib/timer-logic";

const defaultRequestType: RequestType = "General intervention";

export function OperatorApp() {
  const store = useQueueStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SpeakerCategory | "All">("All");
  const [historyQuery, setHistoryQuery] = useState("");
  const [mobileTab, setMobileTab] = useState("speakers");
  const searchRef = useRef<HTMLInputElement>(null);

  const currentSpeaker = speakerById(store, store.currentEntry?.speakerId);
  const nextEntry = store.queue.find((entry) => entry.status === "waiting");
  const nextSpeaker = speakerById(store, nextEntry?.speakerId);
  const hasLiveSession = Boolean(store.currentEntry || store.queue.length || store.completed.length);
  const categories = useMemo(
    () => ["All", ...mergeCategories(defaultSpeakerCategories, store.customCategories, store.speakers.map((speaker) => speaker.category))],
    [store.customCategories, store.speakers]
  );
  const filteredSpeakers = useMemo(() => {
    const term = query.toLowerCase();
    return store.speakers
      .filter((speaker) => category === "All" || speaker.category === category)
      .filter((speaker) => [speaker.fullName, speaker.delegation, speaker.title, speaker.preferredLanguage].join(" ").toLowerCase().includes(term))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [store.speakers, category, query]);

  const completed = store.completed.filter((entry) => {
    const speaker = speakerById(store, entry.speakerId);
    return [speaker?.fullName, speaker?.delegation, entry.requestType].join(" ").toLowerCase().includes(historyQuery.toLowerCase());
  });

  const changeSessionTitle = (sessionTitle: string) => {
    if (sessionTitle === store.settings.sessionTitle) return;
    const shouldReset = hasLiveSession || store.meetingEnded;
    if (shouldReset) {
      const ok = window.confirm("Changing sessions will reset the queue, current speaker, completed history, and loaded speaker. Continue?");
      if (!ok) return;
      store.endSession();
    }
    store.updateSettings({ sessionTitle });
  };

  const endSession = () => {
    const ok = window.confirm("End this session? This clears the queue, current speaker, completed history, and loaded speaker, but keeps saved speakers and meeting setup.");
    if (ok) store.endSession();
  };

  const endMeeting = () => {
    if (store.meetingEnded) return;
    const ok = window.confirm("End the meeting? This clears the queue, current speaker, and completed history, keeps saved speakers, and marks the display as meeting ended.");
    if (ok) store.endMeeting();
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (typing) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === "n") {
        if (store.currentEntry) store.endCurrent(elapsedForEntry(store.currentEntry));
        else store.startNext();
      }
      if (event.key.toLowerCase() === "e") store.endCurrent(elapsedForEntry(store.currentEntry));
      if (event.key.toLowerCase() === "f") window.open("/display", "_blank");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") store.undo();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store]);

  const download = (content: string, filename: string, type = "text/csv") => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#f6f8f5] dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="h-1 bg-[linear-gradient(90deg,#5a9f3f,#f47b20,#08779a)]" />
        <div className="mx-auto grid max-w-[1800px] gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex items-center gap-4">
            <WhoLogo compact />
            <div>
              <h1 className="text-xl font-bold">{store.settings.meetingTitle}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">{store.settings.sessionTitle} · {store.settings.room}</p>
            </div>
          </div>
          <BrandLogo compact className="hidden justify-self-end sm:flex" />
          <div className="flex flex-wrap items-center justify-end gap-2 lg:col-span-2">
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Saved {store.lastSavedAt ? new Date(store.lastSavedAt).toLocaleTimeString() : "locally"}</span>
            <Clock />
            <Link href="/display" target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 font-semibold hover:bg-mist dark:border-slate-700 dark:bg-slate-900">
              <ExternalLink className="h-4 w-4" /> Display
            </Link>
            <Link href="/speakers" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 font-semibold hover:bg-mist dark:border-slate-700 dark:bg-slate-900">
              <Users className="h-4 w-4" /> Manage speakers
            </Link>
            <Button type="button" variant="secondary" onClick={() => store.updateSettings({ darkMode: !store.settings.darkMode })}><Moon className="h-4 w-4" /> Theme</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1800px] gap-4 px-4 py-4">
        <Card className="border-t-4 border-t-rcgreen p-4">
          <div className="grid gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-lg font-bold"><Settings className="h-5 w-5 text-unblue" /> Meeting setup</div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(320px,1.5fr)_minmax(180px,1fr)_minmax(220px,1fr)]">
                <Field label="Meeting title"><input className={inputClass} value={store.settings.meetingTitle} onChange={(event) => store.updateSettings({ meetingTitle: event.target.value })} /></Field>
                <Field label="Session title"><select className={inputClass} value={store.settings.sessionTitle} onChange={(event) => changeSessionTitle(event.target.value)}>{sessionTitles.map((title) => <option key={title}>{title}</option>)}</select></Field>
                <Field label="Date"><input className={inputClass} type="date" value={store.settings.meetingDate} onChange={(event) => store.updateSettings({ meetingDate: event.target.value })} /></Field>
                <Field label="Room"><input className={inputClass} value={store.settings.room} onChange={(event) => store.updateSettings({ room: event.target.value })} /></Field>
                <Field label="Member State duration"><DurationSelect value={store.settings.memberStateDurationSeconds} onChange={(value) => store.updateSettings({ memberStateDurationSeconds: value, defaultDurationSeconds: value })} /></Field>
                <Field label="Observer and other duration"><DurationSelect value={store.settings.nonMemberStateDurationSeconds} onChange={(value) => store.updateSettings({ nonMemberStateDurationSeconds: value })} /></Field>
                <label className="flex min-h-11 min-w-0 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700 xl:col-span-2">
                  <input type="checkbox" checked={store.settings.showTimerOnDisplay} onChange={(event) => store.updateSettings({ showTimerOnDisplay: event.target.checked })} />
                  Show timer on display screen
                </label>
              </div>
              <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 dark:border-slate-800">
                <Button type="button" variant="secondary" onClick={endSession}><Flag className="h-4 w-4" /> End current session</Button>
                <Button type="button" variant="danger" onClick={endMeeting} disabled={store.meetingEnded}><Power className="h-4 w-4" /> End meeting</Button>
              </div>
              {store.meetingEnded && <div className="mt-3"><Badge tone="amber">Meeting ended</Badge></div>}
            </div>
          </div>
        </Card>

        <div className="grid gap-3 md:hidden">
          <div className="grid grid-cols-4 gap-2">
            {["speakers", "queue", "current", "history"].map((tab) => <Button key={tab} type="button" size="sm" variant={mobileTab === tab ? "primary" : "secondary"} onClick={() => setMobileTab(tab)}>{tab}</Button>)}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(330px,0.95fr)_minmax(420px,1.35fr)_minmax(330px,0.9fr)]">
          <section className={mobileTab !== "speakers" ? "hidden md:block" : ""}>
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-bold"><Users className="h-5 w-5 text-rcgreen" /> Speaker directory</h2>
                <Badge>{filteredSpeakers.length} listed</Badge>
              </div>
              <div className="grid gap-3">
                <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input ref={searchRef} className={`${inputClass} w-full pl-9`} placeholder="Search name, delegation, title" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
                <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
              </div>
              <div className="mt-4 grid max-h-[760px] gap-2 overflow-auto pr-1">
                {filteredSpeakers.map((speaker) => {
                  const disabled = speaker.status === "queued" || speaker.status === "speaking" || speaker.status === "unavailable";
                  return (
                    <article key={speaker.id} onDoubleClick={() => store.addSpeakerToQueue(speaker.id, defaultRequestType, defaultDurationForSpeaker(store, speaker))} className="grid gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800">
                      <div className="min-w-0">
                        <h3 className="break-words font-bold leading-tight [overflow-wrap:anywhere]">{speaker.fullName}</h3>
                        <p className="mt-1 text-sm font-semibold text-unblue">{speaker.category}</p>
                      </div>
                      <div className="grid gap-2">
                        <Button type="button" size="sm" disabled={disabled} onClick={() => store.addSpeakerToQueue(speaker.id, defaultRequestType, defaultDurationForSpeaker(store, speaker))}><Plus className="h-4 w-4" /> Add to queue</Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Card>
          </section>

          <section className={mobileTab !== "queue" ? "hidden md:block" : ""}>
            <Card className="p-4">
              <div className="mb-4 grid gap-3 md:grid-cols-4">
                <Stat label="Waiting" value={String(store.queue.filter((entry) => entry.status === "waiting").length)} />
                <Stat label="Current" value={currentSpeaker?.delegation ?? "None"} />
                <Stat label="Next" value={nextSpeaker?.delegation ?? "None"} />
                <Stat label="Completed" value={String(store.completed.length)} />
              </div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-bold"><ClipboardList className="h-5 w-5 text-rcteal" /> Active speaker queue</h2>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={store.undo} disabled={!store.undoStack.length}><Undo2 className="h-4 w-4" /> Undo</Button>
                  <Button type="button" variant="danger" onClick={() => window.confirm("Clear the full queue?") && store.clearQueue()} disabled={!store.queue.length}><Trash2 className="h-4 w-4" /> Clear queue</Button>
                </div>
              </div>
              <div className="grid gap-2">
                {!store.queue.length && <Empty title="No waiting speakers" detail="Add a speaker from the directory or manage the speaker list on the separate page." />}
                {store.queue.map((entry, index) => {
                  const speaker = speakerById(store, entry.speakerId);
                  return (
                    <article
                      key={entry.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("entry", entry.id)}
                      onDrop={(event) => {
                        const dragged = event.dataTransfer.getData("entry");
                        if (dragged && dragged !== entry.id) store.moveEntry(dragged, "top");
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-unblue">Position {index + 1}</div>
                          <h3 className="text-lg font-bold">{speaker?.fullName}</h3>
                          <p className="text-sm font-semibold text-unblue">{speaker?.category}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">Requested {new Date(entry.requestedAt).toLocaleTimeString()}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{formatDuration(entry.allocatedSeconds)}</Badge>
                        </div>
                      </div>
                      <label className="grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Speaking time
                        <DurationSelect value={entry.allocatedSeconds} onChange={(value) => store.patchEntry(entry.id, { allocatedSeconds: value })} />
                      </label>
                      <textarea className={`${inputClass} min-h-16`} value={entry.note ?? ""} onChange={(event) => store.patchEntry(entry.id, { note: event.target.value })} placeholder="Operator note" />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => store.moveEntry(entry.id, "up")}><ArrowUp className="h-4 w-4" /> Up</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => store.moveEntry(entry.id, "down")}><ArrowDown className="h-4 w-4" /> Down</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => window.confirm("Send this speaker to the top of the queue?") && store.moveEntry(entry.id, "top")}>Top</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => store.patchEntry(entry.id, { status: entry.status === "hold" ? "waiting" : "hold" })}>{entry.status === "hold" ? "Restore" : "Hold"}</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => store.patchEntry(entry.id, { status: "unavailable" })}>Unavailable</Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => store.removeEntry(entry.id)}><Trash2 className="h-4 w-4" /> Remove</Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Card>
          </section>

          <section className={mobileTab !== "current" ? "hidden md:block" : ""}>
            <Card className="sticky top-24 p-4">
              <h2 className="mb-3 text-lg font-bold">Now speaking</h2>
              {currentSpeaker ? (
                <div className="grid gap-4">
                  <div className="rounded-lg border border-rcteal/25 bg-[#eef8f8] p-5 dark:border-blue-900 dark:bg-blue-950">
                    <p className="text-sm font-bold uppercase text-unblue">On the floor</p>
                    <h3 className="mt-1 break-words text-2xl font-bold leading-tight [overflow-wrap:anywhere] xl:text-3xl">{currentSpeaker.fullName}</h3>
                    <p className="mt-2 break-words text-lg font-semibold text-unblue [overflow-wrap:anywhere]">{currentSpeaker.category}</p>
                    {store.currentEntry?.note && <p className="mt-3 rounded-md bg-white p-3 text-sm dark:bg-slate-900">{store.currentEntry.note}</p>}
                  </div>
                  <SpeakerTimer
                    entry={store.currentEntry}
                    durationSeconds={store.currentEntry?.allocatedSeconds ?? store.settings.defaultDurationSeconds}
                    onToggle={store.toggleCurrentTimer}
                    onReset={store.resetCurrentTimer}
                  />
                  <div className="grid gap-2">
                    <Button type="button" size="lg" onClick={() => store.endCurrent(elapsedForEntry(store.currentEntry))}>Done speaking</Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {store.meetingEnded ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950">
                      <p className="text-sm font-bold uppercase text-amber-800 dark:text-amber-200">Meeting status</p>
                      <h3 className="mt-1 text-2xl font-bold leading-tight xl:text-3xl">Meeting ended</h3>
                      <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">Start a new session by changing the session title or adding speakers to the queue.</p>
                    </div>
                  ) : nextSpeaker ? (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950">
                      <p className="text-sm font-bold uppercase text-unblue">Ready next speaker</p>
                      <h3 className="mt-1 break-words text-2xl font-bold leading-tight [overflow-wrap:anywhere] xl:text-3xl">{nextSpeaker.fullName}</h3>
                      <p className="mt-2 break-words text-lg font-semibold text-unblue [overflow-wrap:anywhere]">{nextSpeaker.category}</p>
                    </div>
                  ) : (
                    <Empty title="No active speaker" detail="Add a speaker to the queue before starting the next intervention." />
                  )}
                  <Button type="button" size="lg" onClick={store.startNext} disabled={!nextEntry}>Next speaker</Button>
                </div>
              )}
              <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <h3 className="font-bold">Activity log</h3>
                {store.activity.map((event) => <p key={event.id} className="text-sm text-slate-600 dark:text-slate-300">{new Date(event.createdAt).toLocaleTimeString()} · {event.message}</p>)}
              </div>
            </Card>
          </section>
        </div>

        <section className={mobileTab !== "history" ? "hidden md:block" : ""}>
          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-bold"><History className="h-5 w-5 text-unblue" /> Completed interventions</h2>
              <div className="flex flex-wrap gap-2">
                <input className={inputClass} placeholder="Search history" value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} />
                <Button type="button" variant="secondary" onClick={() => download(historyCsv(store), "regional-committee-history.csv")}><Download className="h-4 w-4" /> Export CSV</Button>
                <Button type="button" variant="danger" onClick={() => window.confirm("Clear completed intervention history?") && store.clearHistory()}><Trash2 className="h-4 w-4" /> Clear history</Button>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {!completed.length && <Empty title="No completed interventions" detail="Completed speakers will appear here with duration and notes." />}
              {completed.map((entry) => {
                const speaker = speakerById(store, entry.speakerId);
                return (
                  <article key={entry.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                    <h3 className="font-bold">{speaker?.fullName}</h3>
                    <p className="text-sm font-semibold text-unblue">{speaker?.category}</p>
                    <p className="mt-2 text-sm">{new Date(entry.startedAt).toLocaleTimeString()} to {new Date(entry.endedAt).toLocaleTimeString()} · {Math.round(entry.durationSeconds / 60)}m</p>
                    {entry.note && <p className="mt-2 rounded-md bg-slate-100 p-2 text-sm dark:bg-slate-800">{entry.note}</p>}
                    <Button className="mt-3" type="button" size="sm" variant="secondary" onClick={() => store.restoreCompletedEntry(entry.id)}><RotateCcw className="h-4 w-4" /> Restore to queue</Button>
                  </article>
                );
              })}
            </div>
          </Card>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"><div className="text-xs font-bold uppercase text-slate-500">{label}</div><div className="mt-1 max-h-16 overflow-hidden break-words text-lg font-bold leading-tight [overflow-wrap:anywhere]">{value}</div></div>;
}

function DurationSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <select className={inputClass} value={value} onChange={(event) => onChange(Number(event.target.value))}>
      <option value={60}>1 minute</option>
      <option value={120}>2 minutes</option>
      <option value={180}>3 minutes</option>
      <option value={300}>5 minutes</option>
      <option value={600}>10 minutes</option>
    </select>
  );
}

function formatDuration(seconds: number) {
  return `${Math.round(seconds / 60)} min`;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-md border border-dashed border-slate-300 p-5 text-center dark:border-slate-700"><p className="font-bold">{title}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{detail}</p></div>;
}

function historyCsv(store: ReturnType<typeof useQueueStore.getState>) {
  const header = "speaker,delegation,requestType,startedAt,endedAt,durationSeconds,note";
  const rows = store.completed.map((entry) => {
    const speaker = speakerById(store, entry.speakerId);
    return [speaker?.fullName, speaker?.delegation, entry.requestType, entry.startedAt, entry.endedAt, entry.durationSeconds, entry.note]
      .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
      .join(",");
  });
  return [header, ...rows].join("\n");
}
