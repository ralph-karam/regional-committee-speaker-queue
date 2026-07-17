import { CompletedIntervention, QueueEntry, QueueState, RequestType, Speaker, SpeakerStatus } from "@/lib/types";
import { elapsedForEntry } from "@/lib/timer-logic";

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function speakerById(state: QueueState, speakerId?: string) {
  return state.speakers.find((speaker) => speaker.id === speakerId);
}

export function waitingQueue(state: QueueState) {
  return state.queue.filter((entry) => entry.status === "waiting");
}

export function averageWaitMinutes(state: QueueState) {
  if (state.queue.length === 0) return 0;
  const total = state.queue.reduce((sum, entry) => sum + Math.max(0, Date.now() - new Date(entry.requestedAt).getTime()), 0);
  return Math.round(total / state.queue.length / 60000);
}

export function setSpeakerStatus(speakers: Speaker[], speakerId: string, status: SpeakerStatus) {
  return speakers.map((speaker) => (speaker.id === speakerId ? { ...speaker, status } : speaker));
}

export function defaultDurationForSpeaker(state: QueueState, speaker?: Speaker) {
  if (!speaker) return state.settings.defaultDurationSeconds;
  return speaker.category === "Member State" ? state.settings.memberStateDurationSeconds : state.settings.nonMemberStateDurationSeconds;
}

export function addToQueue(state: QueueState, speakerId: string, requestType: RequestType = "General intervention", allocatedSeconds?: number): QueueState {
  const speaker = speakerById(state, speakerId);
  const alreadyActive = state.queue.some((entry) => entry.speakerId === speakerId) || state.currentEntry?.speakerId === speakerId;
  if (!speaker || alreadyActive || speaker.status === "unavailable") return state;

  const entry: QueueEntry = {
    id: id("queue"),
    speakerId,
    requestType,
    requestedAt: now(),
    allocatedSeconds: allocatedSeconds ?? defaultDurationForSpeaker(state, speaker),
    elapsedSeconds: 0,
    timerRunning: true,
    status: "waiting"
  };

  return {
    ...state,
    speakers: setSpeakerStatus(state.speakers, speakerId, "queued"),
    queue: [...state.queue, entry],
    activity: [{ id: id("activity"), message: `${speaker.fullName} added to queue`, createdAt: now() }, ...state.activity].slice(0, 12)
  };
}

export function removeFromQueue(state: QueueState, entryId: string): QueueState {
  const entry = state.queue.find((item) => item.id === entryId);
  if (!entry) return state;
  return {
    ...state,
    speakers: setSpeakerStatus(state.speakers, entry.speakerId, "available"),
    queue: state.queue.filter((item) => item.id !== entryId),
    activity: [{ id: id("activity"), message: "Speaker removed from queue", createdAt: now() }, ...state.activity].slice(0, 12)
  };
}

export function reorderQueue(state: QueueState, entryId: string, direction: "up" | "down" | "top"): QueueState {
  const index = state.queue.findIndex((entry) => entry.id === entryId);
  if (index < 0) return state;
  const next = [...state.queue];
  const [entry] = next.splice(index, 1);
  const target = direction === "top" ? 0 : direction === "up" ? Math.max(0, index - 1) : Math.min(next.length, index + 1);
  next.splice(target, 0, entry);
  return { ...state, queue: next, activity: [{ id: id("activity"), message: "Queue order updated", createdAt: now() }, ...state.activity].slice(0, 12) };
}

export function updateEntry(state: QueueState, entryId: string, patch: Partial<QueueEntry>): QueueState {
  return {
    ...state,
    queue: state.queue.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry))
  };
}

export function startNextSpeaker(state: QueueState): QueueState {
  if (state.currentEntry) return state;
  const next = state.queue.find((entry) => entry.status === "waiting");
  if (!next) return state;
  return {
    ...state,
    speakers: setSpeakerStatus(state.speakers, next.speakerId, "speaking"),
    queue: state.queue.filter((entry) => entry.id !== next.id),
    currentEntry: { ...next, status: "speaking", requestedAt: now(), elapsedSeconds: 0, timerRunning: true },
    activity: [{ id: id("activity"), message: "Intervention started", createdAt: now() }, ...state.activity].slice(0, 12)
  };
}

export function endCurrentSpeaker(state: QueueState, elapsedSeconds: number): QueueState {
  if (!state.currentEntry) return state;
  const completed: CompletedIntervention = {
    id: id("completed"),
    speakerId: state.currentEntry.speakerId,
    requestType: state.currentEntry.requestType,
    startedAt: state.currentEntry.requestedAt,
    endedAt: now(),
    durationSeconds: elapsedSeconds || elapsedForEntry(state.currentEntry),
    note: state.currentEntry.note
  };
  return {
    ...state,
    speakers: setSpeakerStatus(state.speakers, state.currentEntry.speakerId, "completed"),
    currentEntry: undefined,
    completed: [completed, ...state.completed],
    activity: [{ id: id("activity"), message: "Intervention completed", createdAt: now() }, ...state.activity].slice(0, 12)
  };
}

export function returnCurrentToQueue(state: QueueState): QueueState {
  if (!state.currentEntry) return state;
  return {
    ...state,
    speakers: setSpeakerStatus(state.speakers, state.currentEntry.speakerId, "queued"),
    queue: [{ ...state.currentEntry, status: "waiting", requestedAt: now() }, ...state.queue],
    currentEntry: undefined,
    activity: [{ id: id("activity"), message: "Speaker returned to queue", createdAt: now() }, ...state.activity].slice(0, 12)
  };
}

export function restoreCompleted(state: QueueState, completedId: string): QueueState {
  const item = state.completed.find((entry) => entry.id === completedId);
  if (!item) return state;
  return {
    ...addToQueue({ ...state, completed: state.completed.filter((entry) => entry.id !== completedId) }, item.speakerId, item.requestType),
    speakers: setSpeakerStatus(state.speakers, item.speakerId, "queued")
  };
}

export function serializeCsv(speakers: Speaker[]) {
  const header = ["fullName", "delegation", "title", "category", "preferredLanguage", "status"];
  const escape = (value?: string) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [header.join(","), ...speakers.map((speaker) => header.map((key) => escape(String(speaker[key as keyof Speaker] ?? ""))).join(","))].join("\n");
}
