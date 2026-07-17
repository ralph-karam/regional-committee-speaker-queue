import { DisplayApp } from "@/components/display-app";
import { StoreProvider } from "@/components/store-provider";

export default function DisplayPage() {
  return (
    <StoreProvider>
      <DisplayApp />
    </StoreProvider>
  );
}
