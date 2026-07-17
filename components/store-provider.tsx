"use client";

import { useEffect, useRef } from "react";
import { selectSerializableState, useQueueStore } from "@/lib/store";
import { activeQueueService } from "@/lib/supabase-service";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useQueueStore((state) => state.hydrate);
  const hydrated = useQueueStore((state) => state.hydrated);
  const darkMode = useQueueStore((state) => state.settings.darkMode);
  const lastLocalChangeUntil = useRef(0);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    let applyingRemote = false;
    let saveTimer: number | undefined;
    const unsubscribe = useQueueStore.subscribe((state) => {
      if (!state.hydrated || applyingRemote) return;
      lastLocalChangeUntil.current = Date.now() + 1_000;
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        void state.persist(selectSerializableState(useQueueStore.getState()));
      }, 250);
    });
    const unsubscribeRemote = activeQueueService.subscribe?.((state) => {
      if (Date.now() < lastLocalChangeUntil.current) return;
      applyingRemote = true;
      useQueueStore.getState().applyRemoteState(state);
      window.setTimeout(() => {
        applyingRemote = false;
      }, 0);
    });
    return () => {
      window.clearTimeout(saveTimer);
      unsubscribe();
      unsubscribeRemote?.();
    };
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
