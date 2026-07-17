import { DelegateRequestApp } from "@/components/request-app";
import { StoreProvider } from "@/components/store-provider";

export default function RequestPage() {
  return (
    <StoreProvider>
      <DelegateRequestApp />
    </StoreProvider>
  );
}
