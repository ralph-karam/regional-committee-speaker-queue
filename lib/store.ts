"use client";

import { create } from "zustand";
import { createInitialState } from "@/lib/default-state";
import {
  addToQueue,
  endCurrentSpeaker,
  removeFromQueue,
  reorderQueue,
  restoreCompleted,
  returnCurrentToQueue,
  setSpeakerStatus,
  startNextSpeaker,
  updateEntry
} from "@/lib/queue-logic";
import { activeQueueService } from "@/lib/supabase-service";
import { MeetingSettings, QueueEntry, QueueState, RequestType, Speaker } from "@/lib/types";

type QueueStore = QueueState & {
  hydrated: boolean;
  lastSavedAt?: string;
  undoStack: QueueState[];
  hydrate: () => void;
  persist: (state: QueueState) => void | Promise<void>;
  applyRemoteState: (state: QueueState) => void;
  addSpeakerToQueue: (speakerId: string, requestType?: RequestType, allocatedSeconds?: number) => void;
  removeEntry: (entryId: string) => void;
  moveEntry: (entryId: string, direction: "up" | "down" | "top") => void;
  patchEntry: (entryId: string, patch: Partial<QueueEntry>) => void;
  startNext: () => void;
  goToNext: (elapsedSeconds?: number) => void;
  endCurrent: (elapsedSeconds: number) => void;
  returnCurrent: () => void;
  skipCurrent: () => void;
  restoreCompletedEntry: (completedId: string) => void;
  updateSettings: (settings: Partial<MeetingSettings>) => void;
  upsertSpeaker: (speaker: Speaker) => void;
  deleteSpeaker: (speakerId: string) => void;
  clearSpeakers: () => void;
  importSpeakers: (speakers: Speaker[]) => void;
  clearQueue: () => void;
  clearHistory: () => void;
  resetMeeting: () => void;
  undo: () => void;
};

const push = (current: QueueStore, next: QueueState, undo = true) => ({
  ...next,
  hydrated: current.hydrated,
  undoStack: undo ? [{ speakers: current.speakers, queue: current.queue, currentEntry: current.currentEntry, completed: current.completed, settings: current.settings, activity: current.activity }, ...current.undoStack].slice(0, 10) : current.undoStack,
  lastSavedAt: new Date().toISOString()
});

export const useQueueStore = create<QueueStore>((set, get) => ({
  ...createInitialState(),
  hydrated: false,
  undoStack: [],
  hydrate: () => {
    void Promise.resolve(activeQueueService.load()).then((loaded) => {
      set({ ...loaded, hydrated: true, undoStack: [], lastSavedAt: new Date().toISOString() });
    });
  },
  persist: (state) => activeQueueService.save(state),
  applyRemoteState: (state) => set((current) => ({ ...state, hydrated: true, undoStack: current.undoStack, lastSavedAt: new Date().toISOString() })),
  addSpeakerToQueue: (speakerId, requestType, allocatedSeconds) => set((current) => push(current, addToQueue(current, speakerId, requestType, allocatedSeconds))),
  removeEntry: (entryId) => set((current) => push(current, removeFromQueue(current, entryId))),
  moveEntry: (entryId, direction) => set((current) => push(current, reorderQueue(current, entryId, direction))),
  patchEntry: (entryId, patch) => set((current) => push(current, updateEntry(current, entryId, patch))),
  startNext: () => set((current) => push(current, startNextSpeaker(current))),
  goToNext: (elapsedSeconds = 0) => set((current) => {
    const ended = current.currentEntry ? endCurrentSpeaker(current, elapsedSeconds) : current;
    return push(current, startNextSpeaker(ended));
  }),
  endCurrent: (elapsedSeconds) => set((current) => push(current, endCurrentSpeaker(current, elapsedSeconds))),
  returnCurrent: () => set((current) => push(current, returnCurrentToQueue(current))),
  skipCurrent: () => set((current) => (current.currentEntry ? push(current, { ...current, currentEntry: undefined, activity: [{ id: `activity-${Date.now()}`, message: "Current speaker skipped", createdAt: new Date().toISOString() }, ...current.activity].slice(0, 12) }) : current)),
  restoreCompletedEntry: (completedId) => set((current) => push(current, restoreCompleted(current, completedId))),
  updateSettings: (settings) => set((current) => push(current, { ...current, settings: { ...current.settings, ...settings } }, false)),
  upsertSpeaker: (speaker) => set((current) => push(current, { ...current, speakers: current.speakers.some((item) => item.id === speaker.id) ? current.speakers.map((item) => (item.id === speaker.id ? speaker : item)) : [...current.speakers, speaker] })),
  deleteSpeaker: (speakerId) => set((current) => push(current, {
    ...current,
    speakers: current.speakers.filter((speaker) => speaker.id !== speakerId),
    queue: current.queue.filter((entry) => entry.speakerId !== speakerId),
    currentEntry: current.currentEntry?.speakerId === speakerId ? undefined : current.currentEntry,
    completed: current.completed.filter((entry) => entry.speakerId !== speakerId)
  })),
  clearSpeakers: () => set((current) => push(current, {
    ...current,
    speakers: [],
    queue: [],
    currentEntry: undefined,
    completed: [],
    activity: [{ id: `activity-${Date.now()}`, message: "All speakers deleted", createdAt: new Date().toISOString() }, ...current.activity].slice(0, 12)
  })),
  importSpeakers: (speakers) => set((current) => push(current, { ...current, speakers })),
  clearQueue: () => set((current) => push(current, { ...current, queue: [], currentEntry: undefined, speakers: current.speakers.map((speaker) => (speaker.status === "queued" || speaker.status === "speaking" ? { ...speaker, status: "available" } : speaker)) })),
  clearHistory: () => set((current) => push(current, { ...current, completed: [] })),
  resetMeeting: () => {
    const fresh = createInitialState();
    void activeQueueService.clear();
    set({ ...fresh, hydrated: true, undoStack: [], lastSavedAt: new Date().toISOString() });
  },
  undo: () => {
    const [previous, ...rest] = get().undoStack;
    if (previous) set({ ...previous, hydrated: true, undoStack: rest, lastSavedAt: new Date().toISOString() });
  }
}));

export function selectSerializableState(state: QueueStore): QueueState {
  return {
    speakers: state.speakers,
    queue: state.queue,
    currentEntry: state.currentEntry,
    completed: state.completed,
    settings: state.settings,
    activity: state.activity
  };
}
