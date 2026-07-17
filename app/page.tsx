import { OperatorApp } from "@/components/operator-app";
import { StoreProvider } from "@/components/store-provider";

export default function Home() {
  return (
    <StoreProvider>
      <OperatorApp />
    </StoreProvider>
  );
}
