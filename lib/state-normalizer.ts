import { createInitialState } from "@/lib/default-state";
import { sessionTitles } from "@/lib/session-titles";
import { QueueState } from "@/lib/types";

export function normalizeQueueState(saved?: Partial<QueueState> | null): QueueState {
  const initial = createInitialState();
  if (!saved) return initial;

  return {
    ...initial,
    ...saved,
    settings: {
      ...initial.settings,
      ...saved.settings,
      sessionTitle: sessionTitles.includes(saved.settings?.sessionTitle ?? "") ? saved.settings?.sessionTitle ?? initial.settings.sessionTitle : initial.settings.sessionTitle
    },
    queue: (saved.queue ?? []).map((entry) => ({ ...entry, allocatedSeconds: entry.allocatedSeconds ?? initial.settings.defaultDurationSeconds, elapsedSeconds: entry.elapsedSeconds ?? 0, timerRunning: entry.timerRunning ?? true })),
    currentEntry: saved.currentEntry ? { ...saved.currentEntry, allocatedSeconds: saved.currentEntry.allocatedSeconds ?? initial.settings.defaultDurationSeconds, elapsedSeconds: saved.currentEntry.elapsedSeconds ?? 0, timerRunning: saved.currentEntry.timerRunning ?? true } : undefined,
    speakers: saved.speakers ?? initial.speakers,
    customCategories: saved.customCategories ?? initial.customCategories,
    completed: saved.completed ?? initial.completed,
    meetingEnded: saved.meetingEnded ?? initial.meetingEnded,
    activity: saved.activity ?? initial.activity
  };
}
