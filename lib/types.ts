export type SpeakerStatus = "available" | "queued" | "speaking" | "completed" | "unavailable";

export type SpeakerCategory =
  | "Member State"
  | "Observer"
  | "UN Entity"
  | "Intergovernmental Organization"
  | "Secretariat";

export type RequestType =
  | "General intervention"
  | "Point of order"
  | "Right of reply"
  | "Procedural intervention"
  | "Secretariat clarification"
  | "Other";

export interface Speaker {
  id: string;
  fullName: string;
  delegation: string;
  title?: string;
  category: SpeakerCategory;
  preferredLanguage?: string;
  status: SpeakerStatus;
}

export interface OperatorNote {
  id: string;
  speakerId: string;
  text: string;
  createdAt: string;
}

export interface QueueEntry {
  id: string;
  speakerId: string;
  requestType: RequestType;
  requestedAt: string;
  status: "waiting" | "hold" | "speaking" | "unavailable";
  note?: string;
}

export interface CompletedIntervention {
  id: string;
  speakerId: string;
  requestType: RequestType;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  note?: string;
}

export interface MeetingSettings {
  meetingTitle: string;
  sessionTitle: string;
  meetingDate: string;
  room: string;
  defaultDurationSeconds: number;
  warningThirtySeconds: boolean;
  warningTenSeconds: boolean;
  automaticPromotion: boolean;
  delegateRequestsEnabled: boolean;
  soundOnRequest: boolean;
  soundOnExpired: boolean;
  density: "comfortable" | "compact";
  darkMode: boolean;
}

export interface ActivityEvent {
  id: string;
  message: string;
  createdAt: string;
}

export interface QueueState {
  speakers: Speaker[];
  queue: QueueEntry[];
  currentEntry?: QueueEntry;
  completed: CompletedIntervention[];
  settings: MeetingSettings;
  activity: ActivityEvent[];
}
