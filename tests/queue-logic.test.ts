import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSpeakerCsv } from "@/lib/csv";
import { createInitialState } from "@/lib/default-state";
import { addToQueue, defaultDurationForSpeaker, endCurrentSpeaker, reorderQueue, restoreCompleted, startNextSpeaker } from "@/lib/queue-logic";
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
    expect(state.queue[0].allocatedSeconds).toBe(180);
    expect(state.speakers.find((speaker) => speaker.id === "sp-argana")?.status).toBe("queued");
  });

  it("uses 2 minutes for observers and non-member states by default", () => {
    const state = createInitialState();
    const observer = state.speakers.find((speaker) => speaker.category === "Observer");
    expect(defaultDurationForSpeaker(state, observer)).toBe(120);
  });

  it("allows a custom speaking time per request", () => {
    const state = addToQueue(createInitialState(), "sp-argana", "General intervention", 300);
    expect(state.queue[0].allocatedSeconds).toBe(300);
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

describe("speaker CSV parsing", () => {
  it("imports compact MS rows without requiring a header", () => {
    const speakers = parseSpeakerCsv("MS,Lebanon");
    expect(speakers[0]).toMatchObject({
      fullName: "Lebanon",
      delegation: "Lebanon",
      category: "Member State",
      status: "available"
    });
    expect(speakers[0].title).toBeUndefined();
  });

  it("imports compact NSA rows as non-member speakers", () => {
    const speakers = parseSpeakerCsv("NSA,International Health Coalition");
    expect(speakers[0]).toMatchObject({
      fullName: "International Health Coalition",
      delegation: "International Health Coalition",
      category: "Non-State Actor"
    });
  });

  it("imports real agenda entity codes without falling back to Member State", () => {
    const speakers = parseSpeakerCsv([
      "Observer MS,Algeria",
      "IG,Organization of Islamic Cooperation (OIC)",
      "UN+Specialized+Related Agencies,\"International Civil Aviation Organization (ICAO), Middle East Office\"",
      "Government Entity,Abu Dhabi Fund for Development  (ADFD)"
    ].join("\n"));

    expect(speakers.map((speaker) => speaker.category)).toEqual([
      "Observer",
      "Intergovernmental Organization",
      "UN Entity",
      "Government Entity"
    ]);
    expect(speakers[1].fullName).toBe("Organization of Islamic Cooperation (OIC)");
    expect(speakers[2].fullName).toBe("International Civil Aviation Organization (ICAO), Middle East Office");
  });

  it("splits compact rows pasted as one wrapped line", () => {
    const speakers = parseSpeakerCsv("MS,KINGDOM OF BAHRAIN MS,DJIBOUTI MS,EGYPT NSA,Gates Foundation");
    expect(speakers.map((speaker) => speaker.fullName)).toEqual(["KINGDOM OF BAHRAIN", "DJIBOUTI", "EGYPT", "Gates Foundation"]);
    expect(speakers.map((speaker) => speaker.category)).toEqual(["Member State", "Member State", "Member State", "Non-State Actor"]);
  });

  it("still imports the full CSV format with a header", () => {
    const speakers = parseSpeakerCsv('fullName,delegation,title,category,preferredLanguage,status\n"Maya Haddad","Argana","Permanent Representative","Member State","Arabic","available"');
    expect(speakers[0]).toMatchObject({
      fullName: "Maya Haddad",
      delegation: "Argana",
      category: "Member State",
      preferredLanguage: "Arabic"
    });
  });
});
