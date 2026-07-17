import { createInitialState } from "@/lib/default-state";
import { normalizeQueueState } from "@/lib/state-normalizer";
import { QueueState } from "@/lib/types";

export interface QueueDataService {
  load(): QueueState | Promise<QueueState>;
  save(state: QueueState): void | Promise<void>;
  clear(): void | Promise<void>;
  subscribe?: (onState: (state: QueueState) => void) => () => void;
  mode: "local" | "supabase";
}

const storageKey = "regional-committee-speaker-queue";

export const localQueueService: QueueDataService = {
  mode: "local",
  load() {
    if (typeof window === "undefined") return createInitialState();
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return createInitialState();
    try {
      return normalizeQueueState(JSON.parse(saved) as QueueState);
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
