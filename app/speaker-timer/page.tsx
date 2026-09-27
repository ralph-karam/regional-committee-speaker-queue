import type { Metadata } from "next";
import { SpeakerTimerDisplay } from "@/components/speaker-timer-display";
import { StoreProvider } from "@/components/store-provider";

export const metadata: Metadata = {
  title: "Speaker Timer | Regional Committee",
  description: "Room-facing speaking time signal for Regional Committee sessions"
};

export default function SpeakerTimerPage() {
  return (
    <StoreProvider readOnly>
      <SpeakerTimerDisplay />
    </StoreProvider>
  );
}
