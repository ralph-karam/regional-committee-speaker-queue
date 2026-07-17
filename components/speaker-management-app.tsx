"use client";

import { Check, Download, FileUp, Mic2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Field, inputClass } from "@/components/ui";
import { parseSpeakerCsv } from "@/lib/csv";
import { serializeCsv } from "@/lib/queue-logic";
import { useQueueStore } from "@/lib/store";
import { Speaker, SpeakerCategory } from "@/lib/types";

const categories: SpeakerCategory[] = ["Member State", "Non-State Actor", "Observer", "UN Entity", "Intergovernmental Organization", "Government Entity", "Secretariat"];

export function SpeakerManagementApp() {
  const store = useQueueStore();
  const [query, setQuery] = useState("");
  const [csvText, setCsvText] = useState("");
  const [addMode, setAddMode] = useState<"speaker" | "entity">("speaker");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<SpeakerCategory>("Member State");

  const speakers = useMemo(() => {
    const term = query.toLowerCase();
    return store.speakers
      .filter((speaker) => [speaker.fullName, speaker.delegation, speaker.title, speaker.category].join(" ").toLowerCase().includes(term))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [query, store.speakers]);

  const addSpeaker = (formData: FormData) => {
    const fullName = String(formData.get("fullName") ?? "").trim();
    const delegation = String(formData.get("delegation") ?? "").trim();
    const name = addMode === "entity" ? delegation : fullName;
    if (!name || !delegation) return;
    const speaker: Speaker = {
      id: `manual-${Date.now()}`,
      fullName: name,
      delegation,
      title: addMode === "entity" ? "" : String(formData.get("title") ?? ""),
      category: String(formData.get("category")) as SpeakerCategory,
      preferredLanguage: String(formData.get("preferredLanguage") ?? "English"),
      status: "available"
    };
    store.upsertSpeaker(speaker);
  };

  const importCsv = () => {
    if (!csvText.trim()) return;
    store.importSpeakers(parseSpeakerCsv(csvText));
    setCsvText("");
  };

  const download = (content: string, filename: string, type = "text/csv") => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (speaker: Speaker) => {
    setEditingId(speaker.id);
    setEditName(speaker.fullName);
    setEditCategory(speaker.category);
  };

  const saveEdit = (speaker: Speaker) => {
    const fullName = editName.trim();
    if (!fullName) return;
    store.upsertSpeaker({
      ...speaker,
      fullName,
      delegation: speaker.delegation === speaker.fullName ? fullName : speaker.delegation,
      category: editCategory
    });
    setEditingId(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-unblue text-white"><Mic2 aria-hidden /></div>
            <div>
              <h1 className="text-xl font-bold">Manage Speakers</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Add, import, export, and delete the speaker directory</p>
            </div>
          </div>
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 font-semibold hover:bg-mist dark:border-slate-700 dark:bg-slate-900">
            Back to queue
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4">
          <Card className="p-4">
            <form action={addSpeaker} className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-lg font-bold"><Plus className="h-5 w-5 text-unblue" /> Add speaker or entity</div>
                <div className="grid grid-cols-2 rounded-md border border-slate-200 p-1 text-sm font-semibold dark:border-slate-700">
                  <button type="button" className={`rounded px-3 py-2 ${addMode === "speaker" ? "bg-unblue text-white" : "text-slate-700 dark:text-slate-200"}`} onClick={() => setAddMode("speaker")}>Speaker</button>
                  <button type="button" className={`rounded px-3 py-2 ${addMode === "entity" ? "bg-unblue text-white" : "text-slate-700 dark:text-slate-200"}`} onClick={() => setAddMode("entity")}>Entity</button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {addMode === "speaker" && <Field label="Full name"><input id="new-speaker-name" name="fullName" className={inputClass} required /></Field>}
                <Field label={addMode === "entity" ? "Entity name" : "Delegation / entity"}><input name="delegation" className={inputClass} required /></Field>
                {addMode === "speaker" && <Field label="Title"><input name="title" className={inputClass} /></Field>}
                {addMode === "speaker" && <Field label="Language"><input name="preferredLanguage" className={inputClass} defaultValue="English" /></Field>}
                <Field label="Category"><select name="category" className={inputClass} defaultValue="Member State">{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <div className="flex items-end">
                  <Button className="w-full" type="submit"><Plus className="h-4 w-4" /> Add {addMode}</Button>
                </div>
              </div>
            </form>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-lg font-bold"><FileUp className="h-5 w-5 text-unblue" /> CSV import and export</div>
            <textarea
              className={`${inputClass} min-h-40 w-full`}
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              placeholder={"Paste rows such as:\nMS,Lebanon\nObserver MS,Algeria\nIG,Organization of Islamic Cooperation (OIC)\nUN+Specialized+Related Agencies,UNICEF\nNSA,Gates Foundation\nGovernment Entity,Saudi Fund for Development"}
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={importCsv} disabled={!csvText.trim()}><FileUp className="h-4 w-4" /> Import</Button>
              <Button type="button" variant="secondary" onClick={() => download(serializeCsv(store.speakers), "regional-committee-speakers.csv")}><Download className="h-4 w-4" /> Export</Button>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Speaker list</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{speakers.length} listed</Badge>
              <Button
                type="button"
                size="sm"
                variant="danger"
                disabled={!store.speakers.length}
                onClick={() => window.confirm("Are you sure you want to delete all saved speakers? This also clears the queue, current speaker, and completed history.") && store.clearSpeakers()}
              >
                <Trash2 className="h-4 w-4" /> Delete all
              </Button>
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input className={`${inputClass} w-full pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search speakers, entities, or categories" />
          </div>
          <div className="grid max-h-[760px] gap-2 overflow-auto pr-1">
            {speakers.map((speaker) => {
              const subtitle = speakerSubtitle(speaker);
              const editing = editingId === speaker.id;
              return (
                <article key={speaker.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {editing ? (
                        <div className="grid gap-2">
                          <input className={inputClass} value={editName} onChange={(event) => setEditName(event.target.value)} aria-label="Speaker name" />
                          <select className={inputClass} value={editCategory} onChange={(event) => setEditCategory(event.target.value as SpeakerCategory)} aria-label="Speaker group">
                            {categories.map((item) => <option key={item}>{item}</option>)}
                          </select>
                        </div>
                      ) : (
                        <>
                          <h3 className="break-words text-lg font-bold leading-tight [overflow-wrap:anywhere]">{speaker.fullName}</h3>
                          <p className="mt-1 text-sm font-semibold text-unblue">{speaker.category}</p>
                          {subtitle && <p className="mt-1 break-words text-sm text-slate-600 [overflow-wrap:anywhere] dark:text-slate-300">{subtitle}</p>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {editing ? (
                      <>
                        <Button type="button" size="sm" onClick={() => saveEdit(speaker)}><Check className="h-4 w-4" /> Save</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(null)}><X className="h-4 w-4" /> Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(speaker)}><Pencil className="h-4 w-4" /> Edit</Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => window.confirm(`Delete ${speaker.fullName} entirely? This removes them from the directory, queue, and history.`) && store.deleteSpeaker(speaker.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </Card>
      </section>
    </main>
  );
}

function speakerSubtitle(speaker: Speaker) {
  const details = [];
  if (speaker.delegation && speaker.delegation !== speaker.fullName) details.push(`Entity: ${speaker.delegation}`);
  if (speaker.title && !isFillerTitle(speaker.title, speaker.category)) details.push(speaker.title);
  return details.join(" · ");
}

function isFillerTitle(title: string, category: SpeakerCategory) {
  const normalized = title.trim().toLowerCase();
  return normalized === category.toLowerCase() || normalized === `${category.toLowerCase()} delegation`;
}
