"use client";

import { CheckCircle2, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card, inputClass } from "@/components/ui";
import { speakerById } from "@/lib/queue-logic";
import { useQueueStore } from "@/lib/store";
import { RequestType } from "@/lib/types";

const requestTypes: RequestType[] = ["General intervention", "Point of order", "Right of reply", "Procedural intervention", "Secretariat clarification", "Other"];

export function DelegateRequestApp() {
  const store = useQueueStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("General intervention");
  const [submitted, setSubmitted] = useState(false);
  const selectedSpeaker = speakerById(store, selected);

  const speakers = useMemo(() => {
    const term = query.toLowerCase();
    return store.speakers
      .filter((speaker) => speaker.status !== "unavailable")
      .filter((speaker) => [speaker.fullName, speaker.delegation, speaker.title].join(" ").toLowerCase().includes(term))
      .slice(0, 8);
  }, [query, store.speakers]);

  const queuePosition = selected ? store.queue.findIndex((entry) => entry.speakerId === selected) + 1 : 0;
  const alreadyQueued = queuePosition > 0 || store.currentEntry?.speakerId === selected;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto grid max-w-3xl gap-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink dark:text-white">{store.settings.meetingTitle}</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Delegate request to speak</p>
          </div>
          <Link href="/" className="rounded-md border border-slate-200 bg-white px-4 py-2 font-semibold dark:border-slate-700 dark:bg-slate-900">Operator</Link>
        </header>

        {!store.settings.delegateRequestsEnabled && <Card className="p-5"><p className="font-bold">Delegate requests are currently closed.</p></Card>}

        <Card className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input className={`${inputClass} w-full pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for your name or delegation" />
          </div>
          <div className="mt-4 grid gap-2">
            {speakers.map((speaker) => (
              <button key={speaker.id} type="button" onClick={() => { setSelected(speaker.id); setSubmitted(false); }} className={`rounded-md border p-4 text-left transition ${selected === speaker.id ? "border-unblue bg-blue-50 dark:bg-blue-950" : "border-slate-200 bg-white hover:bg-mist dark:border-slate-800 dark:bg-slate-900"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold">{speaker.fullName}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{speaker.delegation} · {speaker.title}</div>
                  </div>
                  <Badge>{speaker.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="grid gap-4 p-5">
          <label className="grid gap-2 font-semibold">Request type<select className={inputClass} value={requestType} onChange={(event) => setRequestType(event.target.value as RequestType)}>{requestTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <Button
            type="button"
            size="lg"
            disabled={!selected || !store.settings.delegateRequestsEnabled || alreadyQueued}
            onClick={() => {
              store.addSpeakerToQueue(selected, requestType);
              setSubmitted(true);
            }}
          >
            Submit request
          </Button>
          {selectedSpeaker && <p className="text-sm text-slate-600 dark:text-slate-300">Selected: <strong>{selectedSpeaker.fullName}</strong>, {selectedSpeaker.delegation}</p>}
          {alreadyQueued && <div className="rounded-md border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">You are already in the active queue{queuePosition ? ` at position ${queuePosition}` : ""}.</div>}
          {submitted && !alreadyQueued && <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5" /> Request submitted.</div>}
        </Card>
      </div>
    </main>
  );
}
