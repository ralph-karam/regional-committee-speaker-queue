import { sampleSpeakers } from "@/data/sample-speakers";
import { sessionTitles } from "@/lib/session-titles";
import { MeetingSettings, QueueState } from "@/lib/types";

export function currentDateInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export const createDefaultSettings = (): MeetingSettings => ({
  meetingTitle: "Regional Committee Speaker Queue",
  sessionTitle: sessionTitles[0],
  meetingDate: currentDateInputValue(),
  room: "Main conference room",
  defaultDurationSeconds: 180,
  memberStateDurationSeconds: 180,
  nonMemberStateDurationSeconds: 120,
  showTimerOnDisplay: true,
  warningThirtySeconds: true,
  warningTenSeconds: true,
  automaticPromotion: true,
  soundOnRequest: false,
  soundOnExpired: false,
  darkMode: false
});

export const defaultSettings: MeetingSettings = createDefaultSettings();

export const createInitialState = (): QueueState => ({
  speakers: sampleSpeakers,
  customCategories: [],
  queue: [],
  completed: [],
  meetingEnded: false,
  settings: createDefaultSettings(),
  activity: [{ id: "activity-initial", message: "Meeting workspace ready", createdAt: new Date().toISOString() }]
});
