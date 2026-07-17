import { sampleSpeakers } from "@/data/sample-speakers";
import { MeetingSettings, QueueState } from "@/lib/types";

export const defaultSettings: MeetingSettings = {
  meetingTitle: "Regional Committee Speaker Queue",
  sessionTitle: "Plenary session",
  meetingDate: new Date().toISOString().slice(0, 10),
  room: "Main conference room",
  defaultDurationSeconds: 180,
  warningThirtySeconds: true,
  warningTenSeconds: true,
  automaticPromotion: true,
  delegateRequestsEnabled: true,
  soundOnRequest: false,
  soundOnExpired: false,
  density: "comfortable",
  darkMode: false
};

export const createInitialState = (): QueueState => ({
  speakers: sampleSpeakers,
  queue: [],
  completed: [],
  settings: defaultSettings,
  activity: [{ id: "activity-initial", message: "Meeting workspace ready", createdAt: new Date().toISOString() }]
});
