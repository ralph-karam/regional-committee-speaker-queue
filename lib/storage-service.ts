import { createInitialState } from "@/lib/default-state";
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
      return { ...createInitialState(), ...JSON.parse(saved) } as QueueState;
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
