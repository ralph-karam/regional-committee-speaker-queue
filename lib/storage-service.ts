import { createInitialState } from "@/lib/default-state";
import { sessionTitles } from "@/lib/session-titles";
import { QueueState } from "@/lib/types";

export interface QueueDataService {
  load(): QueueState;
  save(state: QueueState): void;
  clear(): void;
}

const storageKey = "regional-committee-speaker-queue";

export const localQueueService: QueueDataService = {
  load() {
    if (typeof window === "undefined") return createInitialState();
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return createInitialState();
    try {
      const initial = createInitialState();
      const parsed = JSON.parse(saved) as QueueState;
      return {
        ...initial,
        ...parsed,
        settings: {
          ...initial.settings,
          ...parsed.settings,
          sessionTitle: sessionTitles.includes(parsed.settings?.sessionTitle) ? parsed.settings.sessionTitle : initial.settings.sessionTitle
        },
        queue: (parsed.queue ?? []).map((entry) => ({ ...entry, allocatedSeconds: entry.allocatedSeconds ?? initial.settings.defaultDurationSeconds })),
        currentEntry: parsed.currentEntry ? { ...parsed.currentEntry, allocatedSeconds: parsed.currentEntry.allocatedSeconds ?? initial.settings.defaultDurationSeconds } : undefined
      };
    } catch {
      return createInitialState();
    }
  },
  save(state) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }
  },
  clear() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }
};
