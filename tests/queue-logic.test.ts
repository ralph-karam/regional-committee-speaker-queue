import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/lib/default-state";
import { addToQueue, endCurrentSpeaker, reorderQueue, restoreCompleted, startNextSpeaker } from "@/lib/queue-logic";
import { localQueueService } from "@/lib/storage-service";
import { formatRemaining, timerWarning } from "@/lib/timer-logic";

describe("queue logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T10:00:00Z"));
  });

  it("adds a speaker to the queue", () => {
    const state = addToQueue(createInitialState(), "sp-argana", "Point of order");
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].requestType).toBe("Point of order");
    expect(state.speakers.find((speaker) => speaker.id === "sp-argana")?.status).toBe("queued");
  });

  it("prevents duplicate active requests", () => {
    const state = addToQueue(createInitialState(), "sp-argana");
    const duplicate = addToQueue(state, "sp-argana");
    expect(duplicate.queue).toHaveLength(1);
  });

  it("reorders the queue", () => {
    let state = addToQueue(createInitialState(), "sp-argana");
    state = addToQueue(state, "sp-belvaria");
    state = reorderQueue(state, state.queue[1].id, "up");
    expect(state.queue[0].speakerId).toBe("sp-belvaria");
  });

  it("starts the next speaker", () => {
    const queued = addToQueue(createInitialState(), "sp-argana");
    const state = startNextSpeaker(queued);
    expect(state.currentEntry?.speakerId).toBe("sp-argana");
    expect(state.queue).toHaveLength(0);
  });

  it("ends an intervention", () => {
    const started = startNextSpeaker(addToQueue(createInitialState(), "sp-argana"));
    const state = endCurrentSpeaker(started, 95);
    expect(state.currentEntry).toBeUndefined();
    expect(state.completed[0].durationSeconds).toBe(95);
    expect(state.speakers.find((speaker) => speaker.id === "sp-argana")?.status).toBe("completed");
  });

  it("restores a completed speaker to the queue", () => {
    const completed = endCurrentSpeaker(startNextSpeaker(addToQueue(createInitialState(), "sp-argana")), 60);
    const restored = restoreCompleted(completed, completed.completed[0].id);
    expect(restored.completed).toHaveLength(0);
    expect(restored.queue[0].speakerId).toBe("sp-argana");
  });
});

describe("timer logic", () => {
  it("returns accessible warning levels", () => {
    expect(timerWarning(31)).toBe("normal");
    expect(timerWarning(30)).toBe("warning");
    expect(timerWarning(10)).toBe("final");
    expect(timerWarning(-1)).toBe("expired");
  });

  it("formats remaining time", () => {
    expect(formatRemaining(65)).toBe("1:05");
    expect(formatRemaining(-5)).toBe("+0:05");
  });
});

describe("local storage service", () => {
  it("persists and loads state", () => {
    const state = addToQueue(createInitialState(), "sp-argana");
    localQueueService.save(state);
    expect(localQueueService.load().queue[0].speakerId).toBe("sp-argana");
  });
});
