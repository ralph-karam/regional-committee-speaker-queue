import type { Metadata, Viewport } from "next";
import { SpeakerTimerDisplay } from "@/components/speaker-timer-display";
import { StoreProvider } from "@/components/store-provider";

export const metadata: Metadata = {
  title: "Speaker Timer | Regional Committee",
  description: "Room-facing speaking time signal for Regional Committee sessions"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000"
};

export default function SpeakerTimerPage() {
  return (
    <StoreProvider readOnly>
      <SpeakerTimerDisplay />
    </StoreProvider>
  );
}
