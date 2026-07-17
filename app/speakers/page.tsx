import { SpeakerManagementApp } from "@/components/speaker-management-app";
import { StoreProvider } from "@/components/store-provider";

export default function SpeakersPage() {
  return (
    <StoreProvider>
      <SpeakerManagementApp />
    </StoreProvider>
  );
}
