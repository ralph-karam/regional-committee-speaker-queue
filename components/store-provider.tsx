"use client";

import { useEffect } from "react";
import { selectSerializableState, useQueueStore } from "@/lib/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useQueueStore((state) => state.hydrate);
  const hydrated = useQueueStore((state) => state.hydrated);
  const darkMode = useQueueStore((state) => state.settings.darkMode);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const unsubscribe = useQueueStore.subscribe((state) => {
      if (state.hydrated) state.persist(selectSerializableState(state));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const sync = () => hydrate();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  if (!hydrated) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 text-ink">Loading meeting workspace...</div>;
  }

  return children;
}
