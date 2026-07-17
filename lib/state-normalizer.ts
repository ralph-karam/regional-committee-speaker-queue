import { createInitialState, currentDateInputValue } from "@/lib/default-state";
import { sessionTitles } from "@/lib/session-titles";
import { QueueState } from "@/lib/types";

export function normalizeQueueState(saved?: Partial<QueueState> | null): QueueState {
  const initial = createInitialState();
  if (!saved) return initial;
  const savedDate = saved.settings?.meetingDate;
  const meetingDate = savedDate && /^\d{4}-\d{2}-\d{2}$/.test(savedDate) ? savedDate : currentDateInputValue();

  return {
    ...initial,
    ...saved,
    settings: {
      ...initial.settings,
      ...saved.settings,
      meetingDate,
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
