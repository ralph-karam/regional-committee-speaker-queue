"use client";

import { Check, Download, FileUp, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandLogo, WhoLogo } from "@/components/brand-logo";
import { Badge, Button, Card, Field, inputClass } from "@/components/ui";
import { defaultSpeakerCategories, mergeCategories } from "@/lib/categories";
import { parseSpeakerCsv } from "@/lib/csv";
import { serializeCsv } from "@/lib/queue-logic";
import { useQueueStore } from "@/lib/store";
import { Speaker, SpeakerCategory } from "@/lib/types";

export function SpeakerManagementApp() {
  const store = useQueueStore();
  const [query, setQuery] = useState("");
  const [csvText, setCsvText] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<SpeakerCategory>("Member State");

  const categories = useMemo(
    () => mergeCategories(defaultSpeakerCategories, store.customCategories, store.speakers.map((speaker) => speaker.category)),
    [store.customCategories, store.speakers]
  );

  const speakers = useMemo(() => {
    const term = query.toLowerCase();
    return store.speakers
      .filter((speaker) => [speaker.fullName, speaker.delegation, speaker.title, speaker.category].join(" ").toLowerCase().includes(term))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [query, store.speakers]);

  const addSpeaker = (formData: FormData) => {
    const fullName = String(formData.get("fullName") ?? "").trim();
    if (!fullName) return;
    const speaker: Speaker = {
      id: `manual-${Date.now()}`,
      fullName,
      delegation: fullName,
      title: "",
      category: String(formData.get("category")) as SpeakerCategory,
      preferredLanguage: "",
      status: "available"
    };
    store.upsertSpeaker(speaker);
  };

  const addCategory = () => {
    const cleanCategory = newCategory.trim();
    if (!cleanCategory) return;
    store.addCategory(cleanCategory);
    setEditCategory(cleanCategory);
    setNewCategory("");
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
    <main className="min-h-screen bg-[#f6f8f5] dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="h-1 bg-[linear-gradient(90deg,#5a9f3f,#f47b20,#08779a)]" />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <BrandLogo compact />
            <div>
              <h1 className="text-xl font-bold">Manage Speakers</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Add, import, export, and delete the speaker directory</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <WhoLogo compact className="hidden sm:flex" />
            <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 font-semibold hover:bg-mist dark:border-slate-700 dark:bg-slate-900">
              Back to queue
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4">
          <Card className="p-4">
            <form action={addSpeaker} className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-lg font-bold"><Plus className="h-5 w-5 text-unblue" /> Add speaker</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Field label="Name"><input id="new-speaker-name" name="fullName" className={inputClass} required /></Field>
                <Field label="Category"><select name="category" className={inputClass} defaultValue="Member State">{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <div className="flex items-end">
                  <Button className="w-full" type="submit"><Plus className="h-4 w-4" /> Add speaker</Button>
                </div>
              </div>
            </form>
            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">Add category</div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input className={inputClass} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Example: Partner Organization" />
                <Button type="button" variant="secondary" onClick={addCategory} disabled={!newCategory.trim()}><Plus className="h-4 w-4" /> Add category</Button>
              </div>
            </div>
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
